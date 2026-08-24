"use client"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { loginSchema, loginSchemaType } from '@/Schema/Login.schema'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { signIn } from "next-auth/react"
import { useRouter } from 'next/navigation'
import { Mail, Lock, ArrowRight, Loader2, LogIn } from 'lucide-react'
import { motion } from 'framer-motion'

export default function Login() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const form = useForm<loginSchemaType>({
    defaultValues: {
      email: "",
      password: ""
    },
    resolver: zodResolver(loginSchema)
  });

  async function handleLogin(values: loginSchemaType) {
    setLoading(true);
    try {
      const response = await signIn("credentials", {
        email: values.email,
        password: values.password,
        redirect: false
      });

      if (response?.ok && !response?.error) {
        toast.success("Welcome back! Logged in successfully", { position: "top-right", duration: 1500 });
        router.push("/");
        router.refresh();
      } else {
        const errorMsg = response?.error === "CredentialsSignin" 
          ? "Incorrect email or password" 
          : (response?.error || "Invalid email or password");
        toast.error(errorMsg, { position: "top-right", duration: 3000 });
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred during sign in", { position: "top-right" });
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
            <LogIn className="w-6 h-6 text-emerald-400 dark:text-emerald-600" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Welcome Back
          </h1>
          <p className="text-xs text-slate-500">
            Sign in to access your cart, wishlist, and orders
          </p>
        </div>

        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(handleLogin)}>
            
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

            {/* Password Field */}
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Password
                    </FormLabel>
                    <Link
                      href="/forgetpassword"
                      className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition-colors"
                    >
                      Forgot password?
                    </Link>
                  </div>
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
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </Form>

        {/* Register Link Footer */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-center text-xs text-slate-500">
          <span>Don&apos;t have an account yet? </span>
          <Link
            href="/register"
            className="font-bold text-slate-900 dark:text-white hover:underline transition-all"
          >
            Create one now
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
