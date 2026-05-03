import mongoose, { Document, Schema, Types } from "mongoose";

export interface ITask extends Document {
  title: string;
  description: string;
  projectId: Types.ObjectId;
  assignedTo: Types.ObjectId | null;
  status: "pending" | "in-progress" | "completed";
  priority: "low" | "medium" | "high";
  dueDate: Date | null;
  createdAt: Date;
}

const TaskSchema = new Schema<ITask>(
  {
    title: { type: String, required: true },
    description: { type: String, default: "" },
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true },
    assignedTo: { type: Schema.Types.ObjectId, ref: "User", default: null },
    status: { type: String, enum: ["pending", "in-progress", "completed"], default: "pending" },
    priority: { type: String, enum: ["low", "medium", "high"], default: "medium" },
    dueDate: { type: Date, default: null },
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

export const Task = (mongoose.models["Task"] as mongoose.Model<ITask>) ?? mongoose.model<ITask>("Task", TaskSchema);
