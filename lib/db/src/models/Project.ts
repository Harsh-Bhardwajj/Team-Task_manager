import mongoose, { Document, Schema, Types } from "mongoose";

export interface IProject extends Document {
  name: string;
  description: string;
  createdBy: Types.ObjectId;
  members: Types.ObjectId[];
  createdAt: Date;
}

const ProjectSchema = new Schema<IProject>(
  {
    name: { type: String, required: true },
    description: { type: String, default: "" },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    members: [{ type: Schema.Types.ObjectId, ref: "User" }],
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

export const Project = (mongoose.models["Project"] as mongoose.Model<IProject>) ?? mongoose.model<IProject>("Project", ProjectSchema);
