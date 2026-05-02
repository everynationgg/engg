import { Request, Response, NextFunction, IRouter } from "express";
import { verifyToken } from "../../../lib/auth";
import { db } from "@workspace/db";

export interface AuthRequest extends Request {
  userId?: string;
  isGuest?: boolean;
}

export function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing or invalid authorization header" });
    return;
  }

  const token = authHeader.substring(7);
  const decoded = verifyToken(token);

  if (!decoded) {
    res.status(401).json({ error: "Invalid or expired token" });
    return;
  }

  req.userId = decoded.userId;
  req.isGuest = decoded.userId.startsWith("guest_");
  next();
}

/** Reject if user is a guest (unauthenticated/non-persistent identity). */
export function registeredOnly(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  if (req.isGuest) {
    res.status(403).json({ error: "REGISTRATION_REQUIRED", message: "This tactical interface requires a verified persistent identity." });
    return;
  }
  next();
}

/** Like authMiddleware but never rejects — simply sets req.userId when a valid token is present. */
export function optionalAuthMiddleware(
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    if (decoded) {
      req.userId = decoded.userId;
    }
  }
  next();
}
