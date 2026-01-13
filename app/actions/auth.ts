"use server";

import { signIn } from "@/lib/auth";
import { AuthError } from "next-auth";

export async function authenticate(
  prevState: string | undefined,
  formData: FormData,
) {
  try {
    // Map email to identifier as expected by auth logic
    const email = formData.get("email");
    const password = formData.get("password");
    await signIn("credentials", { identifier: email, password });
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return "Credenciales inválidas.";
        default:
          return "Algo salio mal.";
      }
    }
    throw error;
  }
}
