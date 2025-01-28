import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Define interfaces
interface PriceData {
    currentPrice: number;
}

interface Prices {
    [productId: string]: PriceData;
}

// Initialize Supabase client
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY! // Use service key for admin access
);

async function getLastPrice(productId: string) {
    const { data } = await supabase
        .from('price_history')
        .select('price')
        .eq('product_id', productId)
        .order('captured_at', { ascending: false })
        .limit(1)
        .single();
    
    return data?.price;
}

async function createPriceAlert(productId: string, oldPrice: number, newPrice: number) {
    // Get all users tracking this product
    const { data: trackingUsers } = await supabase
        .from('user_product_tracking')
        .select('user_id, price_threshold')
        .eq('product_id', productId);

    if (trackingUsers && trackingUsers.length > 0) {
        const alerts = trackingUsers.map(({ user_id, price_threshold }) => ({
            user_id,
            product_id: productId,
            old_price: oldPrice,
            new_price: newPrice,
            threshold_triggered: price_threshold ? newPrice <= price_threshold : false
        }));

        // Insert alerts
        const { error } = await supabase
            .from('price_alerts')
            .insert(alerts);

        if (error) {
            console.error('Error creating price alerts:', error);
        }
    }
}

export async function POST(req: Request) {
    try {
        const { prices }: { prices: Prices } = await req.json();

        for (const [productId, priceData] of Object.entries(prices)) {
            const currentPrice = priceData.currentPrice;
            
            if (currentPrice) {
                // Get the last recorded price
                const lastPrice = await getLastPrice(productId);

                // Record new price in history
                await supabase
                    .from('price_history')
                    .insert({
                        product_id: productId,
                        price: currentPrice
                    });

                // If we have a previous price and it's changed, create alerts
                if (lastPrice && lastPrice !== currentPrice) {
                    await createPriceAlert(productId, lastPrice, currentPrice);
                }
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error processing prices:', error);
        return NextResponse.json(
            { error: 'Failed to process prices' },
            { status: 500 }
        );
    }
}