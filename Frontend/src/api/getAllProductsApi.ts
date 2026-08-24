import { fetchApi } from '@/lib/api';
import { ProductType } from '@/Types/Products.types';

/** Returns the product list, or an empty list if the API is unreachable. */
export default async function getAllProductsApi(): Promise<ProductType[]> {
  const payload = await fetchApi<{ data?: ProductType[] }>('/products', {
    fallback: {},
  });
  return payload.data ?? [];
}
