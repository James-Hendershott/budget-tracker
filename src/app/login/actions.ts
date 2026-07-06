"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/auth";

export async function login(_prevState: string | undefined, formData: FormData) {
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: "/",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return "Incorrect email or password.";
        default:
          return "Something went wrong signing in.";
      }
    }
    throw error;
  }
}
