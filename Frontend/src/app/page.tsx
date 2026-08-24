import dynamic from "next/dynamic";
import ProductGridWithSearch from "./_components/AllProducts/ProductGridWithSearch";
import getAllCategoriesApi from "@/api/getAllCategoriesApi";
import getAllProductsApi from "@/api/getAllProductsApi";
import React, { Suspense } from "react";

const MainSlider = dynamic(() => import("./_components/MainSlider/MainSlider"), {
  loading: () => <div className="h-[300px] bg-slate-200/60 dark:bg-slate-800/80 animate-pulse rounded-2xl max-w-7xl mx-auto my-6" />
});

const CategorySwiper = dynamic(() => import("./_components/CategorySwiper/CategorySwiper"), {
  loading: () => <div className="h-[200px] bg-slate-200/60 dark:bg-slate-800/80 animate-pulse rounded-2xl max-w-7xl mx-auto my-6" />
});

export default async function Home() {
  const [categoriesRes, productsData] = await Promise.all([
    getAllCategoriesApi(),
    getAllProductsApi()
  ]);

  const categories = categoriesRes?.data || [];
  const products = productsData || [];

  return (
    <>
      <MainSlider />
      <CategorySwiper data={categories} />
      <Suspense fallback={null}>
        <ProductGridWithSearch initialProducts={products} limit={12} />
      </Suspense>
    </>
  );
}
