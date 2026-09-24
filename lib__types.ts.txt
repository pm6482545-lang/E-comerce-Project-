export type ProductImage = { image_url: string }

export type Variant = {
  id: string | number
  size?: string | null
  color?: string | null
  name?: string | null
  sku?: string | null
  stock?: number | null
  stock_quantity?: number | null
}

export type Product = {
  id: string | number
  slug: string
  name: string
  description?: string | null
  price: number | string
  sale_price?: number | string | null
  material_care?: string | null
  category_id?: string | number | null
  created_at?: string | null
  product_images?: ProductImage[] | null
  product_variants?: Variant[] | null
  categories?: { name: string } | null
}
