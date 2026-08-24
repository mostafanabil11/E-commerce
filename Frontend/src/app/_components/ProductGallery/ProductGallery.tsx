"use client"
import React, { useState, useMemo, memo } from 'react'
import Image from 'next/image'
import AddToWishlistBtn from '../AddToWishlistBtn/AddToWishlistBtn'

function ProductGalleryComponent({
  images,
  imageCover,
  title,
  productId
}: {
  images: string[];
  imageCover: string;
  title: string;
  productId: string;
}) {
  const allImages = useMemo(
    () => (images && images.length > 0 ? images : [imageCover]),
    [images, imageCover]
  );
  
  const [activeImage, setActiveImage] = useState(imageCover || allImages[0]);

  return (
    <div className="space-y-4">
      {/* Main Image Showcase */}
      <div className="relative w-full aspect-square rounded-2xl sm:rounded-3xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 p-4 sm:p-8 shadow-sm flex items-center justify-center">
        <Image
          width={800}
          height={800}
          priority
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="w-full h-full object-contain transition-all duration-300"
          src={activeImage}
          alt={title}
        />
        <div className="absolute top-4 right-4 z-10">
          <AddToWishlistBtn productId={productId} />
        </div>
      </div>

      {/* Interactive Thumbnail Gallery */}
      {allImages.length > 1 && (
        <div className="grid grid-cols-4 gap-3">
          {allImages.slice(0, 4).map((imgUrl: string, idx: number) => {
            const isActive = activeImage === imgUrl;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveImage(imgUrl)}
                className={`w-full aspect-square rounded-2xl bg-white dark:bg-slate-900 border overflow-hidden p-2 shadow-xs cursor-pointer transition-all duration-200 ${
                  isActive
                    ? 'border-emerald-500 ring-2 ring-emerald-500/20 scale-95'
                    : 'border-slate-200/60 dark:border-slate-800 opacity-70 hover:opacity-100 hover:border-slate-400'
                }`}
              >
                <Image
                  width={200}
                  height={200}
                  sizes="(max-width: 640px) 25vw, 15vw"
                  src={imgUrl}
                  alt={`Thumbnail ${idx + 1}`}
                  className="w-full h-full object-contain"
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

const ProductGallery = memo(ProductGalleryComponent);
export default ProductGallery;
