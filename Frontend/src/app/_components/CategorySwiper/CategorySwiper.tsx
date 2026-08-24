"use client"
import React, { useState, useEffect } from 'react'
import 'swiper/css/bundle';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay } from 'swiper/modules'
import Image from 'next/image';
import Link from 'next/link';
import { CategoryType } from './../../../Types/Category.type';
import { Layers, ArrowRight } from 'lucide-react';
import booksImg from "../../../images/books-category.jpg";

export default function CategorySwiper({ data }: { data: CategoryType[] }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!data || data.length === 0) return null;

  const filteredCategories = data
    .filter((cat) => {
      const name = (cat.name || '').toLowerCase();
      const isSupermarket = name.includes('supermarket') || name.includes('super market');
      const isBabyToys = name.includes('baby') || name.includes('toy');
      return !isSupermarket && !isBabyToys;
    })
    .reverse();

  if (filteredCategories.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 mb-6">
      {/* Section Header */}
      <div className="flex items-end justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold text-xs uppercase tracking-wider mb-1">
            <Layers className="w-3.5 h-3.5" />
            <span>Curated Selection</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Shop by Category
          </h2>
        </div>
        <Link 
          href="/categories" 
          className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors group"
        >
          <span>View All Categories</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      {/* Swiper Carousel or Skeleton while mounting */}
      {!mounted ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 py-2">
          {[...Array(6)].map((_, idx) => (
            <div key={idx} className="h-[200px] bg-slate-200/60 dark:bg-slate-800/80 animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : (
        <Swiper
          modules={[Autoplay]}
          autoplay={{ delay: 3000, disableOnInteraction: false }}
          spaceBetween={16}
          breakpoints={{
            320: { slidesPerView: 2, spaceBetween: 12 },
            640: { slidesPerView: 3, spaceBetween: 16 },
            768: { slidesPerView: 4, spaceBetween: 16 },
            1024: { slidesPerView: 5, spaceBetween: 20 },
            1280: { slidesPerView: 6, spaceBetween: 20 },
          }}
          className="w-full pb-4"
        >
          {filteredCategories.map((category: CategoryType) => {
            const isBook = (category.name || '').toLowerCase().includes('book');
            return (
              <SwiperSlide key={category._id || category.name}>
                <Link 
                  href={`/categories`} 
                  className="group block relative rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="relative w-full h-[180px] sm:h-[210px] overflow-hidden">
                    <Image 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                      width={400} 
                      height={400} 
                      src={isBook ? booksImg : category.image} 
                      alt={category.name} 
                    />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />
                </div>
                <div className="absolute bottom-0 inset-x-0 p-3 text-center">
                  <span className="block text-xs sm:text-sm font-semibold text-white truncate drop-shadow-md">
                    {category.name}
                  </span>
                </div>
              </Link>
            </SwiperSlide>
          );
        })}
        </Swiper>
      )}
    </section>
  )
}


