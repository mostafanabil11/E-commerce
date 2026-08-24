"use client"
import { SessionProvider } from 'next-auth/react'
import React from 'react'

export default function MySessionProvider({ children }: {children : React.ReactNode }) {
  return (
    <SessionProvider refetchOnWindowFocus={false} refetchInterval={0}>
      {children}
    </SessionProvider>

  );
}

