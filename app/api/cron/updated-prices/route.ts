// app/api/cron/updated-prices/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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

async function processPrice(productId: string, priceData: PriceData) {
    // Get last price and update both tables in parallel
    const [lastPriceResponse, historyInsertResponse] = await Promise.all([
        supabase
            .from('price_history')
            .select('price')
            .eq('product_id', productId)
            .order('captured_at', { ascending: false })
            .limit(1)
            .single(),
        supabase
            .from('price_history')
            .insert({
                product_id: productId,
                price: priceData.currentPrice,
                title: priceData.title,
                image_url: priceData.imageUrl
            })
    ]);

    const lastPrice = lastPriceResponse.data?.price;

    // Update product
    await supabase
        .from('products')
        .update({ 
            current_price: priceData.currentPrice,
            last_price: lastPrice || priceData.currentPrice,
            last_updated: new Date().toISOString()
        })
        .eq('id', productId);
}

export async function GET() {
    try {
        console.log('Starting price update process...');
        
        const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/prices`);
        if (!response.ok) {
            throw new Error(`Failed to fetch prices: ${response.statusText}`);
        }

        const { prices }: { prices: Prices } = await response.json();
        
        // Process prices in parallel, but limit concurrency to 3 at a time
        const batchSize = 3;
        const priceEntries = Object.entries(prices);
        
        for (let i = 0; i < priceEntries.length; i += batchSize) {
            const batch = priceEntries.slice(i, i + batchSize);
            await Promise.all(
                batch.map(([productId, priceData]) => 
                    processPrice(productId, priceData)
                )
            );
        }

        await logPriceUpdate(true, Object.keys(prices).length, 'Successfully updated prices');

        return NextResponse.json({ 
            success: true,
            message: `Updated prices for ${Object.keys(prices).length} products`
        });
    } catch (error) {
        console.error('Error in cron job:', error);
        await logPriceUpdate(false, 0, error instanceof Error ? error.message : 'Unknown error');

        return NextResponse.json(
            { error: 'Failed to run price updates' },
            { status: 500 }
        );
    }
}