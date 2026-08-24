'use client'
import AddToCartApi from '@/CartActions/addToCart'
import { CartContext, CartContextType } from '@/context/CartContext';
import React, { useContext, useState, memo } from 'react'
import { toast } from 'sonner';
import { ShoppingBag, Loader2, Check } from 'lucide-react';

function AddToCartBtnComponent({ productId }: { productId: string }) {
  const context = useContext(CartContext) as CartContextType;
  const setNumberOfCartItems = context?.setNumberOfCartItems;
  
  const [loading, setLoading] = useState(false);
  const [added, setAdded] = useState(false);

  async function checkAddBtn(productId: string) {
    setLoading(true);
    try {
      const response = await AddToCartApi(productId);
      if (response.status === "success") {
        toast.success("Added to cart successfully", { position: "top-right", duration: 2500 });
        if (setNumberOfCartItems) {
          setNumberOfCartItems((prev) => prev + 1);
        }
        setAdded(true);
        setTimeout(() => setAdded(false), 2000);
      } else {
        toast.error(response.error || "Could not add item to cart", { position: "top-right" });
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to add product to cart", { position: "top-right" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      disabled={loading}
      onClick={() => checkAddBtn(productId)}
      className={`w-full py-2.5 px-4 text-xs sm:text-sm font-semibold rounded-xl active:scale-95 transition-all duration-200 shadow-sm flex items-center justify-center gap-2 cursor-pointer ${
        added
          ? 'bg-emerald-600 text-white'
          : 'bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100'
      }`}
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin text-white dark:text-slate-900" />
          <span>Adding...</span>
        </>
      ) : added ? (
        <>
          <Check className="w-4 h-4" />
          <span>Added to Cart</span>
        </>
      ) : (
        <>
          <ShoppingBag className="w-4 h-4" />
          <span>Add to Cart</span>
        </>
      )}
    </button>
  );
}

const AddToCartBtn = memo(AddToCartBtnComponent);
export default AddToCartBtn;


