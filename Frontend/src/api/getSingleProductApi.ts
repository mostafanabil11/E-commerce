import { fetchApi } from '@/lib/api';
import { ProductType } from '@/Types/Products.types';

/** `data` is undefined when the product is missing or the API is unreachable. */
export default async function getSingleProductApi(id: string) {
  return fetchApi<{ data?: ProductType }>(`/products/${id}`, { fallback: {} });
}
