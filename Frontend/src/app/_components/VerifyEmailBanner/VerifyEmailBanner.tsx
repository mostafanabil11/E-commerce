"use client"
import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { MailWarning, X } from 'lucide-react'

/**
 * Standing reminder for signed-in accounts that have not confirmed their email.
 * Verification is optional, so this is dismissible for the session rather than
 * a blocking interstitial.
 */
export default function VerifyEmailBanner() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [dismissed, setDismissed] = useState(false);

  const needsVerification =
    status === "authenticated" && session?.user?.isVerified === false;

  // Redundant while the user is already on the verification page.
  if (!needsVerification || dismissed || pathname === "/verifyemail") return null;

  return (
    <div className="bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200/70 dark:border-amber-900/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center gap-3">
        <MailWarning className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />

        <p className="flex-1 text-xs text-amber-900 dark:text-amber-200">
          <span className="font-semibold">Your email isn&apos;t verified yet.</span>{" "}
          <span className="hidden sm:inline">Confirm it to secure your account.</span>
        </p>

        <Link
          href="/verifyemail"
          className="shrink-0 text-xs font-bold text-amber-900 dark:text-amber-200 underline underline-offset-2 hover:no-underline"
        >
          Verify now
        </Link>

        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss"
          className="shrink-0 p-1 rounded-md text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
