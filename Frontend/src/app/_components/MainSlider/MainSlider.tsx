'use client'
import React, { useState, useEffect } from 'react'
import electronicsBanner from "../../../images/electronics-banner.jpg"
import img2 from "../../../images/slider-image-2.jpeg"
import img3 from "../../../images/slider-image-3.jpeg"
import img5 from "../../../images/grocery-banner-2.jpeg"
import Image from 'next/image'
import 'swiper/css/bundle';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination } from 'swiper/modules'
import { Sparkles, ArrowRight, ShieldCheck, Truck } from 'lucide-react'
import Link from 'next/link'

export default function MainSlider() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        
        {/* Main Featured Banner Slider (2 cols on large screens) */}
        <div className="lg:col-span-2 relative rounded-3xl overflow-hidden shadow-xl border border-slate-200/60 dark:border-slate-800 group">
          {!mounted ? (
            <div className="w-full h-[360px] sm:h-[440px] bg-slate-200/60 dark:bg-slate-800/80 animate-pulse" />
          ) : (
            <Swiper 
              slidesPerView={1}
              modules={[Autoplay, Pagination]}
              autoplay={{ delay: 3500, disableOnInteraction: false }}
              pagination={{ clickable: true }}
              className="w-full h-[360px] sm:h-[440px]"
            >
              <SwiperSlide className="relative w-full h-full">
                <Image 
                  alt="Next-Gen Electronics" 
                  priority
                  sizes="(max-width: 1024px) 100vw, 66vw"
                  src={electronicsBanner} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/30 to-transparent flex flex-col justify-end p-6 sm:p-10">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-cyan-500/90 text-white backdrop-blur-md w-fit mb-3 shadow-sm">
                    <Sparkles className="w-3.5 h-3.5" />
                    Next-Gen Tech & Gadgets
                  </span>
                  <h2 className="text-2xl sm:text-4xl font-extrabold text-white mb-2 leading-tight tracking-tight">
                    Upgrade Your Tech Experience
                  </h2>
                  <p className="text-slate-200 text-xs sm:text-sm max-w-lg mb-5 line-clamp-2">
                    Explore high-performance MacBooks, flagship iPhones, AirPods, and premium tech devices with exclusive offers.
                  </p>
                  <div>
                    <Link 
                      href="/products" 
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-slate-900 font-semibold text-xs sm:text-sm hover:bg-slate-100 transition-all shadow-md group/btn"
                    >
                      <span>Shop Electronics</span>
                      <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </div>
              </SwiperSlide>

              <SwiperSlide className="relative w-full h-full">
                <Image 
                  alt="Fresh Grocery & Essentials" 
                  sizes="(max-width: 1024px) 100vw, 66vw"
                  src={img5} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/30 to-transparent flex flex-col justify-end p-6 sm:p-10">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/90 text-white backdrop-blur-md w-fit mb-3 shadow-sm">
                    Fresh & Organic
                  </span>
                  <h2 className="text-2xl sm:text-4xl font-extrabold text-white mb-2 leading-tight tracking-tight">
                    Daily Grocery & Premium Delights
                  </h2>
                  <p className="text-slate-200 text-xs sm:text-sm max-w-lg mb-5 line-clamp-2">
                    Handpicked fresh produce and gourmet items delivered straight to your doorstep within hours.
                  </p>
                  <div>
                    <Link 
                      href="/categories" 
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-slate-900 font-semibold text-xs sm:text-sm hover:bg-slate-100 transition-all shadow-md group/btn"
                    >
                      <span>Explore Fresh Goods</span>
                      <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </div>
              </SwiperSlide>

              <SwiperSlide className="relative w-full h-full">
                <Image 
                  alt="Exclusive Deals" 
                  sizes="(max-width: 1024px) 100vw, 66vw"
                  src={img3} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/30 to-transparent flex flex-col justify-end p-6 sm:p-10">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/90 text-white backdrop-blur-md w-fit mb-3 shadow-sm">
                    Limited Time Deals
                  </span>
                  <h2 className="text-2xl sm:text-4xl font-extrabold text-white mb-2 leading-tight tracking-tight">
                    Up to 40% Off Top Brands
                  </h2>
                  <p className="text-slate-200 text-xs sm:text-sm max-w-lg mb-5 line-clamp-2">
                    Unbeatable prices on bestselling electronics, fashion, and lifestyle items.
                  </p>
                  <div>
                    <Link 
                      href="/products" 
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-xs sm:text-sm transition-all shadow-md group/btn"
                    >
                      <span>Claim Deals Now</span>
                      <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </div>
              </SwiperSlide>
            </Swiper>
          )}
        </div>

        {/* Secondary Feature Banners (Right side column) */}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
          <div className="relative rounded-3xl overflow-hidden h-[170px] sm:h-[210px] shadow-md border border-slate-200/60 dark:border-slate-800 group">
            <Image 
              alt="Fast Delivery Banner" 
              sizes="(max-width: 1024px) 50vw, 33vw"
              src={img2} 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
            />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-slate-950/40 to-transparent p-5 flex flex-col justify-center text-white">
              <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">
                <Truck className="w-3.5 h-3.5" /> Express Shipping
              </div>
              <h3 className="text-lg font-bold text-white mb-1">Same-Day Delivery</h3>
              <p className="text-xs text-slate-300">Free delivery on orders over 500 EGP.</p>
            </div>
          </div>

          <div className="relative rounded-3xl overflow-hidden h-[170px] sm:h-[210px] shadow-md border border-slate-200/60 dark:border-slate-800 group">
            <Image 
              alt="Quality Guarantee Banner" 
              sizes="(max-width: 1024px) 50vw, 33vw"
              src={img3} 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
            />

            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-slate-950/40 to-transparent p-5 flex flex-col justify-center text-white">
              <div className="flex items-center gap-1.5 text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
                <ShieldCheck className="w-3.5 h-3.5" /> 100% Authentic
              </div>
              <h3 className="text-lg font-bold text-white mb-1">Verified Brands</h3>
              <p className="text-xs text-slate-300">Guaranteed quality & easy 30-day returns.</p>
            </div>
          </div>
        </div>

      </div>
    </section>
  )
}

