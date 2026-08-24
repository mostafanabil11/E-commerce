import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "./_components/Navbar/Navbar";
import VerifyEmailBanner from "./_components/VerifyEmailBanner/VerifyEmailBanner";
import { Toaster } from "sonner";

import MySessionProvider from "@/MySessionProvider/MySessionProvider";
import CartContextProvider from "@/context/CartContext";
import ThemeProvider from "./_components/ThemeProvider/ThemeProvider";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});


export const metadata: Metadata = {
  title: "NovaCart — Modern Premium Storefront",
  description: "Experience the next level of online shopping with high quality products and smooth checkout.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${plusJakarta.variable} ${geistMono.variable} font-sans bg-slate-50/60 text-slate-900 dark:bg-slate-950 dark:text-slate-100 antialiased selection:bg-slate-900 selection:text-white flex flex-col min-h-screen`}
      >

        <ThemeProvider>
          <MySessionProvider>
            <CartContextProvider>
              <Navbar />
              <VerifyEmailBanner />
              <main className="flex-1 w-full pt-4 pb-16">
                {children}
              </main>
              <footer className="border-t border-slate-200/80 bg-white/50 backdrop-blur-md py-8 mt-auto dark:border-slate-800 dark:bg-slate-950/50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">NovaCart</span>
                    <span>© {new Date().getFullYear()} All rights reserved.</span>
                  </div>
                  <div className="flex items-center gap-6 text-slate-500">
                    <span className="hover:text-slate-800 cursor-pointer transition-colors">Privacy Policy</span>
                    <span className="hover:text-slate-800 cursor-pointer transition-colors">Terms of Service</span>
                    <span className="hover:text-slate-800 cursor-pointer transition-colors">Support</span>
                  </div>
                </div>
              </footer>
              <Toaster position="top-right" richColors closeButton />
            </CartContextProvider>
          </MySessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}


