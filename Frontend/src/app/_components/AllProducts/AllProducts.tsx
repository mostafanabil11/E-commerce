
import React from 'react'
import getAllProductsApi from '@/api/getAllProductsApi';
import ProductGridWithSearch from './ProductGridWithSearch';

export default async function AllProducts() {
  const data = await getAllProductsApi();

  return (
    <ProductGridWithSearch initialProducts={data || []} />
  );
}