import { Router, type IRouter } from "express";
import { db, usersTable, creditTransactionsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { authMiddleware, registeredOnly, type AuthRequest } from "../auth/middleware";
import { randomUUID } from "node:crypto";
import { logger } from "../../../lib/logger.js";

const router: IRouter = Router();

const PAYPAL_MODE = (process.env.PAYPAL_MODE || "sandbox").trim().toLowerCase();
const PAYPAL_API = PAYPAL_MODE === "live"
  ? "https://api-m.paypal.com"
  : "https://api-m.sandbox.paypal.com";

logger.info({ mode: PAYPAL_MODE, endpoint: PAYPAL_API }, "PayPal Service Initialized");

const CREDIT_PACKS = [
  { id: "pack_250", name: "Standard Core", amount: 250, price: "4.99", currency: "USD", rarity: "common" },
  { id: "pack_500", name: "Tactical Core", amount: 500, price: "8.99", currency: "USD", rarity: "rare" },
  { id: "pack_1000", name: "Elite Core", amount: 1000, price: "15.99", currency: "USD", rarity: "epic" },
  { id: "pack_2500", name: "Sovereign Core", amount: 2500, price: "34.99", currency: "USD", rarity: "legendary" },
];

async function getPayPalAccessToken() {
  const clientId = (process.env.PAYPAL_CLIENT_ID || "").trim();
  const clientSecret = (process.env.PAYPAL_CLIENT_SECRET || "").trim();

  if (!clientId || !clientSecret) {
    throw new Error("MISSING_PAYPAL_CREDENTIALS");
  }
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const response = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
    method: "POST",
    body: "grant_type=client_credentials",
    headers: {
      Authorization: `Basic ${auth}`,
    },
  });
  if (!response.ok) {
    const errorData = await response.json() as any;
    logger.error({ errorData, status: response.status }, "PayPal OAuth failed");
    throw new Error(`PAYPAL_OAUTH_FAILED:${errorData.error_description || errorData.error || "Unknown Error"}`);
  }
  const data = await response.json() as any;
  return data.access_token;
}

router.get("/shop/config", async (req, res) => {
  const userId = req.query.userId as string;
  let purchasedPackIds: string[] = [];

  if (userId) {
    try {
      const existingPurchases = await db
        .select({ packId: creditTransactionsTable.packId })
        .from(creditTransactionsTable)
        .where(sql`${creditTransactionsTable.userId} = ${userId} AND ${creditTransactionsTable.type} = 'purchase'`);
      
      purchasedPackIds = existingPurchases
        .map(p => p.packId)
        .filter((id): id is string => !!id);
    } catch (err) {
      logger.error({ err }, "Error checking purchased packs in config");
    }
  }

  res.json({ 
    packs: CREDIT_PACKS.map(pack => ({
      ...pack,
      hasBonus: !purchasedPackIds.includes(pack.id)
    })),
    // Backward compatibility for older clients
    isFirstPurchase: purchasedPackIds.length === 0 
  });
});

import { createOrderSchema, captureOrderSchema } from "./shop.schemas.js";

