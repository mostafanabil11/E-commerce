"use client"
import Link from 'next/link'
import React, { useContext, useState, useCallback, memo } from 'react'
import { signOut, useSession } from "next-auth/react"
import { useRouter, usePathname } from 'next/navigation'
import { CartContext, CartContextType } from '@/context/CartContext'
import { ShoppingBag, Heart, LogOut, Menu, X, Sparkles, ArrowRight, Search } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import ThemeSwitcher from '../ThemeSwitcher/ThemeSwitcher'

const NAV_LINKS = [
  { name: "Home", href: "/" },
  { name: "Products", href: "/products" },
  { name: "Categories", href: "/categories" },
  { name: "Brands", href: "/brands" },
  { name: "Wishlist", href: "/wishlist" },
];

function NavbarComponent() {
  const context = useContext(CartContext) as CartContextType;
  const numberOfCartItems = context?.numberOfCartItems ?? 0;
  const { data: session } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [navSearchQuery, setNavSearchQuery] = useState("");

  const handleNavSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (navSearchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(navSearchQuery.trim())}`);
    }
  }, [navSearchQuery, router]);

  const logout = useCallback(() => {
    signOut({ callbackUrl: "/login" });
  }, []);

  return (
    <header className="sticky top-3 z-50 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
      <nav className="glass-header rounded-2xl shadow-sm shadow-slate-200/50 dark:shadow-none transition-all duration-300">
        <div className="px-5 py-3.5 flex items-center justify-between gap-4">
          
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group flex-shrink-0">
            <div className="w-9 h-9 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-300">
              <ShoppingBag className="w-5 h-5 text-emerald-400 dark:text-emerald-600" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-lg leading-none tracking-tight text-slate-900 dark:text-white flex items-center gap-1">
                Nova<span className="text-emerald-600 dark:text-emerald-400">Cart</span>
                <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500 opacity-80" />
              </span>
              <span className="text-[10px] text-slate-400 font-medium tracking-wider uppercase">Premium Store</span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <ul className="hidden lg:flex items-center gap-1 bg-slate-100/70 dark:bg-slate-800/50 p-1 rounded-xl border border-slate-200/50 dark:border-slate-700/50">
            {NAV_LINKS.map((link) => {
              const isActive = pathname === link.href;
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={`relative px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all duration-150 block ${
                      isActive
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-bold shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <span className="relative z-10">{link.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* Quick Search Bar */}
          <form onSubmit={handleNavSearch} className="hidden md:flex items-center relative max-w-xs flex-1">
            <Search className="absolute left-3 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={navSearchQuery}
              onChange={(e) => setNavSearchQuery(e.target.value)}
              placeholder="Search products..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 rounded-xl text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-100 transition-all"
            />
          </form>

          {/* Right Action Icons */}
          <div className="flex items-center gap-3">
            {/* Dark/Light Theme Switcher */}
            <ThemeSwitcher />

            {/* Wishlist Link Icon */}
            <Link
              href="/wishlist"
              className="p-2 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative"
              title="Wishlist"
            >
              <Heart className="w-5 h-5" />
            </Link>

            {/* Cart Link with Badge */}
            <Link
              href="/cart"
              className="p-2 text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative group"
              title="Shopping Cart"
            >
              <ShoppingBag className="w-5 h-5 group-hover:scale-110 transition-transform" />

              {numberOfCartItems > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 bg-emerald-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center shadow-sm shadow-emerald-600/50"
                >
                  {numberOfCartItems}
                </motion.span>
              )}
            </Link>

            {/* Auth Buttons */}
            {session ? (
              <button
                onClick={logout}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-all border border-rose-200/60 dark:border-rose-900/40 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout</span>
              </button>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  Sign in
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-1.5 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200 rounded-xl transition-all shadow-sm flex items-center gap-1"
                >
                  <span>Get Started</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden border-t border-slate-200/60 dark:border-slate-800 overflow-hidden"
            >
              <div className="px-5 py-4 space-y-2">
                {NAV_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`block px-4 py-2.5 text-sm font-medium rounded-xl transition-colors ${
                      pathname === link.href
                        ? 'bg-slate-900 text-white font-semibold dark:bg-white dark:text-slate-900'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {link.name}
                  </Link>
                ))}

                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  {session ? (
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        logout();
                      }}
                      className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-rose-600 bg-rose-50 dark:bg-rose-950/40 rounded-xl"
                    >
                      <LogOut className="w-4 h-4" />
                      Log out
                    </button>
                  ) : (
                    <div className="w-full grid grid-cols-2 gap-2 pt-1">
                      <Link
                        href="/login"
                        onClick={() => setMobileMenuOpen(false)}
                        className="text-center py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-xl"
                      >
                        Sign in
                      </Link>
                      <Link
                        href="/register"
                        onClick={() => setMobileMenuOpen(false)}
                        className="text-center py-2 text-sm font-semibold text-white bg-slate-900 dark:bg-white dark:text-slate-900 rounded-xl"
                      >
                        Register
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </header>
  );
}

const Navbar = memo(NavbarComponent);
export default Navbar;
