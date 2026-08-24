import { fetchApi } from '@/lib/api';
import { BrandType } from '@/Types/Brand.type';

export default async function getAllBrandsApi() {
  return fetchApi<{ data?: BrandType[] }>('/brands', { fallback: { data: [] } });
}
