"use client"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { zodResolver } from '@hookform/resolvers/zod'
import { useParams } from 'next/navigation'
import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { checkoutSchema, checkoutSchemaType } from '@/Schema/Checkout.shcema'
import CheckoutSessionApi from '@/CheckoutActions/CheckoutSession'
import { CreditCard, MapPin, Phone, Building2, ShieldCheck, ArrowRight, Loader2, Lock } from 'lucide-react'
import { toast } from 'sonner'

export default function Checkout() {

  const { id } = useParams() as { id: string };
  const [loading, setLoading] = useState(false);

  const form = useForm<checkoutSchemaType>({
    defaultValues: {
      details: "",
      phone: "",
      city: ""
    },
    resolver: zodResolver(checkoutSchema)
  });

  async function handleCheckout(values: checkoutSchemaType) {
    setLoading(true);
    try {
      const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
      const response = await CheckoutSessionApi(id, origin, values);
      if (response?.status === "success" && response?.session?.url) {
        toast.success("Redirecting to Stripe secure checkout...", { position: "top-right", duration: 2500 });
        window.location.href = response.session.url;
      } else {
        toast.error("Failed to create checkout session", { position: "top-right" });
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred during checkout", { position: "top-right" });
    } finally {
      setLoading(false);
    }
  }


  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 mb-16">
      
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold text-xs uppercase tracking-wider mb-1">
          <CreditCard className="w-3.5 h-3.5" />
          <span>Checkout & Payment</span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Shipping & Delivery Details
        </h1>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleCheckout)} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Delivery Form Card */}
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/70 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-600" />
              <span>Delivery Address</span>
            </h2>

            {/* City Field */}
            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    City / Governorate
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input
                        type="text"
                        placeholder="e.g. Cairo, Giza, Alexandria"
                        className="pl-10 h-11 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-100"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage className="text-xs text-rose-500" />
                </FormItem>
              )}
            />

            {/* Address Details Field */}
            <FormField
              control={form.control}
              name="details"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Detailed Address
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input
                        type="text"
                        placeholder="Street name, building number, apartment..."
                        className="pl-10 h-11 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-100"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage className="text-xs text-rose-500" />
                </FormItem>
              )}
            />

            {/* Phone Field */}
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Contact Phone Number
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input
                        type="tel"
                        placeholder="01012345678"
                        className="pl-10 h-11 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-100"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage className="text-xs text-rose-500" />
                </FormItem>
              )}
            />

          </div>

          {/* Right Column: Payment Summary Card */}
          <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/70 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6 sticky top-24">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-600" />
              <span>Payment Options</span>
            </h2>

            <div className="p-4 bg-emerald-50/60 dark:bg-emerald-950/30 rounded-2xl border border-emerald-200/60 dark:border-emerald-900/40 space-y-2">
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold text-sm">
                <Lock className="w-4 h-4" />
                <span>Stripe Online Gateway</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                You will be securely redirected to Stripe to complete your credit/debit card payment with 256-bit encryption.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer group"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Connecting to Stripe...</span>
                </>
              ) : (
                <>
                  <span>Pay Now via Stripe</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>

            <div className="flex items-center justify-center gap-2 text-xs text-slate-400 text-center pt-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Verified 100% Guaranteed Safe Checkout</span>
            </div>
          </div>

        </form>
      </Form>

    </div>
  );
}