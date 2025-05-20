// app/tracked-products/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { supabaseClient } from '@/lib/supabaseClient';
import { toast, Toaster } from 'sonner';
import DashboardHeader from '@/components/DashboardHeader';

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
};

type TrackedProductData = {
  product_id: string;
  price_threshold?: number | null;
  created_at: string;
};

type ProductData = {
  id: string;
  title: string;
  subtitle: string;
  brand: string;
  category: string;
  amazon_url: string;
  features: string[];
  current_price?: number;
  last_price?: number;
  last_updated?: string;
};

export default function TrackedProducts() {
  const [trackedProducts, setTrackedProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const fetchTrackedProducts = useCallback(async () => {
    try {
      setIsLoading(true);

      const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession();
      if (sessionError) {
        console.error('Session fetch error:', sessionError.message);
        throw new Error(`Failed to fetch session: ${sessionError.message}`);
      }
      if (!session) {
        console.log('No active session, redirecting to login');
        router.push('/login');
        return;
      }
      const user = session.user;
      console.log('Logged-in User ID:', user.id);

      const { data: trackingData, error: trackingError } = await supabaseClient
        .from('user_product_tracking')
        .select('product_id, price_threshold, created_at')
        .eq('user_id', user.id);

      if (trackingError) {
        console.error('Tracking query error:', trackingError.message, trackingError.hint, trackingError.details);
        throw new Error(`Failed to fetch tracking data: ${trackingError.message}`);
      }
      if (!trackingData || trackingData.length === 0) {
        console.log('No products tracked for user:', user.id);
        setTrackedProducts([]);
        return;
      }
      console.log('Tracking data:', trackingData);

      const productIds = trackingData.map((item: TrackedProductData) => item.product_id);
      console.log('Product IDs to fetch:', productIds);

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
          last_updated
        `)
        .in('id', productIds);

      if (productsError) {
        console.error('Products query error:', productsError.message, productsError.hint, productsError.details);
        throw new Error(`Failed to fetch products: ${productsError.message}`);
      }
      if (!productsData || productsData.length === 0) {
        console.warn('No products found in "products" table for IDs:', productIds);
        setTrackedProducts([]);
        return;
      }
      console.log('Products data:', productsData);

      const mappedProducts: Product[] = productsData.map((p: ProductData) => ({
        id: p.id,
        title: p.title,
        subtitle: p.subtitle,
        brand: p.brand,
        category: p.category,
        amazonUrl: p.amazon_url,
        features: p.features || [],
        currentPrice: p.current_price,
        previousPrice: p.last_price,
        lastUpdated: p.last_updated,
        imageUrl: undefined,
        apiTitle: undefined,
      }));

      if (productsData.length > 0) {
        const response = await fetch('/api/prices');
        if (!response.ok) {
          console.error('Failed to fetch prices from API:', await response.text());
        } else {
          const { prices } = await response.json();
          mappedProducts.forEach(product => {
            const apiData = prices[product.id];
            if (apiData) {
              product.imageUrl = apiData.imageUrl;
              product.apiTitle = apiData.title;
              product.currentPrice = apiData.currentPrice;
            }
          });
        }
      }

      console.log('Mapped products with API data:', mappedProducts);
      setTrackedProducts(mappedProducts);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Failed to fetch tracked products:', error);
      toast.error(`Failed to fetch tracked products: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchTrackedProducts();
  }, [fetchTrackedProducts]);

  const handleRemoveTracking = async (productId: string) => {
    try {
      const { data: { session } } = await supabaseClient.auth.getSession();
      if (!session) {
        console.log('No session, redirecting to login');
        router.push('/login');
        return;
      }
      const user = session.user;

      const { error } = await supabaseClient
        .from('user_product_tracking')
        .delete()
        .eq('user_id', user.id)
        .eq('product_id', productId);

      if (error) {
        console.error('Remove tracking error:', error.message, error.hint, error.details);
        throw new Error(`Failed to remove tracking: ${error.message}`);
      }
      toast.success('Product removed from tracking');
      fetchTrackedProducts();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error removing tracking:', error);
      toast.error(`Failed to remove tracking: ${errorMessage}`);
    }
  };

  const formatPrice = (price?: number) => {
    return price !== undefined && price !== null ? `£${price.toFixed(2)}` : 'Price unavailable';
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <Toaster />
      <header className="bg-white shadow p-4 mb-6">
        <DashboardHeader />
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
              <div key={product.id} className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">{product.apiTitle || product.title}</h2>
                  <button
                    onClick={() => handleRemoveTracking(product.id)}
                    className="text-red-500 text-sm"
                  >
                    Remove
                  </button>
                </div>
                <div className="mb-4 flex items-center justify-center relative">
                  <Image
                    src={product.imageUrl || '/images/placeholder.jpg'}
                    alt={product.apiTitle || product.title}
                    width={192}
                    height={192}
                    quality={75}
                    className="object-contain rounded"
                  />
                </div>
                <p className="text-gray-600">{product.subtitle}</p>
                <div className="mt-4">
                  <p className="text-2xl font-bold text-gray-900">
                    {formatPrice(product.currentPrice)}
                  </p>
                  {product.previousPrice !== undefined && (
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
  );
}