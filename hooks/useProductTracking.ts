import { useState, useEffect, useCallback } from 'react'
import { supabaseClient } from '@/lib/supabaseClient'

// Define the type for items returned by the Supabase query
type TrackedProduct = {
  product_id: string;
}

export function useProductTracking() {
  const [trackedProducts, setTrackedProducts] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(true)

  const fetchTrackedProducts = useCallback(async () => {
    try {
      const { data: { user } } = await supabaseClient.auth.getUser()
      console.log('Current user:', user)
      
      if (!user) {
        console.log('No user found')
        setTrackedProducts(new Set())
        return
      }

      const { data, error } = await supabaseClient
        .from('user_product_tracking')
        .select('product_id')
        .eq('user_id', user.id)

      console.log('Fetch result:', { data, error })

      if (error) {
        throw error
      }

      if (data) {
        // Use the TrackedProduct type instead of any
        setTrackedProducts(new Set(data.map((item: TrackedProduct) => item.product_id)))
      }
    } catch (error) {
      console.error('Error fetching tracked products:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    // Set up an auth state change listener that triggers a re-fetch.
    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange(() => {
      fetchTrackedProducts()
    })

    // Initial fetch.
    fetchTrackedProducts()

    // Cleanup the subscription on unmount.
    return () => {
      subscription.unsubscribe()
    }
  }, [fetchTrackedProducts])

  const trackProduct = async (productId: string) => {
    try {
      const { data: { user } } = await supabaseClient.auth.getUser()
      console.log('Tracking for user:', user)

      if (!user) {
        throw new Error('User not authenticated')
      }

      if (trackedProducts.has(productId)) {
        console.log('Untracking product:', productId)
        const { error } = await supabaseClient
          .from('user_product_tracking')
          .delete()
          .eq('user_id', user.id)
          .eq('product_id', productId)

        if (error) {
          console.error('Delete error:', error)
          throw error
        }

        setTrackedProducts(prev => {
          const newSet = new Set(prev)
          newSet.delete(productId)
          return newSet
        })
      } else {
        console.log('Tracking new product:', productId)
        const { error } = await supabaseClient
          .from('user_product_tracking')
          .insert({
            user_id: user.id,
            product_id: productId
          })

        if (error) {
          console.error('Insert error:', error)
          throw error
        }

        setTrackedProducts(prev => new Set([...prev, productId]))
      }
    } catch (error) {
      console.error('Error in trackProduct:', error)
      throw error
    }
  }

  return {
    trackedProducts,
    isLoading,
    trackProduct
  }
}