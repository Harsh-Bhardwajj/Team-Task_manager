import mongoose from "mongoose";

const uri = process.env.MONGODB_URI;
if (!uri) {
  throw new Error("MONGODB_URI must be set");
}

export async function connectDB(): Promise<void> {
  if (mongoose.connection.readyState >= 1) return;
  await mongoose.connect(uri!);
}

// Export model modules with explicit .js extensions for ESM runtime compatibility
export * from "./models/User.js";
export * from "./models/Project.js";
export * from "./models/Task.js";
export * from "./models/Activity.js";
