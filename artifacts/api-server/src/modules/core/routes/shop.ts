import { Router, type IRouter } from "express";
import { db, usersTable, creditTransactionsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { authMiddleware, type AuthRequest } from "../auth/middleware";
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

export default router;
