'use server'

import { registerSchemaType } from "@/Schema/Register.schema";
import { apiUrl } from "@/lib/api";

/**
 * Registration runs server-side like every other mutation in the app: `API`
 * is not a NEXT_PUBLIC_ variable, so it is only readable on the server, and
 * this keeps the backend origin out of the browser bundle.
 */
export default async function registerApi(formValues: registerSchemaType) {
  try {
    const response = await fetch(apiUrl('/auth/signup'), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formValues),
    });

    const payload = await response.json();

    if (!response.ok) {
      return {
        message: "fail",
        error: Array.isArray(payload?.message)
          ? payload.message[0]
          : payload?.message || "Registration failed",
      };
    }

    return payload;
  } catch {
    return {
      message: "fail",
      error: "Could not reach the server. Please try again.",
    };
  }
}
