'use client'

import AddToWishlistApi from '@/WishListActions/addProductToWishlist';
import React, { useState, memo } from 'react'
import { toast } from 'sonner';
import { Heart } from 'lucide-react';

function AddToWishlistBtnComponent({ productId }: { productId: string }) {
  const [liked, setLiked] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleWishlist(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    
    setLiked(!liked);
    setLoading(true);
    try {
      const response = await AddToWishlistApi(productId);
      if (response.status === "success") {
        toast.success("Added to Wishlist", { duration: 2500, position: "top-right" });
      } else {
        toast.error(response.error || "Could not add to Wishlist", { duration: 2500, position: "top-right" });
        setLiked(false);
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred", { duration: 2500, position: "top-right" });
      setLiked(false);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleWishlist}
      disabled={loading}
      className={`p-2.5 rounded-full active:scale-85 transition-all duration-300 shadow-sm border backdrop-blur-md cursor-pointer ${
        liked
          ? 'bg-rose-50 text-rose-500 border-rose-200 dark:bg-rose-950/40 dark:border-rose-900'
          : 'bg-white/80 text-slate-400 hover:text-rose-500 hover:bg-white border-slate-200/80 dark:bg-slate-900/80 dark:border-slate-800'
      }`}
      aria-label="Add to Wishlist"
    >
      <Heart className={`w-4 h-4 transition-transform duration-300 ${liked ? 'fill-rose-500 scale-110' : ''}`} />
    </button>
  );
}

const AddToWishlistBtn = memo(AddToWishlistBtnComponent);
export default AddToWishlistBtn;

