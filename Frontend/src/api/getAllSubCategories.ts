import { fetchApi } from '@/lib/api';

export default async function getAllSubCategoriesApi() {
  return fetchApi<{ data?: unknown[] }>('/subcategories', { fallback: { data: [] } });
}
