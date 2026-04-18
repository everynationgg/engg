import { Router, type IRouter, type Request, type Response } from "express";
import rateLimit from "express-rate-limit";
import { logger } from "../lib/logger.js";

const ttsRouter: IRouter = Router();

const ttsLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // max 30 TTS requests per minute per IP
  message: { error: "Too many TTS requests, please slow down." },
  standardHeaders: true,
  legacyHeaders: false,
});

// POST /api/tts — convert text to speech via OpenAI TTS API
ttsRouter.post("/tts", ttsLimiter, async (req: Request, res: Response) => {
  const { text } = req.body as { text?: unknown };

  if (!text || typeof text !== "string" || text.trim().length === 0) {
    res.status(400).json({ error: "text is required" });
    return;
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    res.status(503).json({ error: "TTS service not configured" });
    return;
  }

  const truncated = text.slice(0, 4096);

  try {
    const upstream = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini-tts",
        input: truncated,
        voice: "alloy",
        response_format: "mp3",
      }),
    });

    if (!upstream.ok) {
      const err = await upstream.text();
      res.status(upstream.status).json({ error: "TTS upstream error", detail: err });
      return;
    }

    const audioBuffer = Buffer.from(await upstream.arrayBuffer());
    res.set("Content-Type", "audio/mpeg");
    res.set("Content-Length", String(audioBuffer.length));
    res.status(200).send(audioBuffer);
  } catch (err) {
    logger.error({ err }, "TTS proxy request failed");
    res.status(502).json({ error: "Failed to reach TTS service" });
  }
});

export { ttsRouter };
