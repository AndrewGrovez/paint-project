// hooks/useProductTracking.ts
import { useState, useEffect, useCallback } from 'react'
import { createBrowserClient } from '@supabase/ssr'

export function useProductTracking() {
    const [trackedProducts, setTrackedProducts] = useState<Set<string>>(new Set())
    const [isLoading, setIsLoading] = useState(true)

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const fetchTrackedProducts = useCallback(async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            console.log('Current user:', user)
            
            if (!user) {
                console.log('No user found')
                setTrackedProducts(new Set())
                return
            }

            const { data, error } = await supabase
                .from('user_product_tracking')
                .select('product_id')
                .eq('user_id', user.id)

            console.log('Fetch result:', { data, error })

            if (error) {
                throw error
            }

            if (data) {
                setTrackedProducts(new Set(data.map(item => item.product_id)))
            }
        } catch (error) {
            console.error('Error fetching tracked products:', error)
        } finally {
            setIsLoading(false)
        }
    }, [supabase])

    useEffect(() => {
        // Set up auth state change listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
            fetchTrackedProducts()
        })

        // Initial fetch
        fetchTrackedProducts()

        // Cleanup
        return () => {
            subscription.unsubscribe()
        }
    }, [fetchTrackedProducts, supabase.auth])

    const trackProduct = async (productId: string) => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            console.log('Tracking for user:', user)

            if (!user) {
                throw new Error('User not authenticated')
            }

            if (trackedProducts.has(productId)) {
                console.log('Untracking product:', productId)
                const { error } = await supabase
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
                const { error } = await supabase
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