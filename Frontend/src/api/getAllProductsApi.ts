import { apiUrl } from '@/lib/api';


export default async function getAllProductsApi() {
  const response = await fetch(apiUrl('/products'), {
    next: { revalidate: 3600 }
  });
  const { data } = await response.json();
  return data;
}

