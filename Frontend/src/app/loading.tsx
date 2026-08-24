import React from 'react'

export default function MainLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full animate-pulse">
      {/* Header Skeleton */}
      <div className="h-8 w-48 bg-slate-200 dark:bg-slate-800 rounded-xl mb-8" />

      {/* Grid Skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800 p-4 space-y-4 shadow-sm"
          >
            {/* Image Placeholder */}
            <div className="w-full aspect-square bg-slate-100 dark:bg-slate-800 rounded-xl" />

            {/* Lines */}
            <div className="space-y-2">
              <div className="h-3 w-16 bg-slate-200 dark:bg-slate-800 rounded" />
              <div className="h-4 w-3/4 bg-slate-200 dark:bg-slate-800 rounded" />
              <div className="flex justify-between items-center pt-2">
                <div className="h-5 w-20 bg-slate-200 dark:bg-slate-800 rounded" />
                <div className="h-4 w-12 bg-slate-200 dark:bg-slate-800 rounded" />
              </div>
            </div>

            {/* Button */}
            <div className="h-10 w-full bg-slate-200 dark:bg-slate-800 rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  );
}
