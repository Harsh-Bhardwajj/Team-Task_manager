import { Router } from "express";
import mongoose from "mongoose";
import { Task, User, Project } from "@workspace/db";
import { requireAuth, requireAdmin } from "../lib/auth.js";
import { logActivity } from "../lib/activity.js";
import type { AuthRequest } from "../lib/auth.js";

const router = Router();

// GET /api/tasks — list tasks with filters and pagination
router.get("/", requireAuth, async (req: AuthRequest, res) => {
  const user = req.dbUser!;
  const {
    projectId,
    status,
    priority,
    assignedTo,
    search,
    page = "1",
    limit: limitStr = "20",
  } = req.query as Record<string, string>;

  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, Math.max(1, parseInt(limitStr)));

  const filter: Record<string, unknown> = {};

  if (user.role !== "admin") {
    const memberProjects = await Project.find({ members: user._id }, { _id: 1 });
    const memberProjectIds = memberProjects.map((p) => p._id);
    if (memberProjectIds.length === 0) {
      res.json({ tasks: [], total: 0, page: pageNum, limit: limitNum, totalPages: 0 });
      return;
    }
    filter.projectId = { $in: memberProjectIds };
  }

  if (projectId && mongoose.Types.ObjectId.isValid(projectId)) {
    filter.projectId = new mongoose.Types.ObjectId(projectId);
  }

  if (status) filter.status = status;
  if (priority) filter.priority = priority;
  if (assignedTo && mongoose.Types.ObjectId.isValid(assignedTo)) {
    filter.assignedTo = new mongoose.Types.ObjectId(assignedTo);
  }
  if (search) filter.title = { $regex: search, $options: "i" };

  const total = await Task.countDocuments(filter);
  const tasks = await Task.find(filter)
    .sort({ createdAt: -1 })
    .skip((pageNum - 1) * limitNum)
    .limit(limitNum);

  const projectIds = [...new Set(tasks.map((t) => t.projectId.toString()))];
  const assignedUserIds = [
    ...new Set(tasks.map((t) => t.assignedTo?.toString()).filter(Boolean)),
  ];

  const [projects, assignedUsers] = await Promise.all([
    Project.find({ _id: { $in: projectIds } }),
    User.find({ _id: { $in: assignedUserIds } }),
  ]);

  const projectMap = new Map(projects.map((p) => [p._id.toString(), p.name]));
  const userMap = new Map(assignedUsers.map((u) => [u._id.toString(), u.name]));

  res.json({
    tasks: tasks.map((t) => ({
      ...t.toJSON(),
      projectName: projectMap.get(t.projectId.toString()) ?? "",
      assignedToName: t.assignedTo
        ? (userMap.get(t.assignedTo.toString()) ?? null)
        : null,
    })),
    total,
    page: pageNum,
    limit: limitNum,
    totalPages: Math.ceil(total / limitNum),
  });
});

// POST /api/tasks — create task (admin only)
router.post("/", requireAdmin, async (req: AuthRequest, res) => {
  const user = req.dbUser!;
  const {
    title,
    description,
    projectId,
    assignedTo,
    status,
    priority,
    dueDate,
  } = req.body as {
    title: string;
    description?: string;
    projectId: string;
    assignedTo?: string | null;
    status?: string;
    priority?: string;
    dueDate?: string | null;
  };

  if (!title || !projectId) {
    res.status(400).json({ success: false, message: "title and projectId are required" });
    return;
  }

  const project = await Project.findById(projectId);
  if (!project) {
    res.status(404).json({ success: false, message: "Project not found" });
    return;
  }

  const task = await Task.create({
    title,
    description: description ?? "",
    projectId,
    assignedTo: assignedTo ?? null,
    status: status ?? "pending",
    priority: priority ?? "medium",
    dueDate: dueDate ? new Date(dueDate) : null,
  });

  await logActivity({
    action: "created task",
    entityType: "task",
    entityId: task._id.toString(),
    entityTitle: task.title,
    userId: user._id.toString(),
    projectId: task.projectId.toString(),
  });

  let assignedToName: string | null = null;
  if (task.assignedTo) {
    const assignedUser = await User.findById(task.assignedTo);
    assignedToName = assignedUser?.name ?? null;
  }

  res.status(201).json({
    ...task.toJSON(),
    projectName: project.name,
    assignedToName,
  });
});

