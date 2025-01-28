// components/PriceAlerts.tsx
'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'

type PriceAlert = {
    id: string
    product_id: string
    old_price: number
    new_price: number
    created_at: string
    notified_at: string | null
    threshold_triggered: boolean
    product: {
        title: string
        brand: string
    }
}

export default function PriceAlerts() {
    const [alerts, setAlerts] = useState<PriceAlert[]>([])
    const [isLoading, setIsLoading] = useState(true)

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    useEffect(() => {
        fetchAlerts()
    }, [])

    const fetchAlerts = async () => {
        try {
            setIsLoading(true)
            const { data: { user } } = await supabase.auth.getUser()
            
            if (!user) {
                console.log('No user found')
                return
            }

            const { data, error } = await supabase
                .from('price_alerts')
                .select(`
                    *,
                    product:products (
                        title,
                        brand
                    )
                `)
                .eq('user_id', user.id)
                .is('notified_at', null)
                .order('created_at', { ascending: false })
                .limit(5)

            if (error) {
                console.error('Supabase error:', error)
                throw error
            }

            console.log('Fetched alerts:', data)
            setAlerts(data || [])
        } catch (error) {
            console.error('Error fetching alerts:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const markAsNotified = async (alertId: string) => {
        try {
            const { error } = await supabase
                .from('price_alerts')
                .update({ notified_at: new Date().toISOString() })
                .eq('id', alertId)

            if (error) throw error

            setAlerts(prev =>
                prev.filter(alert => alert.id !== alertId)
            )
        } catch (error) {
            console.error('Error marking alert as notified:', error)
        }
    }

    if (isLoading) {
        return (
            <div className="mb-6 bg-white rounded-lg shadow p-4">
                <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
                    <div className="space-y-3">
                        <div className="h-20 bg-gray-200 rounded"></div>
                    </div>
                </div>
            </div>
        )
    }

    if (alerts.length === 0) {
        return null;  // Don't show anything if there are no alerts
    }

    return (
        <div className="mb-6 bg-white rounded-lg shadow p-4">
            <h2 className="text-lg font-semibold mb-4">Price Alerts</h2>
            <div className="space-y-4">
                {alerts.map((alert) => (
                    <div 
                        key={alert.id}
                        className={`p-4 rounded-lg ${
                            alert.threshold_triggered 
                                ? 'bg-green-50 border border-green-100' 
                                : 'bg-blue-50 border border-blue-100'
                        }`}
                    >
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="font-medium">
                                    {alert.product?.brand} - {alert.product?.title}
                                </p>
                                <p className="text-sm mt-1">
                                    Price dropped from <span className="line-through">£{alert.old_price.toFixed(2)}</span> to{' '}
                                    <span className="font-semibold">£{alert.new_price.toFixed(2)}</span>
                                </p>
                                {alert.threshold_triggered && (
                                    <p className="text-sm text-green-600 mt-1">
                                        Target price reached! 🎉
                                    </p>
                                )}
                                <p className="text-xs text-gray-500 mt-1">
                                    {new Date(alert.created_at).toLocaleDateString()}
                                </p>
                            </div>
                            <button
                                onClick={() => markAsNotified(alert.id)}
                                className="text-xs text-gray-500 hover:text-gray-700"
                            >
                                Dismiss
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}