router.post("/shop/create-order", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const result = createOrderSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ error: result.error.errors[0].message });
      return;
    }
    const { packId } = result.data;
    const pack = CREDIT_PACKS.find((p) => p.id === packId);

    if (!pack) {
      res.status(400).json({ error: "Invalid credit pack" });
      return;
    }

    const accessToken = await getPayPalAccessToken();
    const response = await fetch(`${PAYPAL_API}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            amount: {
              currency_code: pack.currency,
              value: pack.price,
            },
            description: pack.name,
            custom_id: req.userId, // Store userId here to verify on capture
          },
        ],
      }),
    });

    const order = await response.json() as any;
    if (!response.ok) {
      logger.error({ order, status: response.status }, "PayPal order creation failed at provider");
      res.status(response.status).json({ error: order.message || "Failed to create PayPal order" });
      return;
    }
    res.json(order);
  } catch (error: any) {
    logger.error({ error }, "PayPal order creation failed internally");
    if (error.message === "MISSING_PAYPAL_CREDENTIALS") {
      res.status(500).json({ error: "Server Error: PayPal secrets not configured on host." });
    } else if (error.message.startsWith("PAYPAL_OAUTH_FAILED:")) {
      res.status(500).json({ error: `PayPal Auth Error: ${error.message.split(":")[1]}` });
    } else {
      res.status(500).json({ error: "Internal server error during order creation" });
    }
  }
});

router.post("/shop/capture-order", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const result = captureOrderSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ error: result.error.errors[0].message });
      return;
    }
    const { orderID, packId } = result.data;
    const pack = CREDIT_PACKS.find((p) => p.id === packId);

    if (!pack) {
      res.status(400).json({ error: "Invalid pack ID" });
      return;
    }

    const accessToken = await getPayPalAccessToken();
    const response = await fetch(`${PAYPAL_API}/v2/checkout/orders/${orderID}/capture`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const captureData = await response.json() as any;

    if (captureData.status === "COMPLETED") {
      // 1. PRICE VERIFICATION
      // Check if the amount paid matches our pack price to prevent frontend tampering
      const purchaseUnit = captureData.purchase_units?.[0];
      const capturedAmount = purchaseUnit?.payments?.captures?.[0]?.amount?.value;

      if (capturedAmount !== pack.price) {
        logger.error({ orderID, capturedAmount, expectedPrice: pack.price }, "Price mismatch detected!");
        res.status(400).json({ error: "Price verification failed. Potential tampering detected." });
        return;
      }

      const userId = req.userId;
      const creditAmount = pack.amount;

      if (userId) {
        try {
          let isFirstPurchase = false;
          let finalCreditAmount = pack.amount;

          await db.transaction(async (tx) => {
            // Check if this SPECIFIC pack was purchased before to apply X2 bonus
            const previousPackPurchases = await tx
              .select()
              .from(creditTransactionsTable)
              .where(sql`${creditTransactionsTable.userId} = ${userId} AND ${creditTransactionsTable.type} = 'purchase' AND ${creditTransactionsTable.packId} = ${pack.id}`)
              .limit(1);

            const isFirstPackPurchase = previousPackPurchases.length === 0;
            finalCreditAmount = isFirstPackPurchase ? pack.amount * 2 : pack.amount;

            // 2. IDEMPOTENCY CHECK
            const existing = await tx.select().from(creditTransactionsTable).where(eq(creditTransactionsTable.paypalOrderId, orderID)).limit(1);
            if (existing.length > 0) {
              throw new Error("ALREADY_PROCESSED");
            }

            // Fetch user details for the transaction log
            const user = await tx.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
            const userInfo = user[0];

            // 3. Update user balance
            await tx
              .update(usersTable)
              .set({ credits: sql`${usersTable.credits} + ${finalCreditAmount}` })
              .where(eq(usersTable.id, userId));

            // 4. Record transaction with PayPal ID, User details, and packId
            await tx.insert(creditTransactionsTable).values({
              id: randomUUID(),
              userId,
              username: userInfo?.username || "Unknown",
              email: userInfo?.email || "Unknown",
              amount: finalCreditAmount,
              type: "purchase",
              paypalOrderId: orderID,
              packId: pack.id,
              description: isFirstPackPurchase 
                ? `First Time Purchase X2 Bonus (${pack.name}): ${finalCreditAmount} credits via PayPal`
                : `Purchased ${finalCreditAmount} credits via PayPal (${pack.name})`,
            });

            isFirstPurchase = isFirstPackPurchase;
          });

          logger.info({ userId, creditAmount: finalCreditAmount, orderID, isFirstPurchase }, "Credits successfully added via PayPal");
          res.json({ success: true, credits: finalCreditAmount, isFirstPurchase });
        } catch (err: any) {
          if (err.message === "ALREADY_PROCESSED") {
            res.status(400).json({ error: "Order already processed" });
          } else {
            throw err;
          }
        }
      } else {
        res.status(401).json({ error: "User context lost" });
      }
    } else {
      res.status(400).json({ error: "Payment not completed", details: captureData });
    }
  } catch (error) {
    logger.error({ error }, "PayPal capture failed");
    res.status(500).json({ error: "Failed to capture PayPal order" });
  }
});

// ── PAYMONGO INTEGRATION ──────────────────────────────────────────────────────

function getPHPAmount(usdPrice: string): number {
  // e.g. "4.99" -> 28000 (PHP 280.00)
  const priceMap: Record<string, number> = {
    "4.99": 28000,
    "8.99": 50000,
    "15.99": 90000,
    "34.99": 195000,
  };
  return priceMap[usdPrice] || Math.round(parseFloat(usdPrice) * 56) * 100;
}

router.post("/shop/paymongo-create-session", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { packId } = req.body;
    const pack = CREDIT_PACKS.find((p) => p.id === packId);

    if (!pack) {
      res.status(400).json({ error: "Invalid credit pack" });
      return;
    }

    const secretKey = (process.env.PAYMONGO_SECRET_KEY || "").trim();
    if (!secretKey) {
      res.status(500).json({ error: "PayMongo secret key not configured on host." });
      return;
    }

    const authHeader = "Basic " + Buffer.from(secretKey + ":").toString("base64");

    const phpCents = getPHPAmount(pack.price);

    const body = {
      data: {
        attributes: {
          line_items: [
            {
              amount: phpCents,
              currency: "PHP",
              name: pack.name,
              quantity: 1,
            },
          ],
          payment_method_types: ["card", "gcash", "paymaya", "grab_pay", "qrph"],
          send_email_receipt: false,
          success_url: `${process.env.FRONTEND_URL || "https://www.engg.online"}/profile?success=true`,
          cancel_url: `${process.env.FRONTEND_URL || "https://www.engg.online"}/profile?cancel=true`,
          metadata: {
            userId: req.userId,
            packId: pack.id,
          },
        },
      },
    };

    const response = await fetch("https://api.paymongo.com/v1/checkout_sessions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
      body: JSON.stringify(body),
    });

    const resData = await response.json() as any;
    if (!response.ok) {
      logger.error({ resData, status: response.status }, "PayMongo checkout session creation failed");
      res.status(response.status).json({ error: resData.errors?.[0]?.detail || "Failed to create PayMongo checkout session" });
      return;
    }

    const checkoutUrl = resData.data?.attributes?.checkout_url;
    res.json({ checkoutUrl });
  } catch (error) {
    logger.error({ error }, "PayMongo session creation failed internally");
    res.status(500).json({ error: "Internal server error during PayMongo checkout creation" });
  }
});

// PayMongo Webhook Handler
router.post("/shop/paymongo-webhook", async (req, res) => {
  try {
    const event = req.body;
    const eventType = event.data?.attributes?.type;

    if (eventType !== "checkout_session.payment.paid") {
      res.json({ received: true, ignored: true });
      return;
    }

    const checkoutSessionId = event.data?.attributes?.data?.id;
    if (!checkoutSessionId) {
      res.status(400).json({ error: "Missing checkout session ID in event" });
      return;
    }

    const secretKey = (process.env.PAYMONGO_SECRET_KEY || "").trim();
    const authHeader = "Basic " + Buffer.from(secretKey + ":").toString("base64");

    // Fetch the checkout session details directly from PayMongo to verify status securely
    const verifyResponse = await fetch(`https://api.paymongo.com/v1/checkout_sessions/${checkoutSessionId}`, {
      headers: { Authorization: authHeader },
    });

    if (!verifyResponse.ok) {
      logger.error({ status: verifyResponse.status, checkoutSessionId }, "Failed to verify PayMongo checkout session");
      res.status(400).json({ error: "PayMongo verification query failed" });
      return;
    }

    const sessionData = await verifyResponse.json() as any;
    const status = sessionData.data?.attributes?.status;

    if (status !== "paid") {
      logger.warn({ status, checkoutSessionId }, "PayMongo checkout session is not fully paid yet");
      res.status(400).json({ error: `Session status is ${status}` });
      return;
    }

    const metadata = sessionData.data?.attributes?.metadata || {};
    const userId = metadata.userId;
    const packId = metadata.packId;

    if (!userId || !packId) {
      logger.error({ metadata, checkoutSessionId }, "Missing metadata in PayMongo checkout session");
      res.status(400).json({ error: "Missing required metadata in payment session" });
      return;
    }

    const pack = CREDIT_PACKS.find((p) => p.id === packId);
    if (!pack) {
      res.status(400).json({ error: "Invalid pack in metadata" });
      return;
    }

    const email = sessionData.data?.attributes?.payments?.[0]?.attributes?.billing?.email || "Unknown";

    // DB Transaction to credit coins and log transaction
    let finalCreditAmount = pack.amount;
    let isFirstPurchase = false;

    await db.transaction(async (tx) => {
      // 1. Idempotency Check
      const existing = await tx
        .select()
        .from(creditTransactionsTable)
        .where(eq(creditTransactionsTable.paypalOrderId, checkoutSessionId))
        .limit(1);

      if (existing.length > 0) {
        throw new Error("ALREADY_PROCESSED");
      }

      // 2. First purchase bonus check
      const previousPackPurchases = await tx
        .select()
        .from(creditTransactionsTable)
        .where(sql`${creditTransactionsTable.userId} = ${userId} AND ${creditTransactionsTable.type} = 'purchase' AND ${creditTransactionsTable.packId} = ${pack.id}`)
        .limit(1);

      const isFirstPackPurchase = previousPackPurchases.length === 0;
      finalCreditAmount = isFirstPackPurchase ? pack.amount * 2 : pack.amount;

      const user = await tx.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
      const userInfo = user[0];

      // 3. Update guest coins balance
      await tx
        .update(usersTable)
        .set({ credits: sql`${usersTable.credits} + ${finalCreditAmount}` })
        .where(eq(usersTable.id, userId));

      // 4. Overwrite guest email with verified payment recovery email
      if (email && email !== "Unknown") {
        await tx
          .update(usersTable)
          .set({ email: email })
          .where(eq(usersTable.id, userId));
      }

      // 5. Log transaction
      await tx.insert(creditTransactionsTable).values({
        id: randomUUID(),
        userId,
        username: userInfo?.username || "Unknown",
        email: email,
        amount: finalCreditAmount,
        type: "purchase",
        paypalOrderId: checkoutSessionId, // Store PayMongo session ID for idempotency/reference
        packId: pack.id,
        description: isFirstPackPurchase 
          ? `First Time Purchase X2 Bonus (${pack.name}): ${finalCreditAmount} credits via PayMongo (GCash)`
          : `Purchased ${finalCreditAmount} credits via PayMongo (GCash) (${pack.name})`,
      });

      isFirstPurchase = isFirstPackPurchase;
    });

    logger.info({ userId, creditAmount: finalCreditAmount, checkoutSessionId, email }, "Credits successfully added via PayMongo (GCash)");
    res.json({ success: true, credits: finalCreditAmount, isFirstPurchase });
  } catch (err: any) {
    if (err.message === "ALREADY_PROCESSED") {
      res.json({ success: true, message: "Webhook already processed" });
    } else {
      logger.error({ err }, "PayMongo webhook processing error");
      res.status(500).json({ error: "Internal processing failure" });
    }
  }
});

export default router;
