import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { User } from "@workspace/db";
import type { IUser } from "@workspace/db";

export interface AuthRequest extends Request {
  dbUser?: IUser & { _id: import("mongoose").Types.ObjectId };
}

const COOKIE_NAME = process.env.COOKIE_NAME ?? "ttm_session";
const JWT_SECRET = process.env.JWT_SECRET;

function getTokenFromRequest(req: Request): string | null {
  const token = req.cookies?.[COOKIE_NAME];
  return typeof token === "string" ? token : null;
}

function verifyToken(token: string): { sub: string } | null {
  if (!JWT_SECRET) return null;
  try {
    return jwt.verify(token, JWT_SECRET) as { sub: string };
  } catch {
    return null;
  }
}

export async function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const token = getTokenFromRequest(req);
  if (!token) {
    res.status(401).json({ success: false, message: "Unauthorized" });
    return;
  }

  const payload = verifyToken(token);
  if (!payload?.sub) {
    res.status(401).json({ success: false, message: "Unauthorized" });
    return;
  }

  const user = await User.findById(payload.sub);
  if (!user) {
    res.status(401).json({ success: false, message: "User not found" });
    return;
  }

  req.dbUser = user as IUser & { _id: import("mongoose").Types.ObjectId };
  next();
}

export async function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  await requireAuth(req, res, async () => {
    if (req.dbUser?.role !== "admin") {
      res.status(403).json({ success: false, message: "Admin access required" });
      return;
    }
    next();
  });
}
