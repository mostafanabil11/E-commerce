import getSingleProductApi from '@/api/getSingleProductApi';
import getAllProductsApi from '@/api/getAllProductsApi';
import AddToCartBtn from '@/app/_components/AddToCartBtn/AddToCartBtn';
import ProductGallery from '@/app/_components/ProductGallery/ProductGallery';
import SingleProduct from '@/app/_components/SingleProduct/SingleProduct';
import Link from 'next/link';
import React from 'react'
import { Star, ShieldCheck, Truck, RotateCcw, ArrowLeft, CheckCircle2, Sparkles } from 'lucide-react';
import { ProductType } from '@/Types/Products.types';

export default async function ProductDetails({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // Run main product request and related items search in parallel to eliminate server waterfall
  const [productRes, allProductsRes] = await Promise.all([
    getSingleProductApi(id),
    getAllProductsApi().catch(() => null)
  ]);

  const data = productRes?.data;
  if (!data) return null;

  const categoryName = data?.category?.name || "Product";
  const title = data?.title || "Product Details";
  const price = data?.price ?? 0;
  const rating = data?.ratingsAverage ?? 4.5;
  const description = data?.description || "";
  const images = data?.images || [data.imageCover];

  // Extract related products safely
  const allProducts: ProductType[] = allProductsRes || [];
  const relatedProducts = allProducts
    .filter((item: ProductType) => (item.category?._id === data.category?._id || item.category?.name === data.category?.name) && (item.id !== data.id && item._id !== data._id))
    .slice(0, 4);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 mb-16 space-y-16">
      
      <div>
        {/* Back Link */}
        <div className="mb-6">
          <Link
            href="/products"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to All Products</span>
          </Link>
        </div>

        {/* 2-Column Product Showcase */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          
          {/* Left Column: Interactive Gallery */}
          <div className="lg:col-span-6">
            <ProductGallery
              images={images}
              imageCover={data.imageCover}
              title={title}
              productId={data.id}
            />
          </div>

          {/* Right Column: Info & Actions */}
          <div className="lg:col-span-6 space-y-6">
            
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/50 rounded-full border border-emerald-200/50 dark:border-emerald-900/40">
                  {categoryName}
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-600 bg-slate-100 dark:text-slate-400 dark:bg-slate-800 rounded-full">
                  <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                  In Stock
                </span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white leading-tight">
                {title}
              </h1>

              {/* Rating & Brand */}
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-lg border border-amber-200/60 dark:border-amber-900/40">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                  <span className="font-bold text-amber-700 dark:text-amber-400 text-xs">
                    {rating} / 5.0
                  </span>
                </div>
                <span className="text-xs text-slate-400">|</span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Brand: <strong className="text-slate-800 dark:text-slate-200 font-semibold">{data.brand?.name || "Official"}</strong>
                </span>
              </div>
            </div>

            {/* Price Header */}
            <div className="p-4 bg-slate-100/60 dark:bg-slate-900/60 rounded-2xl border border-slate-200/50 dark:border-slate-800 flex items-baseline gap-3">
              <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
                {price} <span className="text-sm font-semibold text-slate-500">EGP</span>
              </span>
              <span className="text-xs text-emerald-600 font-semibold">Taxes Included • Free Express Shipping</span>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Description</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {description}
              </p>
            </div>

            {/* Add to Cart CTA */}
            <div className="pt-2">
              <AddToCartBtn productId={data.id} />
            </div>

            {/* Value Badges */}
            <div className="grid grid-cols-3 gap-3 pt-4 border-t border-slate-200/70 dark:border-slate-800 text-center">
              <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
                <Truck className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
                <span className="block text-[11px] font-bold text-slate-800 dark:text-slate-200">Fast Shipping</span>
                <span className="block text-[10px] text-slate-400">Within 24-48 Hours</span>
              </div>

              <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
                <ShieldCheck className="w-5 h-5 text-indigo-500 mx-auto mb-1" />
                <span className="block text-[11px] font-bold text-slate-800 dark:text-slate-200">100% Authentic</span>
                <span className="block text-[10px] text-slate-400">Guaranteed Quality</span>
              </div>

              <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
                <RotateCcw className="w-5 h-5 text-amber-500 mx-auto mb-1" />
                <span className="block text-[11px] font-bold text-slate-800 dark:text-slate-200">Easy Returns</span>
                <span className="block text-[10px] text-slate-400">30 Days Policy</span>
              </div>
            </div>

          </div>

        </div>
      </div>

      {/* Related Products Section */}
      {relatedProducts.length > 0 && (
        <section className="pt-8 border-t border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold text-xs uppercase tracking-wider mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>You Might Also Like</span>
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                Related Products in {categoryName}
              </h2>
            </div>
            <Link
              href="/products"
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
            >
              View Catalog →
            </Link>
          </div>

          <div className="flex flex-wrap -mx-2.5">
            {relatedProducts.map((relProduct: ProductType, idx: number) => (
              <SingleProduct key={relProduct.id || relProduct._id || `rel-prod-${idx}`} product={relProduct} />
            ))}
          </div>
        </section>
      )}

    </div>
  );
}
