"use client"
import React, { useContext } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Home, LayoutGrid, Heart, ShoppingBag, User } from 'lucide-react'
import { CartContext, CartContextType } from '@/context/CartContext'

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  /** Shows the live cart count on the badge. */
  badge?: boolean;
}

const ITEMS: NavItem[] = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'Categories', href: '/categories', icon: LayoutGrid },
  { name: 'Cart', href: '/cart', icon: ShoppingBag, badge: true },
  { name: 'Wishlist', href: '/wishlist', icon: Heart },
  { name: 'Account', href: '/login', icon: User },
];

/**
 * Thumb-reachable navigation for phones, in the style of native shopping apps.
 * Hidden from `md` upwards, where the top navbar already covers these links.
 */
export default function BottomNav() {
  const pathname = usePathname();
  const { status } = useSession();
  const context = useContext(CartContext) as CartContextType | undefined;
  const cartCount = context?.numberOfCartItems ?? 0;

  // The auth screens are their own flow; a persistent bar just gets in the way.
  const hiddenOn = ['/login', '/register', '/forgetpassword', '/verifycode', '/resetpassword', '/verifyemail'];
  if (hiddenOn.includes(pathname)) return null;

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <nav
      aria-label="Primary"
      className="md:hidden fixed bottom-0 inset-x-0 z-50 border-t border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-slate-950/95 backdrop-blur-lg shadow-[0_-2px_12px_rgba(15,23,42,0.06)]"
      // Clears the iOS home indicator.
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <ul className="flex items-stretch justify-around">
        {ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          // Send signed-in users to their account rather than the login form.
          const href =
            item.href === '/login' && status === 'authenticated' ? '/wishlist' : item.href;

          return (
            <li key={item.name} className="flex-1">
              <Link
                href={href}
                aria-current={active ? 'page' : undefined}
                className={`relative flex flex-col items-center justify-center gap-0.5 py-2 px-1 transition-colors ${
                  active
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <span className="relative">
                  <Icon
                    className={`w-5 h-5 ${active ? 'stroke-[2.5]' : 'stroke-2'}`}
                    aria-hidden="true"
                  />

                  {item.badge && cartCount > 0 && (
                    <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 flex items-center justify-center rounded-full bg-emerald-600 text-white text-[10px] font-bold leading-none">
                      {cartCount > 99 ? '99+' : cartCount}
                    </span>
                  )}
                </span>

                <span className={`text-[10px] leading-tight ${active ? 'font-bold' : 'font-medium'}`}>
                  {item.name}
                </span>

                {active && (
                  <span className="absolute top-0 inset-x-4 h-0.5 rounded-full bg-emerald-500" />
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
