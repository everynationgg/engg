import { z } from "zod";

export const createOrderSchema = z.object({
  packId: z.enum(["pack_250", "pack_500", "pack_1000", "pack_2500"], {
    errorMap: () => ({ message: "Invalid credit pack selected" }),
  }),
});

export const captureOrderSchema = z.object({
  orderID: z.string().min(1, "PayPal Order ID is required"),
  packId: z.enum(["pack_250", "pack_500", "pack_1000", "pack_2500"], {
    errorMap: () => ({ message: "Invalid credit pack selected" }),
  }),
});
