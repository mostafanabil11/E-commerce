import { apiUrl } from '@/lib/api';


export default async function getAllSubCategoriesApi() {
const response = await fetch(apiUrl('/subcategories'));
const payload = await response.json();
return payload
}
