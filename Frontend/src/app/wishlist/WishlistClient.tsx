'use client'
import React, { useState } from 'react'
import AddToCartBtn from '../_components/AddToCartBtn/AddToCartBtn';
import removeFromWishlistApi from '@/WishListActions/removeFromWishlist';
import { toast } from 'sonner';
import { WishlistProductType } from '@/Types/WishlistProduct.type';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, Trash2, ArrowRight } from 'lucide-react';

export default function WishlistClient({ initialProducts }: { initialProducts: WishlistProductType[] }) {
  const [products, setProducts] = useState<WishlistProductType[]>(initialProducts);
  const [removingId, setRemovingId] = useState<string | null>(null);

  async function removeFromWishlist(id: string) {
    setRemovingId(id);
    try {
      const response = await removeFromWishlistApi(id);
      if (response?.status === "success") {
        toast.success('Removed from wishlist', { position: "top-right" });
        setProducts((prev) => prev.filter((item) => (item.id !== id && item._id !== id)));
      }
    } catch (err) {
      console.error(err);
      toast.error('Could not remove item');
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
      
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-rose-500 font-semibold text-xs uppercase tracking-wider mb-1">
          <Heart className="w-3.5 h-3.5 fill-rose-500" />
          <span>Saved Favorites</span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          My Wishlist ({products.length} {products.length === 1 ? 'item' : 'items'})
        </h1>
      </div>

      {products.length === 0 ? (
        /* Empty State */
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/70 dark:border-slate-800 p-12 text-center max-w-lg mx-auto shadow-sm my-12">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 dark:bg-rose-950/30 text-rose-500 flex items-center justify-center mx-auto mb-4 border border-rose-200/50 dark:border-rose-900/30">
            <Heart className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Your wishlist is empty</h2>
          <p className="text-slate-500 text-sm mb-6">
            Explore our collections and tap the heart icon to save your favorite products for later.
          </p>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 font-semibold text-sm rounded-xl transition-all shadow-md"
          >
            <span>Start Exploring</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/70 dark:border-slate-800 p-6 shadow-sm divide-y divide-slate-100 dark:divide-slate-800">
          {products.map((product: WishlistProductType, idx: number) => {
            const itemId = product.id || product._id || `wishlist-item-${idx}`;
            return (
              <div
                key={itemId}
                className="py-5 first:pt-0 last:pb-0 flex flex-col sm:flex-row items-start sm:items-center gap-4 transition-colors"
              >
                {/* Thumbnail */}
                <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60 overflow-hidden flex-shrink-0 p-2">
                  <Image
                    height={200}
                    width={200}
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    alt={product.title}
                    src={product.imageCover}
                    className="w-full h-full object-contain"
                  />
                </div>

                {/* Details */}
                <div className="flex-1 space-y-1">
                  <h3 className="font-semibold text-base text-slate-900 dark:text-white line-clamp-1">
                    {product.title}
                  </h3>
                  <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                    {product.price} <span className="text-xs font-normal text-slate-500">EGP</span>
                  </p>
                  
                  <button
                    onClick={() => removeFromWishlist(itemId)}
                    disabled={removingId === itemId}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-rose-500 hover:text-rose-700 pt-1 cursor-pointer transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove from wishlist</span>
                  </button>
                </div>

                {/* Add to Cart CTA */}
                <div className="w-full sm:w-48 pt-2 sm:pt-0">
                  <AddToCartBtn productId={itemId} />
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
