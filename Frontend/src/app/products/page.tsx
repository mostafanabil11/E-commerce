

import React, { Suspense } from 'react'
import getAllProductsApi from '@/api/getAllProductsApi';
import ProductGridWithSearch from '../_components/AllProducts/ProductGridWithSearch';
import MainLoading from '../loading';

export default async function Products() {
  const data = await getAllProductsApi();

  return (
    <div className="w-full">
      <Suspense fallback={<div className="min-h-[60vh] flex items-center justify-center"><MainLoading /></div>}>
        <ProductGridWithSearch initialProducts={data || []} />
      </Suspense>
    </div>
  );
}


