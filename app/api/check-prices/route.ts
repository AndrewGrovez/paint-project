import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Define interfaces
interface PriceData {
    currentPrice: number;
    title?: string;
}

interface Prices {
    [productId: string]: PriceData;
}

interface PriceResult {
    oldPrice?: number;
    newPrice?: number;
    lastChecked?: string;
    priceChanged: boolean;
    price?: number;
}

interface Results {
    [productId: string]: PriceResult;
}

// Initialize Supabase client
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY! // Use service key for admin access
);

async function getLastPrice(productId: string) {
    const { data } = await supabase
        .from('price_history')
        .select('price, captured_at')
        .eq('product_id', productId)
        .order('captured_at', { ascending: false })
        .limit(1)
        .single();
    
    return data;
}

async function createPriceAlert(productId: string, oldPrice: number, newPrice: number, productTitle?: string) {
    try {
        // Get all users tracking this product
        const { data: trackingUsers, error: trackingError } = await supabase
            .from('user_product_tracking')
            .select('user_id, price_threshold')
            .eq('product_id', productId);

        if (trackingError) {
            console.error('Error fetching tracking users:', trackingError);
            return;
        }

        if (trackingUsers && trackingUsers.length > 0) {
            // Only create alerts for price drops
            if (newPrice < oldPrice) {
                const alerts = trackingUsers.map(({ user_id, price_threshold }) => ({
                    user_id,
                    product_id: productId,
                    old_price: oldPrice,
                    new_price: newPrice,
                    threshold_triggered: price_threshold ? newPrice <= price_threshold : false,
                    price_drop_percentage: ((oldPrice - newPrice) / oldPrice) * 100,
                    created_at: new Date().toISOString(),
                    product_title: productTitle
                }));

                // Insert alerts
                const { error: insertError } = await supabase
                    .from('price_alerts')
                    .insert(alerts);

                if (insertError) {
                    console.error('Error creating price alerts:', insertError);
                    return;
                }

                console.log(`Created ${alerts.length} alerts for product ${productId} (${productTitle})`);
                console.log(`Price dropped from £${oldPrice} to £${newPrice}`);
            }
        }
    } catch (error) {
        console.error('Error in createPriceAlert:', error);
    }
}

export async function POST(req: Request) {
    try {
        const { prices }: { prices: Prices } = await req.json();
        const results: Results = {};

        for (const [productId, priceData] of Object.entries(prices)) {
            const currentPrice = priceData.currentPrice;
            
            if (currentPrice) {
                // Get the last recorded price
                const lastPriceData = await getLastPrice(productId);

                // Record new price in history
                const { error: insertError } = await supabase
                    .from('price_history')
                    .insert({
                        product_id: productId,
                        price: currentPrice,
                        captured_at: new Date().toISOString()
                    });

                if (insertError) {
                    console.error(`Error recording price history for ${productId}:`, insertError);
                    continue;
                }

                // If we have a previous price and it's dropped, create alerts
                if (lastPriceData?.price && lastPriceData.price !== currentPrice) {
                    await createPriceAlert(
                        productId, 
                        lastPriceData.price, 
                        currentPrice,
                        priceData.title
                    );

                    results[productId] = {
                        oldPrice: lastPriceData.price,
                        newPrice: currentPrice,
                        lastChecked: lastPriceData.captured_at,
                        priceChanged: true
                    };
                } else {
                    results[productId] = {
                        price: currentPrice,
                        priceChanged: false
                    };
                }
            }
        }

        return NextResponse.json({ 
            success: true,
            results
        });
    } catch (error) {
        console.error('Error processing prices:', error);
        return NextResponse.json(
            { error: 'Failed to process prices' },
            { status: 500 }
        );
    }
}