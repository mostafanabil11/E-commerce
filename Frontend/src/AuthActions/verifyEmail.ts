'use server'

import { apiUrl } from "@/lib/api";

function readError(payload: unknown, fallback: string) {
  const message = (payload as { message?: string | string[] })?.message;
  if (Array.isArray(message)) return message[0];
  return message || fallback;
}

/** Confirms an account's email with the 6-digit code sent at registration. */
export async function verifyEmailApi(email: string, otp: string) {
  try {
    const response = await fetch(apiUrl('/auth/confirm-email'), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, otp }),
    });

    const payload = await response.json();

    if (!response.ok) {
      return { status: "fail", error: readError(payload, "Invalid verification code") };
    }

    return { status: "success", ...payload };
  } catch {
    return { status: "fail", error: "Could not reach the server. Please try again." };
  }
}

/** Sends a fresh verification code to an account that is not yet verified. */
export async function resendVerificationApi(email: string) {
  try {
    const response = await fetch(apiUrl('/auth/resend-verification'), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const payload = await response.json();

    if (!response.ok) {
      return { status: "fail", error: readError(payload, "Could not resend the code") };
    }

    return { status: "success", ...payload };
  } catch {
    return { status: "fail", error: "Could not reach the server. Please try again." };
  }
}
