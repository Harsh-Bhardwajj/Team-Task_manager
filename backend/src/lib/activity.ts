import { ActivityLog } from "@workspace/db";

export async function logActivity(params: {
  action: string;
  entityType: string;
  entityId: string;
  entityTitle: string;
  userId: string;
  projectId?: string | null;
}) {
  try {
    await ActivityLog.create({
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      entityTitle: params.entityTitle,
      userId: params.userId,
      projectId: params.projectId ?? null,
    });
  } catch (err) {
    console.error("Failed to log activity:", err);
  }
}
