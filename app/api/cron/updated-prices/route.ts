// app/api/cron/update-prices/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Define interfaces
interface PriceData {
    currentPrice: number;
    title: string;
    imageUrl: string;
    previousPrice: number;
    lastUpdated: string;
}

interface Prices {
    [productId: string]: PriceData;
}

interface LastPriceRecord {
    price: number;
}

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
);

async function logPriceUpdate(success: boolean, productsUpdated: number, details?: string) {
    await supabase
        .from('price_update_logs')
        .insert({
            success,
            products_updated: productsUpdated,
            details
        });
}

export async function GET() {
    try {
        // 1. Fetch latest prices from your Amazon API endpoint
        const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/prices`);
        if (!response.ok) {
            throw new Error('Failed to fetch prices');
        }
        
        const { prices }: { prices: Prices } = await response.json();

        // 2. Store each price in price_history and update products
        for (const [productId, priceData] of Object.entries(prices)) {
            // Get the last recorded price
            const { data: lastPriceRecord } = await supabase
                .from('price_history')
                .select('price')
                .eq('product_id', productId)
                .order('captured_at', { ascending: false })
                .limit(1)
                .single();

            const lastPrice = (lastPriceRecord as LastPriceRecord)?.price;
            const currentPrice = priceData.currentPrice;

            // Record new price in history
            await supabase
                .from('price_history')
                .insert({
                    product_id: productId,
                    price: currentPrice,
                    title: priceData.title,
                    image_url: priceData.imageUrl
                });

            // Update the product's current price
            await supabase
                .from('products')
                .update({ 
                    current_price: currentPrice,
                    last_price: lastPrice || currentPrice,
                    last_updated: new Date().toISOString()
                })
                .eq('id', productId);
        }

        // Log successful update
        await logPriceUpdate(true, Object.keys(prices).length, 'Successfully updated prices');

        return NextResponse.json({ 
            success: true,
            message: `Updated prices for ${Object.keys(prices).length} products`
        });
    } catch (error) {
        // Log failed update
        await logPriceUpdate(false, 0, error instanceof Error ? error.message : 'Unknown error');

        console.error('Error in cron job:', error);
        return NextResponse.json(
            { error: 'Failed to run price updates' },
            { status: 500 }
        );
    }
}