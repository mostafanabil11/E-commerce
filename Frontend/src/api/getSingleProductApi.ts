import { apiUrl } from '@/lib/api';


export default async function getSingleProductApi(id: string) {
  const response = await fetch(apiUrl(`/products/${id}`), {
    next: { revalidate: 3600 }
  });
  const data = await response.json();
  return data;
}

