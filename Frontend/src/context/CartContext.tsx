'use client';

import React, { createContext, useEffect, useState, useMemo, ReactNode } from 'react';
import { useSession } from 'next-auth/react';


export interface CartContextType {
  numberOfCartItems: number;
  setNumberOfCartItems: React.Dispatch<React.SetStateAction<number>>;
}

export const CartContext = createContext<CartContextType | undefined>(undefined);

interface CartContextProviderProps {
  children: ReactNode;
}

export default function CartContextProvider({ children }: CartContextProviderProps) {
  const [numberOfCartItems, setNumberOfCartItems] = useState<number>(0);
  const { status } = useSession();

  async function getUserCart(): Promise<void> {
    try {
      const res = await fetch('/api/cart-count', { method: 'GET' });
      if (res.ok) {
        const payload = await res.json();
        if (payload.status === 'success' && typeof payload.count === 'number') {
          setNumberOfCartItems(payload.count);
        }
      }
    } catch {
      // User not logged in or token expired — silently skip
    }
  }


  useEffect(() => {
    if (status === 'authenticated') {
      getUserCart();
    } else if (status === 'unauthenticated') {
      setNumberOfCartItems(0);
    }
  }, [status]);

  const value = useMemo(
    () => ({ numberOfCartItems, setNumberOfCartItems }),
    [numberOfCartItems]
  );

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}



