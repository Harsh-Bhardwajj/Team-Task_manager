import { Router } from "express";
import { Task, Project, User } from "@workspace/db";
import { requireAuth } from "../lib/auth.js";
import type { AuthRequest } from "../lib/auth.js";

const router = Router();

// GET /api/dashboard/summary
router.get("/summary", requireAuth, async (req: AuthRequest, res) => {
  const user = req.dbUser!;
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  let taskFilter: Record<string, unknown> = {};
  let projectFilter: Record<string, unknown> = {};

  if (user.role !== "admin") {
    const memberProjects = await Project.find(
      { members: user._id },
      { _id: 1 }
    );
    const memberProjectIds = memberProjects.map((p) => p._id);
    taskFilter.projectId = { $in: memberProjectIds };
    projectFilter._id = { $in: memberProjectIds };
  }

  const [
    totalTasks,
    completedTasks,
    pendingTasks,
    inProgressTasks,
    overdueTasks,
    myTasks,
    totalProjects,
    recentCompletions,
    priorityCounts,
  ] = await Promise.all([
    Task.countDocuments(taskFilter),
    Task.countDocuments({ ...taskFilter, status: "completed" }),
    Task.countDocuments({ ...taskFilter, status: "pending" }),
    Task.countDocuments({ ...taskFilter, status: "in-progress" }),
    Task.countDocuments({
      ...taskFilter,
      dueDate: { $lt: now },
      status: { $ne: "completed" },
    }),
    Task.countDocuments({ assignedTo: user._id }),
    Project.countDocuments(projectFilter),
    Task.countDocuments({
      ...taskFilter,
      status: "completed",
      createdAt: { $gte: sevenDaysAgo },
    }),
    Task.aggregate([
      { $match: taskFilter },
      { $group: { _id: "$priority", count: { $sum: 1 } } },
    ]),
  ]);

  const byPriority = { low: 0, medium: 0, high: 0 };
  for (const p of priorityCounts) {
    if (p._id) byPriority[p._id as keyof typeof byPriority] = p.count;
  }

  res.json({
    totalTasks,
    completedTasks,
    pendingTasks,
    inProgressTasks,
    overdueTasks,
    totalProjects,
    myTasks,
    tasksByPriority: byPriority,
    recentCompletions,
  });
});

// GET /api/dashboard/overdue-tasks
router.get("/overdue-tasks", requireAuth, async (req: AuthRequest, res) => {
  const user = req.dbUser!;
  const now = new Date();

  const taskFilter: Record<string, unknown> = {
    dueDate: { $lt: now },
    status: { $ne: "completed" },
  };

  if (user.role !== "admin") {
    const memberProjects = await Project.find(
      { members: user._id },
      { _id: 1 }
    );
    const memberProjectIds = memberProjects.map((p) => p._id);
    if (memberProjectIds.length === 0) {
      res.json([]);
      return;
    }
    taskFilter.projectId = { $in: memberProjectIds };
  }

  const tasks = await Task.find(taskFilter).sort({ dueDate: 1 }).limit(20);

  const projectIds = tasks.map((t) => t.projectId);
  const assignedUserIds = tasks.map((t) => t.assignedTo).filter(Boolean);

  const [projects, assignedUsers] = await Promise.all([
    Project.find({ _id: { $in: projectIds } }),
    assignedUserIds.length > 0
      ? User.find({ _id: { $in: assignedUserIds } })
      : Promise.resolve([]),
  ]);

  const projectMap = new Map(projects.map((p) => [p._id.toString(), p.name]));
  const userMap = new Map(
    (assignedUsers as Array<{ _id: { toString(): string }; name: string }>).map(
      (u) => [u._id.toString(), u.name]
    )
  );

  res.json(
    tasks.map((t) => ({
      ...t.toJSON(),
      projectName: projectMap.get(t.projectId.toString()) ?? "",
      assignedToName: t.assignedTo
        ? (userMap.get(t.assignedTo.toString()) ?? null)
        : null,
    }))
  );
});

export default router;
