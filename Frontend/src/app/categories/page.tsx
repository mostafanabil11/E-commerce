import getAllCategoriesApi from '@/api/getAllCategoriesApi';
import React, { Suspense } from 'react'
import MainLoading from '../loading';
import CategoriesClient from './CategoriesClient';

export default async function Categories() {
  const res = await getAllCategoriesApi();
  const categories = res?.data || [];

  return (
    <Suspense fallback={<div className="min-h-[60vh] flex items-center justify-center"><MainLoading /></div>}>
      <CategoriesClient initialCategories={categories} />
    </Suspense>
  );
}
