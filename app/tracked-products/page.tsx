'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabaseClient } from '@/lib/supabaseClient'
import { toast, Toaster } from 'sonner'

type Product = {
  id: string;
  title: string;
  subtitle: string;
  brand: string;
  category: string;
  amazonUrl: string;
  features: string[];
  currentPrice?: number;
  previousPrice?: number;
  lastUpdated?: string;
  imageUrl?: string;
  apiTitle?: string;
}

export default function TrackedProducts() {
  const [trackedProducts, setTrackedProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetchTrackedProducts()
  }, [])

  const fetchTrackedProducts = async () => {
    try {
      setIsLoading(true)
      
      // Use getSession() to retrieve the current session and user.
      const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession()
      if (sessionError || !session) {
        // If no session exists, redirect to login.
        router.push('/login')
        return
      }
      const user = session.user

      // Get tracked product IDs from the user_product_tracking table for the current user.
      const { data: trackingData, error: trackingError } = await supabaseClient
        .from('user_product_tracking')
        .select('product_id')
        .eq('user_id', user.id)

      if (trackingError) {
        throw trackingError
      }

      const productIds = trackingData?.map((item: any) => item.product_id) || []
      
      if (productIds.length === 0) {
        setTrackedProducts([])
        return
      }

      // Query the products table for details of these product IDs.
      const { data: productsData, error: productsError } = await supabaseClient
        .from('products')
        .select(`
          id,
          title,
          subtitle,
          brand,
          category,
          amazon_url,
          features,
          current_price,
          last_price,
          last_updated,
          image_url,
          api_title
        `)
        .in('id', productIds)

      if (productsError) {
        throw productsError
      }

      // Map the database columns to our Product type.
      const mappedProducts: Product[] = (productsData || []).map((p: any) => ({
        id: p.id,
        title: p.title,
        subtitle: p.subtitle,
        brand: p.brand,
        category: p.category,
        amazonUrl: p.amazon_url,
        features: p.features,
        currentPrice: p.current_price,
        previousPrice: p.last_price,
        lastUpdated: p.last_updated,
        imageUrl: p.image_url,
        apiTitle: p.api_title,
      }))

      setTrackedProducts(mappedProducts)
    } catch (error) {
      console.error('Failed to fetch tracked products:', error)
      toast.error('Failed to fetch tracked products')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveTracking = async (productId: string) => {
    try {
      const { error } = await supabaseClient
        .from('user_product_tracking')
        .delete()
        .eq('product_id', productId)
      if (error) {
        throw error
      }
      toast.success('Product removed from tracking')
      fetchTrackedProducts()
    } catch (error) {
      console.error('Error removing tracking:', error)
      toast.error('Failed to remove tracking')
    }
  }

  const formatPrice = (price?: number) => {
    return price ? `£${price.toFixed(2)}` : 'Price unavailable'
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <Toaster />
      <header className="bg-white shadow p-4 mb-6">
        <h1 className="text-3xl font-bold text-gray-900">My Tracked Products</h1>
      </header>
      <main className="max-w-7xl mx-auto">
        {isLoading ? (
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          </div>
        ) : trackedProducts.length === 0 ? (
          <p className="text-gray-600">You are not tracking any products yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trackedProducts.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-lg shadow p-4"
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">{product.title}</h2>
                  <button
                    onClick={() => handleRemoveTracking(product.id)}
                    className="text-red-500 text-sm"
                  >
                    Remove
                  </button>
                </div>
                <div className="mb-4">
                  <img
                    src={product.imageUrl || '/placeholder.jpg'}
                    alt={product.title}
                    className="w-full h-48 object-contain rounded"
                  />
                </div>
                <p className="text-gray-600">{product.subtitle}</p>
                <div className="mt-4">
                  <p className="text-2xl font-bold text-gray-900">
                    {formatPrice(product.currentPrice)}
                  </p>
                  {product.previousPrice && (
                    <p className="text-sm text-gray-500">
                      Previous: {formatPrice(product.previousPrice)}
                    </p>
                  )}
                  {product.lastUpdated && (
                    <p className="text-xs text-gray-500">
                      Updated: {new Date(product.lastUpdated).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <div className="mt-4">
                  <a
                    href={product.amazonUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-center px-4 py-2 border border-gray-300 rounded-md text-gray-600 hover:bg-gray-50"
                  >
                    View on Amazon
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}