// GET /api/tasks/:taskId — get task by ID
router.get("/:taskId", requireAuth, async (req: AuthRequest, res) => {
  const taskId = req.params.taskId as string;
  const user = req.dbUser!;

  if (!mongoose.Types.ObjectId.isValid(taskId)) {
    res.status(404).json({ success: false, message: "Task not found" });
    return;
  }

  const task = await Task.findById(taskId);
  if (!task) {
    res.status(404).json({ success: false, message: "Task not found" });
    return;
  }

  if (user.role !== "admin") {
    const project = await Project.findOne({
      _id: task.projectId,
      members: user._id,
    });
    if (!project) {
      res.status(403).json({ success: false, message: "Access denied" });
      return;
    }
  }

  const [project, assignedUser] = await Promise.all([
    Project.findById(task.projectId),
    task.assignedTo ? User.findById(task.assignedTo) : null,
  ]);

  res.json({
    ...task.toJSON(),
    projectName: project?.name ?? "",
    assignedToName: assignedUser?.name ?? null,
  });
});

// PUT /api/tasks/:taskId — update task
router.put("/:taskId", requireAuth, async (req: AuthRequest, res) => {
  const taskId = req.params.taskId as string;
  const user = req.dbUser!;

  if (!mongoose.Types.ObjectId.isValid(taskId)) {
    res.status(404).json({ success: false, message: "Task not found" });
    return;
  }

  const task = await Task.findById(taskId);
  if (!task) {
    res.status(404).json({ success: false, message: "Task not found" });
    return;
  }

  if (
    user.role !== "admin" &&
    task.assignedTo?.toString() !== user._id.toString()
  ) {
    res.status(403).json({ success: false, message: "You can only update tasks assigned to you" });
    return;
  }

  const { title, description, assignedTo, status, priority, dueDate } =
    req.body as {
      title?: string;
      description?: string;
      assignedTo?: string | null;
      status?: string;
      priority?: string;
      dueDate?: string | null;
    };

  const updates: Record<string, unknown> = {};
  if (title !== undefined) updates.title = title;
  if (description !== undefined) updates.description = description;
  if (status !== undefined) updates.status = status;
  if (priority !== undefined) updates.priority = priority;
  if (assignedTo !== undefined) updates.assignedTo = assignedTo ?? null;
  if (dueDate !== undefined) updates.dueDate = dueDate ? new Date(dueDate) : null;

  const updated = await Task.findByIdAndUpdate(taskId, updates, { new: true });
  if (!updated) {
    res.status(404).json({ success: false, message: "Task not found" });
    return;
  }

  await logActivity({
    action: `updated task${status ? ` status to ${status}` : ""}`,
    entityType: "task",
    entityId: updated._id.toString(),
    entityTitle: updated.title,
    userId: user._id.toString(),
    projectId: updated.projectId.toString(),
  });

  const [project, assignedUser] = await Promise.all([
    Project.findById(updated.projectId),
    updated.assignedTo ? User.findById(updated.assignedTo) : null,
  ]);

  res.json({
    ...updated.toJSON(),
    projectName: project?.name ?? "",
    assignedToName: assignedUser?.name ?? null,
  });
});

// DELETE /api/tasks/:taskId — delete task (admin only)
router.delete("/:taskId", requireAdmin, async (req: AuthRequest, res) => {
  const taskId = req.params.taskId as string;
  const user = req.dbUser!;

  if (!mongoose.Types.ObjectId.isValid(taskId)) {
    res.status(404).json({ success: false, message: "Task not found" });
    return;
  }

  const task = await Task.findByIdAndDelete(taskId);
  if (!task) {
    res.status(404).json({ success: false, message: "Task not found" });
    return;
  }

  await logActivity({
    action: "deleted task",
    entityType: "task",
    entityId: task._id.toString(),
    entityTitle: task.title,
    userId: user._id.toString(),
    projectId: task.projectId.toString(),
  });

  res.status(204).send();
});

export default router;
