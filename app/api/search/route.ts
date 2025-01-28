import { NextResponse } from 'next/server';
import crypto from 'crypto';

const ACCESS_KEY = process.env.AMAZON_ACCESS_KEY!;
const SECRET_KEY = process.env.AMAZON_SECRET_KEY!;
const PARTNER_TAG = process.env.AMAZON_PARTNER_TAG!;

interface AmazonItem {
    ASIN: string;
    ItemInfo?: {
        Title?: {
            DisplayValue?: string;
        };
    };
    Images?: {
        Primary?: {
            Medium?: {
                URL?: string;
            };
        };
    };
    Offers?: {
        Listings?: Array<{
            Price?: {
                Amount?: number;
            };
        }>;
    };
}

interface AmazonResponse {
    SearchResult: {
        Items: AmazonItem[];
        TotalResultCount?: number;
    };
}

function sign(key: Buffer | Uint8Array, msg: string): Buffer {
    return crypto.createHmac('sha256', key).update(msg).digest();
}

async function searchProducts(query: string) {
    const host = 'webservices.amazon.co.uk';
    const region = 'eu-west-1';
    const service = 'ProductAdvertisingAPI';

    const amzdate = new Date().toISOString().replace(/[:\-]|\.\d{3}/g, '');
    const datestamp = amzdate.slice(0, 8);

    const payload = {
        "Keywords": query,
        "Resources": [
            "Images.Primary.Medium",
            "ItemInfo.Title",
            "Offers.Listings.Price"
        ],
        "PartnerTag": PARTNER_TAG,
        "PartnerType": "Associates",
        "Marketplace": "www.amazon.co.uk",
        "Operation": "SearchItems",
        "SearchIndex": "All"
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

    let k: Buffer | Uint8Array = Buffer.from(`AWS4${SECRET_KEY}`);
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

    const response = await fetch(`https://${host}/paapi5/searchitems`, {
        method: 'POST',
        headers: headers,
        body: payloadString
    });

    if (!response.ok) {
        const responseText = await response.text();
        throw new Error(`Amazon API error: ${response.statusText}. Details: ${responseText}`);
    }

    return response.json();
}

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const query = searchParams.get('q');

        if (!query) {
            return NextResponse.json(
                { error: 'Search query is required' },
                { status: 400 }
            );
        }

        const data = await searchProducts(query);
        const results: Record<string, {
            currentPrice: number;
            title: string;
            imageUrl: string;
        }> = {};

        if (data.SearchResult?.Items) {
            for (const item of data.SearchResult.Items) {
                const listing = item.Offers?.Listings?.[0];
                if (listing) {
                    results[item.ASIN] = {
                        currentPrice: listing.Price?.Amount || 0,
                        title: item.ItemInfo?.Title?.DisplayValue || '',
                        imageUrl: item.Images?.Primary?.Medium?.URL || ''
                    };
                }
            }
        }

        return NextResponse.json({ 
            results,
            totalResults: data.SearchResult?.TotalResultCount || 0
        });
    } catch (error) {
        console.error('Error searching products:', error);
        return NextResponse.json(
            { error: 'Failed to search products' },
            { status: 500 }
        );
    }
}