export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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
        console.log('Starting price update cron job...');
        
        // Simply fetch from your existing prices endpoint
        const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/prices`);
        
        if (!response.ok) {
            throw new Error(`Failed to fetch prices: ${response.statusText}`);
        }
        
        const { prices } = await response.json();
        
        if (!prices || Object.keys(prices).length === 0) {
            throw new Error('No prices returned from API');
        }

        console.log(`Successfully fetched ${Object.keys(prices).length} prices`);

        // Process each price
        for (const [productId, priceData] of Object.entries(prices)) {
            const { currentPrice, title, imageUrl } = priceData as any;

            // Get last price first
            const { data: lastPriceRecord } = await supabase
                .from('price_history')
                .select('price')
                .eq('product_id', productId)
                .order('captured_at', { ascending: false })
                .limit(1)
                .single();

            const lastPrice = lastPriceRecord?.price;

            // Insert new price history record
            await supabase
                .from('price_history')
                .insert({
                    product_id: productId,
                    price: currentPrice,
                    title,
                    image_url: imageUrl
                });

            // Update product record
            await supabase
                .from('products')
                .update({ 
                    current_price: currentPrice,
                    last_price: lastPrice || currentPrice,
                    last_updated: new Date().toISOString()
                })
                .eq('id', productId);
        }

        // Log success
        await logPriceUpdate(
            true, 
            Object.keys(prices).length, 
            'Successfully updated prices'
        );

        return NextResponse.json({ 
            success: true,
            message: `Updated prices for ${Object.keys(prices).length} products`
        });

    } catch (error) {
        console.error('Cron job error:', error);
        
        // Log failure
        await logPriceUpdate(
            false, 
            0, 
            error instanceof Error ? error.message : 'Unknown error'
        );

        return NextResponse.json(
            { error: 'Failed to run price updates' },
            { status: 500 }
        );
    }
}