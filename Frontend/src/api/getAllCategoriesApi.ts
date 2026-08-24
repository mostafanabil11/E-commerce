import { apiUrl } from '@/lib/api';


export default async function getAllCategoriesApi() {
  const response = await fetch(apiUrl('/categories'), {
    next: { revalidate: 3600 }
  });
  const data = await response.json();
  return data;
}

