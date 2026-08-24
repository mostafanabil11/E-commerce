"use client"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { verifyCodeSchema, verifyCodeSchemaType } from '@/Schema/VerifyCode.schema'
import verifyResetCodeApi from '@/PasswordActions/verifyResetCode'
import forgetPasswordApi from '@/PasswordActions/forgetPassword'
import { toast } from 'sonner'
import { ShieldCheck, ArrowRight, Loader2, RefreshCw } from 'lucide-react'
import { motion } from 'framer-motion'

export default function VerifyCode() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const form = useForm<verifyCodeSchemaType>({
    defaultValues: {
      resetCode: ""
    },
    resolver: zodResolver(verifyCodeSchema)
  });

  async function handleVerifyCode(values: verifyCodeSchemaType) {
    setLoading(true);
    try {
      const response = await verifyResetCodeApi(values);
      const isSuccess = 
        response?.status === "Success" || 
        response?.status?.toLowerCase() === "success" ||
        response?.statusMsg === "success" ||
        response?.message?.toLowerCase().includes("valid");

      if (isSuccess) {
        toast.success("Code verified successfully!", { position: 'top-right', duration: 2500 });
        router.push("/resetpassword");
      } else {
        toast.error(response?.message || "Invalid verification code", { position: 'top-right', duration: 3000 });
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred during verification", { position: 'top-right' });
    } finally {
      setLoading(false);
    }
  }

  async function handleResendCode() {
    const savedEmail = typeof window !== "undefined" ? localStorage.getItem("resetEmail") : "";
    if (!savedEmail) {
      toast.error("Email not found. Redirecting to start...", { position: 'top-right' });
      router.push("/forgetpassword");
      return;
    }

    setResending(true);
    try {
      const response = await forgetPasswordApi({ email: savedEmail });
      if (response?.statusMsg === "success" || response?.message?.toLowerCase().includes("code sent")) {
        toast.success("New verification code sent to your email!", { position: 'top-right', duration: 3000 });
      } else {
        toast.error(response?.message || "Could not resend code", { position: 'top-right', duration: 3000 });
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred while resending code", { position: 'top-right' });
    } finally {
      setResending(false);
    }
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
            <ShieldCheck className="w-6 h-6 text-emerald-400 dark:text-emerald-600" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Enter Verification Code
          </h1>
          <p className="text-xs text-slate-500">
            Please check your inbox and enter the reset code sent to your email
          </p>
        </div>

        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(handleVerifyCode)}>
            
            {/* Code Field */}
            <FormField
              control={form.control}
              name="resetCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Reset Code
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      placeholder="e.g. 123456"
                      className="h-11 text-center font-bold tracking-widest text-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-100"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-xs text-rose-500" />
                </FormItem>
              )}
            />

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || resending}
              className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 font-bold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <span>Verify Code</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </Form>

        {/* Resend Code Button */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
          <button
            type="button"
            onClick={handleResendCode}
            disabled={resending || loading}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 transition-colors cursor-pointer disabled:opacity-50"
          >
            {resending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5" />
            )}
            <span>Resend verification code</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
