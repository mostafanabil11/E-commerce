'use client'
import React, { useState, useMemo } from 'react'
import { BrandType } from '@/Types/Brand.type'
import Image from 'next/image'
import Link from 'next/link'
import { Award, Search } from 'lucide-react'

export default function BrandsClient({ initialBrands }: { initialBrands: BrandType[] }) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredBrands = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return initialBrands;
    return (initialBrands || []).filter((brand) =>
      brand?.name?.toLowerCase().includes(term)
    );
  }, [initialBrands, searchTerm]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 mb-16">
      
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold text-xs uppercase tracking-wider mb-1">
            <Award className="w-3.5 h-3.5" />
            <span>Verified Partners</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Explore All Brands ({initialBrands.length})
          </h1>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search brands..."
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-100 transition-all shadow-sm"
          />
        </div>
      </div>

      {/* Grid */}
      {filteredBrands.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {filteredBrands.map((brand: BrandType) => (
            <Link
              key={brand._id}
              href={`/products?brand=${encodeURIComponent(brand.name)}`}
              className="block"
            >
              <div
                className="group bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/70 dark:border-slate-800 p-4 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col items-center justify-center text-center cursor-pointer"
              >
                <div className="w-full aspect-square relative rounded-2xl bg-slate-50 dark:bg-slate-800 overflow-hidden mb-3 p-3 flex items-center justify-center">
                  <Image
                    width={300}
                    height={300}
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                    src={brand.image}
                    alt={brand.name}
                  />
                </div>
                <h3 className="font-semibold text-xs sm:text-sm text-slate-800 dark:text-slate-200 truncate w-full group-hover:text-emerald-600 transition-colors">
                  {brand.name}
                </h3>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="py-16 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/60 dark:border-slate-800 shadow-sm my-6">
          <p className="text-sm text-slate-500">No brands found matching &quot;{searchTerm}&quot;</p>
        </div>
      )}

    </div>
  );
}
