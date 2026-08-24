

import Link from 'next/link'
import React, { memo } from 'react'
import { ProductType } from './../../../Types/Products.types';
import AddToCartBtn from '../AddToCartBtn/AddToCartBtn'
import AddToWishlistBtn from '../AddToWishlistBtn/AddToWishlistBtn';
import Image from 'next/image';
import { Star } from 'lucide-react';

function SingleProductComponent({ product }: { product: ProductType }) {
  if (!product) return null;

  const productId = product?.id || product?._id || "";
  const categoryName = product?.category?.name || "Product";
  const title = product?.title || product?.slug || "Product";
  const price = product?.price ?? 0;
  const rating = product?.ratingsAverage ?? 4.5;

  return (
    <div className="w-1/2 sm:w-1/2 md:w-1/3 lg:w-1/4 p-1.5 sm:p-2.5 flex">
      <div className="w-full bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl border border-slate-200/70 dark:border-slate-800 p-2.5 sm:p-3.5 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between group relative">
        
        {/* Floating Wishlist Button Top Right */}
        <div className="absolute top-3.5 right-3.5 sm:top-5 sm:right-5 z-10">
          <AddToWishlistBtn productId={productId} />
        </div>

        <Link href={`/products/${productId}`} className="block flex-1">

          {/* Product Image Wrapper */}
          <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-800 mb-3 flex items-center justify-center">
            {/* Express badge overlay */}
            <span className="absolute top-2 left-2 z-10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100/90 dark:text-emerald-300 dark:bg-emerald-950/80 rounded-md backdrop-blur-md">
              Express
            </span>
            <Image
              width={400}
              height={400}
              sizes="(max-width: 640px) 50vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
              src={product.imageCover}
              alt={title}
              loading="lazy"
              className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-500"
            />
          </div>

          {/* Product Info */}
          <div className="space-y-1 sm:space-y-1.5 mb-3 sm:mb-4">
            <span className="inline-block px-2 py-0.5 text-[10px] sm:text-[11px] font-semibold text-emerald-700 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/50 rounded-md">
              {categoryName}
            </span>
            <h3 className="font-semibold text-xs sm:text-sm text-slate-800 dark:text-slate-200 line-clamp-2 sm:line-clamp-1 min-h-[2rem] sm:min-h-0 group-hover:text-emerald-600 transition-colors">
              {title}
            </h3>

            {/* Price & Rating */}
            <div className="flex items-center justify-between gap-1.5 pt-1">
              <span className="font-bold text-sm sm:text-base text-slate-900 dark:text-white whitespace-nowrap">
                {price} <span className="text-[10px] sm:text-xs font-normal text-slate-500">EGP</span>
              </span>
              <div className="flex items-center gap-0.5 sm:gap-1 shrink-0 bg-amber-50 dark:bg-amber-950/30 px-1.5 sm:px-2 py-0.5 rounded-md border border-amber-200/50 dark:border-amber-900/30">
                <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-500 fill-amber-500" />
                <span className="text-[10px] sm:text-xs font-bold text-amber-700 dark:text-amber-400">
                  {rating}
                </span>
              </div>
            </div>
          </div>
        </Link>

        {/* Add to Cart CTA */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
          <AddToCartBtn productId={productId} />
        </div>

      </div>
    </div>
  );
}

const SingleProduct = memo(SingleProductComponent);
export default SingleProduct;


