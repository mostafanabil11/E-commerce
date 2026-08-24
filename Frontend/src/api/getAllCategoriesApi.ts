import { fetchApi } from '@/lib/api';
import { CategoryType } from '@/Types/Category.type';

export default async function getAllCategoriesApi() {
  return fetchApi<{ data?: CategoryType[] }>('/categories', { fallback: { data: [] } });
}
