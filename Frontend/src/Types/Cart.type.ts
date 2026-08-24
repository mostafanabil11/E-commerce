import { Dispatch, SetStateAction } from "react"

export interface CartType {
  status: string
  numOfCartItems: number
  cartId: string
  data: Data
}

export interface Data {
  _id: string
  cartOwner: string
  products: CartProductType []
  createdAt: string
  updatedAt: string
  __v: number
  totalCartPrice: number
}

export interface CartProductType {
  count: number
  _id: string
  product: Product2
  price: number
}

export interface Product2 {
  subcategory: Subcategory[]
  _id: string
  title: string
  quantity: number
  imageCover: string
  category: Category
  brand: Brand
  ratingsAverage: number
  id: string
}

export interface Subcategory {
  _id: string
  name: string
  slug: string
  category: string
}

export interface Category {
  _id: string
  name: string
  slug: string
  image: string
}

export interface Brand {
  _id: string
  name: string
  slug: string
  image: string
}
export interface CartItemProps {
    product : CartProductType;
    setProducts : Dispatch<SetStateAction<CartProductType[]>>;
    setIsLoading : Dispatch<SetStateAction<boolean>>;
}