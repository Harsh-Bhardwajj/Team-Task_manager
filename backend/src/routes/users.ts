import { Router } from "express";
import { User } from "@workspace/db";
import type { AuthRequest } from "../lib/auth.js";
import { requireAuth } from "../lib/auth.js";

const router = Router();

// GET /api/users/me — return current user
router.get("/me", requireAuth, async (req: AuthRequest, res) => {
  res.json(req.dbUser!.toJSON());
});

// PUT /api/users/me/profile — update display name
router.put("/me/profile", requireAuth, async (req: AuthRequest, res) => {
  const { name } = req.body as { name?: string };
  if (!name?.trim()) {
    res.status(400).json({ success: false, message: "name is required" });
    return;
  }

  const updated = await User.findByIdAndUpdate(
    req.dbUser!._id,
    { name: name.trim() },
    { new: true }
  );

  res.json(updated!.toJSON());
});

// PUT /api/users/me/role — update a user's role (admin only)
router.put("/me/role", requireAuth, async (req: AuthRequest, res) => {
  if (req.dbUser?.role !== "admin") {
    res.status(403).json({ success: false, message: "Admin access required" });
    return;
  }

  const { role, targetUserId } = req.body as {
    role: string;
    targetUserId: string;
  };

  if (!role || !["admin", "member"].includes(role)) {
    res.status(400).json({ success: false, message: "Invalid role" });
    return;
  }

  if (!targetUserId) {
    res.status(400).json({ success: false, message: "targetUserId is required" });
    return;
  }

  const updated = await User.findByIdAndUpdate(
    targetUserId,
    { role: role as "admin" | "member" },
    { new: true }
  );

  if (!updated) {
    res.status(404).json({ success: false, message: "User not found" });
    return;
  }

  res.json(updated.toJSON());
});

// GET /api/users — list all users
router.get("/", requireAuth, async (_req: AuthRequest, res) => {
  const users = await User.find().sort({ name: 1 });
  res.json(users.map((u) => u.toJSON()));
});

export default router;
