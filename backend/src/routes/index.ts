import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import usersRouter from "./users.js";
import projectsRouter from "./projects.js";
import tasksRouter from "./tasks.js";
import dashboardRouter from "./dashboard.js";
import activityRouter from "./activity.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/users", usersRouter);
router.use("/projects", projectsRouter);
router.use("/tasks", tasksRouter);
router.use("/dashboard", dashboardRouter);
router.use("/activity", activityRouter);

export default router;
