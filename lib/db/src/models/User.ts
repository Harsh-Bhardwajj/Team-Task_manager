import mongoose, { Document, Schema } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: "admin" | "member";
  createdAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["admin", "member"], default: "member", required: true },
  },
  {
    timestamps: { createdAt: "createdAt", updatedAt: false },
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: Record<string, unknown>) => {
        ret["id"] = (ret["_id"] as { toString(): string }).toString();
        delete (ret as { _id?: unknown })["_id"];
        delete (ret as { __v?: unknown })["__v"];
        delete (ret as { passwordHash?: unknown })["passwordHash"];
        return ret;
      },
    },
  }
);

export const User = (mongoose.models["User"] as mongoose.Model<IUser>) ?? mongoose.model<IUser>("User", UserSchema);
