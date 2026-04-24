import { Router, type IRouter } from "express";
import { db, usersTable, creditTransactionsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { authMiddleware, type AuthRequest } from "../middlewares/auth.js";
import { randomUUID } from "node:crypto";
import { logger } from "../lib/logger.js";

const router: IRouter = Router();

const PAYPAL_API = process.env.PAYPAL_MODE === "live" 
  ? "https://api-m.paypal.com" 
  : "https://api-m.sandbox.paypal.com";

const CREDIT_PACKS = [
  { id: "pack_250", name: "Standard Core", amount: 250, price: "4.99", currency: "USD" },
  { id: "pack_500", name: "Tactical Core", amount: 500, price: "8.99", currency: "USD" },
  { id: "pack_1000", name: "Elite Core", amount: 1000, price: "15.99", currency: "USD" },
  { id: "pack_2500", name: "Sovereign Core", amount: 2500, price: "34.99", currency: "USD" },
];

async function getPayPalAccessToken() {
  const auth = Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`).toString("base64");
  const response = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
    method: "POST",
    body: "grant_type=client_credentials",
    headers: {
      Authorization: `Basic ${auth}`,
    },
  });
  const data = await response.json() as any;
  return data.access_token;
}

router.get("/shop/config", (req, res) => {
  res.json({ packs: CREDIT_PACKS });
});

router.post("/shop/create-order", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { packId } = req.body;
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
    res.json(order);
  } catch (error) {
    logger.error({ error }, "PayPal order creation failed");
    res.status(500).json({ error: "Failed to create PayPal order" });
  }
});

router.post("/shop/capture-order", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { orderID, packId } = req.body;
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
          await db.transaction(async (tx) => {
            // 2. IDEMPOTENCY CHECK
            // Ensure this orderID hasn't been processed before
            const existing = await tx.select().from(creditTransactionsTable).where(eq(creditTransactionsTable.paypalOrderId, orderID)).limit(1);
            if (existing.length > 0) {
              throw new Error("ALREADY_PROCESSED");
            }

            // 3. Update user balance
            await tx
              .update(usersTable)
              .set({ credits: sql`${usersTable.credits} + ${creditAmount}` })
              .where(eq(usersTable.id, userId));

            // 4. Record transaction with PayPal ID
            await tx.insert(creditTransactionsTable).values({
              id: randomUUID(),
              userId,
              amount: creditAmount,
              type: "purchase",
              paypalOrderId: orderID,
              description: `Purchased ${creditAmount} credits via PayPal`,
            });
          });

          logger.info({ userId, creditAmount, orderID }, "Credits successfully added via PayPal");
          res.json({ success: true, credits: creditAmount });
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
