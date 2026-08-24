import { apiUrl } from '@/lib/api';


export default async function getAllBrandsApi() {
  const response = await fetch(apiUrl('/brands'), {
    next: { revalidate: 3600 }
  });
  const data = await response.json();
  return data;
}


