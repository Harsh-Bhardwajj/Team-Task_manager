import { Router } from "express";
import mongoose from "mongoose";
import { ActivityLog, User, Project } from "@workspace/db";
import { requireAuth } from "../lib/auth.js";
import type { AuthRequest } from "../lib/auth.js";

const router = Router();

// GET /api/activity — list recent activity
router.get("/", requireAuth, async (req: AuthRequest, res) => {
  const { projectId, limit: limitStr = "20" } = req.query as Record<string, string>;
  const limitNum = Math.min(100, Math.max(1, parseInt(limitStr)));

  const filter: Record<string, unknown> = {};
  if (projectId && mongoose.Types.ObjectId.isValid(projectId)) {
    filter.projectId = new mongoose.Types.ObjectId(projectId);
  }

  const logs = await ActivityLog.find(filter)
    .sort({ createdAt: -1 })
    .limit(limitNum);

  const userIds = logs.map((l) => l.userId);
  const projectIds = logs.map((l) => l.projectId).filter(Boolean);

  const [users, projects] = await Promise.all([
    User.find({ _id: { $in: userIds } }),
    Project.find({ _id: { $in: projectIds } }),
  ]);

  const userMap = new Map(users.map((u) => [u._id.toString(), u.name]));
  const projectMap = new Map(projects.map((p) => [p._id.toString(), p.name]));

  res.json(
    logs.map((l) => ({
      ...l.toJSON(),
      userName: userMap.get(l.userId.toString()) ?? "Unknown",
      projectName: l.projectId
        ? (projectMap.get(l.projectId.toString()) ?? null)
        : null,
    }))
  );
});

export default router;
