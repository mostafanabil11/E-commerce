"use client"
import React, { useContext, useEffect, useState } from 'react'
import clearCartApi from '@/CartActions/clearCart'
import { toast } from 'sonner'
import { CartContext, CartContextType } from '@/context/CartContext'
import { CartProductType } from '@/Types/Cart.type'
import removeFromCartApi from '@/CartActions/removeFromCart'
import updateItemQuantityApi from '@/CartActions/updateItemQuantity'
import Link from 'next/link'
import Image from 'next/image'
import { ShoppingBag, Trash2, Plus, Minus, ArrowRight, ShieldCheck, Loader2 } from 'lucide-react'

interface CartClientProps {
  initialProducts: CartProductType[];
  initialPrice: number;
  initialCartId: string;
}

export default function CartClient({ initialProducts, initialPrice, initialCartId }: CartClientProps) {
  const { numberOfCartItems, setNumberOfCartItems } = useContext(CartContext) as CartContextType;
  const [products, setProducts] = useState<CartProductType[]>(initialProducts);
  const [cartPrice, setCartPrice] = useState(initialPrice);
  const [cartId] = useState(initialCartId);
  const [buttonDisable, setButtonDisable] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [isClearing, setIsClearing] = useState(false);

  useEffect(() => {
    let sum = 0;
    products.forEach((p) => {
      sum += (p.count || 0);
    });
    setNumberOfCartItems(sum);
  }, [products, setNumberOfCartItems]);

  async function clearCart() {
    setIsClearing(true);
    try {
      const response = await clearCartApi();
      if (response?.message === 'success') {
        toast.success("Cart cleared successfully", { position: "top-right" });
        setProducts([]);
        setCartPrice(0);
        setNumberOfCartItems(0);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to clear cart");
    } finally {
      setIsClearing(false);
    }
  }

  async function removeFromCart(id: string) {
    setUpdatingId(id);
    try {
      const response = await removeFromCartApi(id);
      if (response?.status === "success") {
        toast.success("Item removed from cart", { position: "top-right" });
        setProducts(response.data.products || []);
        setCartPrice(response.data.totalCartPrice || 0);
      } else {
        toast.error("Could not remove item", { position: "top-right" });
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred");
    } finally {
      setUpdatingId(null);
    }
  }

  async function updateItemQuantity(id: string, count: number) {
    if (count < 1) return;
    setButtonDisable(true);
    setUpdatingId(id);
    try {
      const response = await updateItemQuantityApi(id, String(count));
      if (response?.status === "success") {
        setProducts(response.data.products || []);
        setCartPrice(response.data.totalCartPrice || 0);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to update item quantity");
    } finally {
      setButtonDisable(false);
      setUpdatingId(null);
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
      
      {/* Page Title */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold text-xs uppercase tracking-wider mb-1">
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>Shopping Cart</span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Review Your Cart ({numberOfCartItems} {numberOfCartItems === 1 ? 'item' : 'items'})
        </h1>
      </div>

      {products.length === 0 ? (
        /* Empty Cart View */
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/70 dark:border-slate-800 p-12 text-center max-w-lg mx-auto shadow-sm my-12">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-4">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Your cart is empty</h2>
          <p className="text-slate-500 text-sm mb-6">
            Looks like you haven&apos;t added any items to your shopping cart yet.
          </p>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 font-semibold text-sm rounded-xl transition-all shadow-md"
          >
            <span>Explore Products</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        /* 2-Column Cart Layout */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Cart Items List */}
          <div className="lg:col-span-8 space-y-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/70 dark:border-slate-800 p-6 shadow-sm divide-y divide-slate-100 dark:divide-slate-800">
              {products.map((item: CartProductType, index: number) => {
                const pId = item.product?._id || item._id || String(index);
                return (
                  <div
                    key={pId}
                    className="py-5 first:pt-0 last:pb-0 flex flex-col sm:flex-row items-start sm:items-center gap-4 transition-colors"
                  >

                    {/* Item Thumbnail */}
                    <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60 overflow-hidden flex-shrink-0 p-2">
                      <Image
                        width={200}
                        height={200}
                        alt={item.product?.title || "Product"}
                        src={item.product?.imageCover || ""}
                        className="w-full h-full object-contain"
                      />
                    </div>

                    {/* Item Description */}
                    <div className="flex-1 space-y-1">
                      <h3 className="font-semibold text-base text-slate-900 dark:text-white line-clamp-1">
                        {item.product?.title || "Unnamed Product"}
                      </h3>
                      <p className="text-xs text-slate-500 font-medium">
                        Unit Price: <span className="text-slate-800 dark:text-slate-200 font-semibold">{item.price} EGP</span>
                      </p>
                      
                      {/* Delete Button */}
                      <button
                        onClick={() => removeFromCart(item.product?._id || pId)}
                        disabled={updatingId === (item.product?._id || pId)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-rose-500 hover:text-rose-700 pt-1 cursor-pointer transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove</span>
                      </button>
                    </div>

                    {/* Quantity Stepper & Price */}
                    <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-3 pt-2 sm:pt-0">
                      <span className="font-bold text-base text-slate-900 dark:text-white">
                        {item.price * (item.count || 1)} <span className="text-xs font-normal text-slate-500">EGP</span>
                      </span>

                      <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                        <button
                          disabled={buttonDisable || (item.count || 1) <= 1}
                          onClick={() => updateItemQuantity(item.product?._id || pId, (item.count || 1) - 1)}
                          className="w-7 h-7 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-40 transition-colors"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>

                        <span className="w-8 text-center text-xs font-bold text-slate-800 dark:text-slate-200">
                          {updatingId === (item.product?._id || pId) ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin mx-auto text-slate-500" />
                          ) : (
                            item.count
                          )}
                        </span>

                        <button
                          disabled={buttonDisable}
                          onClick={() => updateItemQuantity(item.product?._id || pId, (item.count || 1) + 1)}
                          className="w-7 h-7 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Clear Cart Button */}
            <div className="flex justify-between items-center px-2">
              <button
                onClick={clearCart}
                disabled={isClearing}
                className="text-xs font-semibold text-slate-500 hover:text-rose-600 transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                {isClearing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>Clear entire cart</span>
              </button>
              <Link
                href="/products"
                className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition-colors flex items-center gap-1"
              >
                <span>Continue shopping</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Right Column: Order Summary Card */}
          <div className="lg:col-span-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/70 dark:border-slate-800 p-6 shadow-sm sticky top-24 space-y-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-4">
                Order Summary
              </h2>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Subtotal</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{cartPrice} EGP</span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Estimated Shipping</span>
                  <span className="font-semibold text-emerald-600">FREE</span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Taxes</span>
                  <span className="text-xs text-slate-400">Calculated at checkout</span>
                </div>

                <div className="border-t border-slate-100 dark:border-slate-800 pt-4 flex justify-between items-baseline">
                  <span className="font-bold text-base text-slate-900 dark:text-white">Total</span>
                  <span className="text-2xl font-extrabold text-emerald-600">
                    {cartPrice} <span className="text-xs font-semibold text-slate-500">EGP</span>
                  </span>
                </div>
              </div>

              {/* Checkout Action CTA */}
              <Link
                href={`/checkout/${cartId}`}
                className="w-full py-3.5 px-4 bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 font-bold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer group"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>

              {/* Security guarantees */}
              <div className="pt-2 flex items-center justify-center gap-2 text-xs text-slate-400 text-center">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>Encrypted 256-bit Secure Checkout</span>
              </div>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
