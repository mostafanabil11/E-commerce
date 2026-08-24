import getAllCategoriesApi from '@/api/getAllCategoriesApi';
import React from 'react'
import CategorySwiper from '../CategorySwiper/CategorySwiper';

export default async function CategorySlider() {
 
 const { data } = await getAllCategoriesApi();
 console.log(data);
  return <>
  <CategorySwiper data = {data} />


  
  </>
    
}
