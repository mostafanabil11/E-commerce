import getUserCartApi from '@/CartActions/getUserCart'
import React, { Suspense } from 'react'
import MainLoading from '../loading'
import CartClient from './CartClient'
import { CartProductType } from '@/Types/Cart.type'

export default async function Cart() {
  const res = await getUserCartApi();
  let products: CartProductType[] = [];
  let cartPrice = 0;
  let cartId = "";

  if (res.status === "success" && res.data) {
    cartId = res.cartId || res.data._id || "";
    products = res.data.products || [];
    cartPrice = res.data.totalCartPrice || 0;
  }

  return (
    <Suspense fallback={<div className="min-h-[60vh] flex items-center justify-center"><MainLoading /></div>}>
      <CartClient initialProducts={products} initialPrice={cartPrice} initialCartId={cartId} />
    </Suspense>
  );
}
