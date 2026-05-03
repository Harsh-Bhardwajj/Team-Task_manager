import mongoose, { Document, Schema, Types } from "mongoose";

export interface IActivityLog extends Document {
  action: string;
  entityType: string;
  entityId: string;
  entityTitle: string;
  userId: Types.ObjectId;
  projectId: Types.ObjectId | null;
  createdAt: Date;
}

const ActivitySchema = new Schema<IActivityLog>(
  {
    action: { type: String, required: true },
    entityType: { type: String, required: true },
    entityId: { type: String, required: true },
    entityTitle: { type: String, required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    projectId: { type: Schema.Types.ObjectId, ref: "Project", default: null },
  },
  {
    timestamps: { createdAt: "createdAt", updatedAt: false },
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: Record<string, unknown>) => {
        ret["id"] = (ret["_id"] as { toString(): string }).toString();
        delete (ret as { _id?: unknown })["_id"];
        delete (ret as { __v?: unknown })["__v"];
        return ret;
      },
    },
  }
);

export const ActivityLog = (mongoose.models["ActivityLog"] as mongoose.Model<IActivityLog>) ?? mongoose.model<IActivityLog>("ActivityLog", ActivitySchema);
