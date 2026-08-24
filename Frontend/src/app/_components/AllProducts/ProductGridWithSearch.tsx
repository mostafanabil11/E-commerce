"use client"
import React, { useState, useEffect, useMemo } from 'react'
import { Search, Sparkles, ArrowRight } from 'lucide-react'
import Link from 'next/link'

import { useSearchParams } from 'next/navigation'
import SingleProduct from '../SingleProduct/SingleProduct'
import { ProductType } from '@/Types/Products.types'

export default function ProductGridWithSearch({ 
  initialProducts, 
  limit 
}: { 
  initialProducts: ProductType[];
  limit?: number;
}) {
  const searchParams = useSearchParams();
  const categoryParam = searchParams ? searchParams.get("category") : null;
  const brandParam = searchParams ? searchParams.get("brand") : null;
  const searchParam = searchParams ? searchParams.get("search") : null;

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const initialQuery = categoryParam || brandParam || searchParam || "";
    if (initialQuery) {
      setSearchTerm(initialQuery);
      setDebouncedSearch(initialQuery);
    }
  }, [categoryParam, brandParam, searchParam]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 200);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const [visibleCount, setVisibleCount] = useState(12);

  const filteredProducts = useMemo(() => {
    const reversed = (initialProducts || []).slice().reverse();
    const activeSearch = debouncedSearch.trim().toLowerCase();
    const pool = limit && !activeSearch ? reversed.slice(0, limit) : reversed;

    if (!activeSearch) return pool;

    return pool.filter((product) => {
      const titleMatch = product?.title?.toLowerCase().includes(activeSearch);
      const slugMatch = product?.slug?.toLowerCase().includes(activeSearch);
      const catMatch = product?.category?.name?.toLowerCase().includes(activeSearch);
      const brandMatch = product?.brand?.name?.toLowerCase().includes(activeSearch);
      return titleMatch || slugMatch || catMatch || brandMatch;
    });
  }, [initialProducts, limit, debouncedSearch]);

  // Reset pagination when search changes
  useEffect(() => {
    setVisibleCount(12);
  }, [debouncedSearch]);

  const displayedProducts = useMemo(() => {
    if (limit && !debouncedSearch) return filteredProducts;
    return filteredProducts.slice(0, visibleCount);
  }, [filteredProducts, visibleCount, limit, debouncedSearch]);

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + 12);
  };

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 mb-16">
      
      {/* Section Header & Search Container */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold text-xs uppercase tracking-wider mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Featured Selection</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Top & Latest Products
          </h2>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search featured products..."
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-100 transition-all shadow-sm"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Products Grid */}
      {displayedProducts.length > 0 ? (
        <>
          <div className="flex flex-wrap -mx-2.5">
            {displayedProducts.map((product: ProductType, idx: number) => (
              <SingleProduct key={product.id || product._id || `product-item-${idx}`} product={product} />
            ))}
          </div>

          {/* Load More Products Button for full products page */}
          {!limit && visibleCount < filteredProducts.length && (
            <div className="mt-12 text-center">
              <button
                onClick={handleLoadMore}
                className="inline-flex items-center gap-2 px-8 py-3.5 bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 font-bold text-sm rounded-2xl transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 cursor-pointer"
              >
                <span>Load More Products (Showing {displayedProducts.length} of {filteredProducts.length})</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* View All Products CTA Button for homepage */}
          {limit && !searchTerm && (
            <div className="mt-12 text-center">
              <Link
                href="/products"
                className="inline-flex items-center gap-2 px-8 py-3.5 bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 font-bold text-sm rounded-2xl transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 group"
              >
                <span>Explore All Products ({initialProducts?.length || 0})</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          )}
        </>
      ) : (
        <div className="py-16 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/60 dark:border-slate-800 shadow-sm my-6">
          <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">No products found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            We couldn&apos;t find any products matching &quot;{searchTerm}&quot;. Try checking for spelling errors or searching another term.
          </p>
          <button
            onClick={() => setSearchTerm("")}
            className="mt-4 px-4 py-2 text-xs font-semibold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
          >
            Reset Search
          </button>
        </div>
      )}

    </section>
  );
}


