import "dotenv/config";
import { z } from "zod";

/// Fails fast at startup with a clear message if an env var is missing or
/// malformed, instead of a confusing runtime crash somewhere downstream.
const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  AUTH_SECRET: z.string().min(32, "AUTH_SECRET must be at least 32 characters"),
  NEXTAUTH_URL: z.string().url(),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error(
    "Invalid environment variables:",
    parsed.error.flatten().fieldErrors
  );
  throw new Error("Invalid environment variables — check .env against .env.example");
}

export const env = parsed.data;
