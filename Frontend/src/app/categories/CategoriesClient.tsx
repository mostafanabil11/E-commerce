'use client';
import React, { useState, useMemo } from 'react'
import { CategoryType } from '@/Types/Category.type';
import Image from 'next/image';
import Link from 'next/link';
import { Layers, Search } from 'lucide-react';

export default function CategoriesClient({ initialCategories }: { initialCategories: CategoryType[] }) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredCategories = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return initialCategories;
    return (initialCategories || []).filter((cat) =>
      cat?.name?.toLowerCase().includes(term)
    );
  }, [initialCategories, searchTerm]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 mb-16">
      
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold text-xs uppercase tracking-wider mb-1">
            <Layers className="w-3.5 h-3.5" />
            <span>Product Taxonomy</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            All Categories ({initialCategories.length})
          </h1>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search categories..."
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-100 transition-all shadow-sm"
          />
        </div>
      </div>

      {/* Grid */}
      {filteredCategories.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredCategories.map((category: CategoryType) => (
            <Link
              key={category._id}
              href={`/products?category=${encodeURIComponent(category.name)}`}
              className="block"
            >
              <div
                className="group relative rounded-3xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 shadow-sm hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 cursor-pointer"
              >
                <div className="relative w-full h-[260px] overflow-hidden">
                  <Image
                    height={600}
                    width={600}
                    className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-700"
                    src={category.image}
                    alt={category.name}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent" />
                </div>
                <div className="absolute bottom-0 inset-x-0 p-5 text-center">
                  <h3 className="text-lg font-bold text-white tracking-tight drop-shadow-md group-hover:text-emerald-400 transition-colors">
                    {category.name}
                  </h3>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="py-16 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/60 dark:border-slate-800 shadow-sm my-6">
          <p className="text-sm text-slate-500">No categories found matching &quot;{searchTerm}&quot;</p>
        </div>
      )}

    </div>
  );
}
