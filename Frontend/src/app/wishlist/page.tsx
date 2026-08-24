import getUserWishlistApi from '@/WishListActions/getLoggedUserWishlist'
import React, { Suspense } from 'react'
import MainLoading from '../loading';
import WishlistClient from './WishlistClient';

export default async function WishList() {
  const response = await getUserWishlistApi();
  const products = response?.status === "success" && Array.isArray(response?.data) ? response.data : [];

  return (
    <Suspense fallback={<div className="min-h-[60vh] flex items-center justify-center"><MainLoading /></div>}>
      <WishlistClient initialProducts={products} />
    </Suspense>
  );
}
