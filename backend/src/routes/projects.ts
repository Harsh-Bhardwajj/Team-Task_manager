import { Router } from "express";
import mongoose from "mongoose";
import { Project, Task, User } from "@workspace/db";
import { requireAuth, requireAdmin } from "../lib/auth.js";
import { logActivity } from "../lib/activity.js";
import type { AuthRequest } from "../lib/auth.js";

const router = Router();

// GET /api/projects — list projects for current user
router.get("/", requireAuth, async (req: AuthRequest, res) => {
  const user = req.dbUser!;

  const query =
    user.role === "admin" ? {} : { members: user._id };

  const projects = await Project.find(query).sort({ createdAt: -1 });

  const projectIds = projects.map((p) => p._id);
  const taskCounts = await Task.aggregate([
    { $match: { projectId: { $in: projectIds } } },
    { $group: { _id: "$projectId", count: { $sum: 1 } } },
  ]);
  const taskCountMap = new Map(
    taskCounts.map((t) => [t._id.toString(), t.count])
  );

  res.json(
    projects.map((p) => ({
      ...p.toJSON(),
      memberIds: p.members.map((m) => m.toString()),
      taskCount: taskCountMap.get(p._id.toString()) ?? 0,
    }))
  );
});

// POST /api/projects — create project (admin only)
router.post("/", requireAdmin, async (req: AuthRequest, res) => {
  const user = req.dbUser!;
  const { name, description, memberIds } = req.body as {
    name: string;
    description?: string;
    memberIds?: string[];
  };

  if (!name) {
    res.status(400).json({ success: false, message: "name is required" });
    return;
  }

  const project = await Project.create({
    name,
    description: description ?? "",
    createdBy: user._id,
    members: memberIds ?? [],
  });

  await logActivity({
    action: "created project",
    entityType: "project",
    entityId: project._id.toString(),
    entityTitle: project.name,
    userId: user._id.toString(),
    projectId: project._id.toString(),
  });

  res.status(201).json({
    ...project.toJSON(),
    memberIds: project.members.map((m) => m.toString()),
    taskCount: 0,
  });
});

// GET /api/projects/:projectId — get project detail
router.get("/:projectId", requireAuth, async (req: AuthRequest, res) => {
  const projectId = req.params.projectId as string;
  const user = req.dbUser!;

  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    res.status(404).json({ success: false, message: "Project not found" });
    return;
  }

  const project = await Project.findById(projectId);
  if (!project) {
    res.status(404).json({ success: false, message: "Project not found" });
    return;
  }

  if (user.role !== "admin") {
    const isMember = project.members.some(
      (m) => m.toString() === user._id.toString()
    );
    if (!isMember) {
      res.status(403).json({ success: false, message: "Access denied" });
      return;
    }
  }

  const members = await User.find({ _id: { $in: project.members } });
  const tasks = await Task.find({ projectId: project._id });

  const assignedUserIds = tasks
    .map((t) => t.assignedTo)
    .filter(Boolean) as mongoose.Types.ObjectId[];
  const assignedUsers = await User.find({ _id: { $in: assignedUserIds } });
  const assignedUserMap = new Map(
    assignedUsers.map((u) => [u._id.toString(), u.name])
  );

  res.json({
    ...project.toJSON(),
    members: members.map((m) => m.toJSON()),
    tasks: tasks.map((t) => ({
      ...t.toJSON(),
      projectName: project.name,
      assignedToName: t.assignedTo
        ? (assignedUserMap.get(t.assignedTo.toString()) ?? null)
        : null,
    })),
  });
});

// PUT /api/projects/:projectId — update project (admin only)
router.put("/:projectId", requireAdmin, async (req: AuthRequest, res) => {
  const projectId = req.params.projectId as string;
  const user = req.dbUser!;
  const { name, description, memberIds } = req.body as {
    name?: string;
    description?: string;
    memberIds?: string[];
  };

  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    res.status(404).json({ success: false, message: "Project not found" });
    return;
  }

  const updates: Record<string, unknown> = {};
  if (name !== undefined) updates.name = name;
  if (description !== undefined) updates.description = description;
  if (memberIds !== undefined) updates.members = memberIds;

  const project = await Project.findByIdAndUpdate(projectId, updates, {
    new: true,
  });
  if (!project) {
    res.status(404).json({ success: false, message: "Project not found" });
    return;
  }

  await logActivity({
    action: "updated project",
    entityType: "project",
    entityId: project._id.toString(),
    entityTitle: project.name,
    userId: user._id.toString(),
    projectId: project._id.toString(),
  });

  const taskCount = await Task.countDocuments({ projectId: project._id });

  res.json({
    ...project.toJSON(),
    memberIds: project.members.map((m) => m.toString()),
    taskCount,
  });
});

// DELETE /api/projects/:projectId — delete project (admin only)
router.delete("/:projectId", requireAdmin, async (req: AuthRequest, res) => {
  const projectId = req.params.projectId as string;
  const user = req.dbUser!;

  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    res.status(404).json({ success: false, message: "Project not found" });
    return;
  }

  const project = await Project.findByIdAndDelete(projectId);
  if (!project) {
    res.status(404).json({ success: false, message: "Project not found" });
    return;
  }

  await Task.deleteMany({ projectId: project._id });

  await logActivity({
    action: "deleted project",
    entityType: "project",
    entityId: project._id.toString(),
    entityTitle: project.name,
    userId: user._id.toString(),
  });

  res.status(204).send();
});

// POST /api/projects/:projectId/members — add member (admin only)
router.post(
  "/:projectId/members",
  requireAdmin,
  async (req: AuthRequest, res) => {
    const projectId = req.params.projectId as string;
    const { userId } = req.body as { userId: string };

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      res.status(404).json({ success: false, message: "Project not found" });
      return;
    }

    const project = await Project.findByIdAndUpdate(
      projectId,
      { $addToSet: { members: new mongoose.Types.ObjectId(userId) } },
      { new: true }
    );

    if (!project) {
      res.status(404).json({ success: false, message: "Project not found" });
      return;
    }

    const taskCount = await Task.countDocuments({ projectId: project._id });

    res.json({
      ...project.toJSON(),
      memberIds: project.members.map((m) => m.toString()),
      taskCount,
    });
  }
);

// DELETE /api/projects/:projectId/members/:userId — remove member (admin only)
router.delete(
  "/:projectId/members/:userId",
  requireAdmin,
  async (req: AuthRequest, res) => {
    const projectId = req.params.projectId as string;
    const userId = req.params.userId as string;

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      res.status(404).json({ success: false, message: "Project not found" });
      return;
    }

    const project = await Project.findByIdAndUpdate(
      projectId,
      { $pull: { members: new mongoose.Types.ObjectId(userId) } },
      { new: true }
    );

    if (!project) {
      res.status(404).json({ success: false, message: "Project not found" });
      return;
    }

    const taskCount = await Task.countDocuments({ projectId: project._id });

    res.json({
      ...project.toJSON(),
      memberIds: project.members.map((m) => m.toString()),
      taskCount,
    });
  }
);

export default router;
