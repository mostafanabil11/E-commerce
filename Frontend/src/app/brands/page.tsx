import getAllBrandsApi from '@/api/getAllBrandsApi'
import React, { Suspense } from 'react'
import BrandsClient from './BrandsClient'
import MainLoading from '../loading'

export default async function Brands() {
  const res = await getAllBrandsApi();
  const brands = res?.data || [];

  return (
    <Suspense fallback={<div className="min-h-[60vh] flex items-center justify-center"><MainLoading /></div>}>
      <BrandsClient initialBrands={brands} />
    </Suspense>
  );
}
