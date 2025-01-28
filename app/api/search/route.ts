// app/api/search/route.ts
import { NextResponse } from 'next/server';
import crypto from 'crypto';

const ACCESS_KEY = process.env.AMAZON_ACCESS_KEY!;
const SECRET_KEY = process.env.AMAZON_SECRET_KEY!;
const PARTNER_TAG = process.env.AMAZON_PARTNER_TAG!;

function sign(key: Buffer, msg: string) {
    return crypto.createHmac('sha256', key).update(msg).digest();
}

async function delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const query = searchParams.get('q');

        if (!query) {
            return NextResponse.json({ error: 'Search query is required' }, { status: 400 });
        }

        // Add a delay at the start of each request
        await delay(2000); // 2 second delay

        const host = 'webservices.amazon.co.uk';
        const region = 'eu-west-1';
        const service = 'ProductAdvertisingAPI';
        
        const amzdate = new Date().toISOString().replace(/[:\-]|\.\d{3}/g, '');
        const datestamp = amzdate.slice(0, 8);

        const payload = {
            "Operation": "SearchItems",
            "Keywords": query,
            "PartnerTag": PARTNER_TAG,
            "PartnerType": "Associates",
            "Marketplace": "www.amazon.co.uk",
            "Resources": [
                "ItemInfo.Title",
                "Offers.Listings.Price",
                "Images.Primary.Medium",
                "Offers.Listings.DeliveryInfo.IsPrimeEligible",
                "Offers.Listings.SavePrice",
                "ItemInfo.Classifications",
                "ItemInfo.Features",
                "ItemInfo.ManufactureInfo"
            ],
            "BrowseNodeIds": ["79903031"],  // Just DIY & Tools > Painting Tools & Supplies
            "ItemCount": 3,  // Reduced item count
            "SearchIndex": "DIY"
        };

        const payloadString = JSON.stringify(payload);
        const payloadHash = crypto.createHash('sha256').update(payloadString).digest('hex');

        const canonical_headers = 
            'content-encoding:amz-1.0\n' +
            'content-type:application/json; charset=utf-8\n' +
            `host:${host}\n` +
            `x-amz-date:${amzdate}\n` +
            'x-amz-target:com.amazon.paapi5.v1.ProductAdvertisingAPIv1.SearchItems\n';
        
        const signed_headers = 'content-encoding;content-type;host;x-amz-date;x-amz-target';

        const canonical_request = [
            'POST',
            '/paapi5/searchitems',
            '',
            canonical_headers,
            signed_headers,
            payloadHash
        ].join('\n');

        const algorithm = 'AWS4-HMAC-SHA256';
        const credential_scope = `${datestamp}/${region}/${service}/aws4_request`;
        const string_to_sign = [
            algorithm,
            amzdate,
            credential_scope,
            crypto.createHash('sha256').update(canonical_request).digest('hex')
        ].join('\n');

        let k = Buffer.from(`AWS4${SECRET_KEY}`);
        k = sign(k, datestamp);
        k = sign(k, region);
        k = sign(k, service);
        k = sign(k, 'aws4_request');
        const signature = sign(k, string_to_sign).toString('hex');

        const authorization_header = [
            `${algorithm} `,
            `Credential=${ACCESS_KEY}/${credential_scope}, `,
            `SignedHeaders=${signed_headers}, `,
            `Signature=${signature}`
        ].join('');

        const headers = {
            'content-encoding': 'amz-1.0',
            'content-type': 'application/json; charset=utf-8',
            'host': host,
            'x-amz-date': amzdate,
            'x-amz-target': 'com.amazon.paapi5.v1.ProductAdvertisingAPIv1.SearchItems',
            'Authorization': authorization_header
        };

        console.log('Making request to Amazon API...');
        const response = await fetch(`https://${host}/paapi5/searchitems`, {
            method: 'POST',
            headers: headers,
            body: payloadString
        });

        console.log('Amazon API Response Status:', response.status);
        const responseText = await response.text();
        console.log('Amazon API Response:', responseText);

        if (!response.ok) {
            throw new Error(`Amazon API error: ${response.statusText}. Details: ${responseText}`);
        }

        const data = JSON.parse(responseText);

        // Check if we have results
        if (!data || !data.SearchResult || !data.SearchResult.Items) {
            return NextResponse.json({ products: [] });
        }

        const products = data.SearchResult.Items.map((item: any) => ({
            id: item.ASIN,
            title: item.ItemInfo.Title.DisplayValue,
            price: item.Offers?.Listings?.[0]?.Price?.Amount || 0,
            imageUrl: item.Images?.Primary?.Medium?.URL || '',
            isPrime: item.Offers?.Listings?.[0]?.DeliveryInfo?.IsPrimeEligible || false,
            savedAmount: item.Offers?.Listings?.[0]?.SavePrice?.Amount || 0,
            url: item.DetailPageURL || '',
            features: item.ItemInfo?.Features?.DisplayValues || [],
            manufacturer: item.ItemInfo?.ManufactureInfo?.Manufacturer?.DisplayValue || '',
            category: item.ItemInfo?.Classifications?.ProductGroup?.DisplayValue || 'DIY'
        }));

        return NextResponse.json({ products });

    } catch (error) {
        console.error('Search error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to search products' },
            { status: 500 }
        );
    }
}