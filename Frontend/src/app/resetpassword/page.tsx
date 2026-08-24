"use client"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { zodResolver } from '@hookform/resolvers/zod'
import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { resetPasswordSchema, resetPasswordSchemaType } from '@/Schema/ResetPassword.schema'
import resetPasswordApi from '@/PasswordActions/resetPassword'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Lock, Mail, ArrowRight, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'

export default function ResetPassword() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const form = useForm<resetPasswordSchemaType>({
    defaultValues: {
      email: "",
      newPassword: ""
    },
    resolver: zodResolver(resetPasswordSchema)
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedEmail = localStorage.getItem("resetEmail");
      if (savedEmail) {
        form.setValue("email", savedEmail);
      }
    }
  }, [form]);

  async function handleResetPassword(values: resetPasswordSchemaType) {
    setLoading(true);
    try {
      const response = await resetPasswordApi(values);
      const isSuccess = response?.token || response?.statusMsg === "success" || response?.status === "success" || response?.message === "success";

      if (isSuccess) {
        if (typeof window !== "undefined") {
          localStorage.removeItem("resetEmail");
        }
        toast.success("Password reset successfully! Please sign in.", { position: 'top-right', duration: 3000 });
        router.push("/login");
      } else {
        toast.error(response?.message || "Could not reset password", { position: 'top-right', duration: 3000 });
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred during password reset", { position: 'top-right' });
    } finally {
      setLoading(false);
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
            <Lock className="w-6 h-6 text-emerald-400 dark:text-emerald-600" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Set New Password
          </h1>
          <p className="text-xs text-slate-500">
            Enter your account email and choose your new password
          </p>
        </div>

        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(handleResetPassword)}>
            
            {/* Email Field */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Account Email
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input
                        type="email"
                        placeholder="name@example.com"
                        className="pl-10 h-11 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-100"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage className="text-xs text-rose-500" />
                </FormItem>
              )}
            />

            {/* New Password Field */}
            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    New Password
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input
                        type="password"
                        placeholder="••••••••"
                        className="pl-10 h-11 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-100"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage className="text-xs text-rose-500" />
                </FormItem>
              )}
            />

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 font-bold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving new password...</span>
                </>
              ) : (
                <>
                  <span>Reset Password</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </Form>
      </motion.div>
    </div>
  );
}
