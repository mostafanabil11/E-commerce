"use client"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { forgetPasswordSchema, forgetPasswordSchemaType } from '@/Schema/ForgetPassword.schema'
import forgetPasswordApi from '@/PasswordActions/forgetPassword'
import { toast } from 'sonner'
import { Mail, KeyRound, ArrowRight, Loader2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'

export default function ForgetPassword() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const form = useForm<forgetPasswordSchemaType>({
    defaultValues: {
      email: ""
    },
    resolver: zodResolver(forgetPasswordSchema)
  });

  async function handleForgetPassword(values: forgetPasswordSchemaType) {
    setLoading(true);
    try {
      const response = await forgetPasswordApi(values);
      if (response.status === "success") {
        if (typeof window !== "undefined") {
          localStorage.setItem("resetEmail", values.email);
        }
        toast.success("Verification code sent to your email", { position: 'top-right', duration: 3000 });
        router.push("/verifycode");
      } else {
        toast.error(response.error || "Could not send verification code", { position: 'top-right', duration: 3500 });
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred", { position: 'top-right' });
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
            <KeyRound className="w-6 h-6 text-emerald-400 dark:text-emerald-600" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Reset Your Password
          </h1>
          <p className="text-xs text-slate-500">
            Enter your email address and we will send you a verification code
          </p>
        </div>

        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(handleForgetPassword)}>
            
            {/* Email Field */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Email Address
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

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 font-bold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Sending code...</span>
                </>
              ) : (
                <>
                  <span>Send Reset Code</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </Form>

        {/* Back to Login Footer */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Sign In</span>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
