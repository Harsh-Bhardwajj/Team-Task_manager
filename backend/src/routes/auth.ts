import { Router, type Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "@workspace/db";
import type { AuthRequest } from "../lib/auth.js";
import { requireAuth } from "../lib/auth.js";

const router = Router();

const COOKIE_NAME = process.env.COOKIE_NAME ?? "ttm_session";
const JWT_SECRET = process.env.JWT_SECRET ?? "";
const JWT_EXPIRES_IN = "7d";
const COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

function setAuthCookie(res: Response, token: string): void {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: COOKIE_MAX_AGE_MS,
  });
}

router.post("/register", async (req, res) => {
  const { name, email, password, role } = req.body as {
    name?: string;
    email?: string;
    password?: string;
    role?: string;
  };

  if (!name?.trim() || !email?.trim() || !password) {
    res.status(400).json({ success: false, message: "name, email, and password are required" });
    return;
  }

  if (!JWT_SECRET) {
    res.status(500).json({ success: false, message: "JWT_SECRET is not configured" });
    return;
  }

  const normalizedEmail = email.trim().toLowerCase();
  const existing = await User.findOne({ email: normalizedEmail });
  if (existing) {
    res.status(409).json({ success: false, message: "Email already in use" });
    return;
  }

  const validRole: "admin" | "member" = role === "admin" ? "admin" : "member";
  const passwordHash = await bcrypt.hash(password, 10);

  const user = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    passwordHash,
    role: validRole,
  });

  const token = jwt.sign({ sub: user.id, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  setAuthCookie(res, token);

  res.status(201).json(user.toJSON());
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body as { email?: string; password?: string };

  if (!email?.trim() || !password) {
    res.status(400).json({ success: false, message: "email and password are required" });
    return;
  }

  if (!JWT_SECRET) {
    res.status(500).json({ success: false, message: "JWT_SECRET is not configured" });
    return;
  }

  const normalizedEmail = email.trim().toLowerCase();
  const user = await User.findOne({ email: normalizedEmail });
  if (!user) {
    res.status(401).json({ success: false, message: "Invalid credentials" });
    return;
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    res.status(401).json({ success: false, message: "Invalid credentials" });
    return;
  }

  const token = jwt.sign({ sub: user.id, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  setAuthCookie(res, token);

  res.json(user.toJSON());
});

router.post("/logout", (req, res) => {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
  res.json({ success: true });
});

router.get("/me", requireAuth, async (req: AuthRequest, res) => {
  res.json(req.dbUser!.toJSON());
});

export default router;
