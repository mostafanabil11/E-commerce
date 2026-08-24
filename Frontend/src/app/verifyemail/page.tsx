"use client"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useSession } from 'next-auth/react'
import { verifyEmailSchema, verifyEmailSchemaType } from '@/Schema/VerifyEmail.schema'
import { verifyEmailApi, resendVerificationApi } from '@/AuthActions/verifyEmail'
import { toast } from 'sonner'
import { MailCheck, ArrowRight, Loader2, RefreshCw, CheckCircle2 } from 'lucide-react'
import { motion } from 'framer-motion'

/**
 * Confirms the code emailed at registration. Verification is deliberately not a
 * gate: the account already works, so this page is always skippable.
 */
export default function VerifyEmail() {
  const router = useRouter();
  const { data: session, update } = useSession();
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const email = session?.user?.email ?? "";
  const alreadyVerified = session?.user?.isVerified === true;

  const form = useForm<verifyEmailSchemaType>({
    defaultValues: { otp: "" },
    resolver: zodResolver(verifyEmailSchema)
  });

  async function handleVerify(values: verifyEmailSchemaType) {
    if (!email) {
      toast.error("Please sign in first", { position: 'top-right' });
      router.push("/login");
      return;
    }

    setLoading(true);
    try {
      const response = await verifyEmailApi(email, values.otp);

      if (response?.status !== "success") {
        toast.error(response?.error || "Invalid verification code", { position: 'top-right', duration: 3500 });
        return;
      }

      // Patch the session so the reminder banner disappears immediately.
      await update({ isVerified: true });

      toast.success("Email verified — thanks!", { position: 'top-right', duration: 3000 });
      router.push("/");
      router.refresh();
    } catch {
      toast.error("An error occurred during verification", { position: 'top-right' });
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (!email) return;

    setResending(true);
    try {
      const response = await resendVerificationApi(email);
      if (response?.status === "success") {
        toast.success("A new code is on its way to your inbox", { position: 'top-right', duration: 3000 });
      } else {
        toast.error(response?.error || "Could not resend the code", { position: 'top-right', duration: 3000 });
      }
    } catch {
      toast.error("An error occurred while resending the code", { position: 'top-right' });
    } finally {
      setResending(false);
    }
  }

  if (alreadyVerified) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/70 dark:border-slate-800 p-8 shadow-xl text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6 text-emerald-500" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            You&apos;re all set
          </h1>
          <p className="text-xs text-slate-500">This email address is already verified.</p>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 h-11 px-6 bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 font-bold text-sm rounded-xl transition-all"
          >
            <span>Continue shopping</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/70 dark:border-slate-800 p-8 shadow-xl shadow-slate-200/50 dark:shadow-none space-y-6"
      >
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 flex items-center justify-center mx-auto shadow-md">
            <MailCheck className="w-6 h-6 text-emerald-400 dark:text-emerald-600" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Verify Your Email
          </h1>
          <p className="text-xs text-slate-500">
            We sent a 6-digit code to{" "}
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              {email || "your inbox"}
            </span>
          </p>
        </div>

        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(handleVerify)}>
            <FormField
              control={form.control}
              name="otp"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Verification Code
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      autoComplete="one-time-code"
                      placeholder="e.g. 123456"
                      className="h-11 text-center font-bold tracking-widest text-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-100"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-xs text-rose-500" />
                </FormItem>
              )}
            />

            <button
              type="submit"
              disabled={loading || resending}
              className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 font-bold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer mt-2 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <span>Verify Email</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </Form>

        {/* Resend */}
        <div className="text-center">
          <button
            type="button"
            onClick={handleResend}
            disabled={resending || loading}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer disabled:opacity-60"
          >
            {resending ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Sending...</span>
              </>
            ) : (
              <>
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Didn&apos;t get it? Resend code</span>
              </>
            )}
          </button>
        </div>

        {/* Verification never blocks usage of the account. */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
          <Link
            href="/"
            className="text-xs font-semibold text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
          >
            Skip for now — you can verify later
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
