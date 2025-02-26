// app/api/prices/route.ts
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { requestQueue } from '@/utils/rateLimiter'; // Adjust path as needed

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
    ItemsResult: {
        Items: AmazonItem[];
    };
}

function sign(key: Buffer | Uint8Array, msg: string): Buffer {
    return crypto.createHmac('sha256', key).update(msg).digest();
}

async function processBatch(batchAsins: string[]): Promise<AmazonResponse> {
    const host = 'webservices.amazon.co.uk';
    const region = 'eu-west-1';
    const service = 'ProductAdvertisingAPI';

    const amzdate = new Date().toISOString().replace(/[:\-]|\.\d{3}/g, '');
    const datestamp = amzdate.slice(0, 8);

    const payload = {
        Operation: 'GetItems',
        ItemIds: batchAsins,
        Resources: [
            'Images.Primary.Medium',
            'ItemInfo.Title',
            'Offers.Listings.Price'
        ],
        PartnerTag: PARTNER_TAG,
        PartnerType: 'Associates',
        Marketplace: 'www.amazon.co.uk'
    };

    const payloadString = JSON.stringify(payload);
    const payloadHash = crypto.createHash('sha256').update(payloadString).digest('hex');

    const canonical_headers =
        'content-encoding:amz-1.0\n' +
        'content-type:application/json; charset=utf-8\n' +
        `host:${host}\n` +
        `x-amz-date:${amzdate}\n` +
        'x-amz-target:com.amazon.paapi5.v1.ProductAdvertisingAPIv1.GetItems\n';
    
    const signed_headers = 'content-encoding;content-type;host;x-amz-date;x-amz-target';
    const canonical_request = [
        'POST',
        '/paapi5/getitems',
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

    let k: Buffer | Uint8Array = Buffer.from(`AWS4${SECRET_KEY}`, 'utf-8');
    k = sign(k, datestamp);
    k = sign(k, region);
    k = sign(k, service);
    k = sign(k, 'aws4_request');
    const signature = sign(k, string_to_sign).toString('hex');

    const authorization_header = [
        `${algorithm} Credential=${ACCESS_KEY}/${credential_scope}`,
        `SignedHeaders=${signed_headers}`,
        `Signature=${signature}`
    ].join(', ');

    const headers = {
        'content-encoding': 'amz-1.0',
        'content-type': 'application/json; charset=utf-8',
        host,
        'x-amz-date': amzdate,
        'x-amz-target': 'com.amazon.paapi5.v1.ProductAdvertisingAPIv1.GetItems',
        Authorization: authorization_header
    };

    const response = await fetch(`https://${host}/paapi5/getitems`, {
        method: 'POST',
        headers,
        body: payloadString
    });

    if (!response.ok) {
        const responseText = await response.text();
        console.error(
            `Amazon API error for batch [${batchAsins.join(', ')}]:`,
            response.status,
            response.statusText,
            responseText
        );
        throw new Error(`Amazon API error: ${response.statusText}. Details: ${responseText}`);
    }

    return response.json();
}

async function getProductPrices(asins: string[]) {
    // Batch ASINs in groups of 10 (Amazon API limit)
    const batchSize = 10;
    const batches: string[][] = [];
    for (let i = 0; i < asins.length; i += batchSize) {
        batches.push(asins.slice(i, i + batchSize));
    }

    const allResults: AmazonResponse = {
        ItemsResult: { Items: [] }
    };

    // Use requestQueue to process each batch sequentially with rate limiting
    const batchResults = await Promise.all(
        batches.map(batch =>
            requestQueue.add(() => processBatch(batch))
        )
    );

    // Merge results from all batches
    for (const result of batchResults) {
        if (result.ItemsResult?.Items) {
            allResults.ItemsResult.Items.push(...result.ItemsResult.Items);
        }
    }

    return allResults;
}

export async function GET() {
    try {
        const productIds = [
            'B08BK4VLC7', 'B007ZU78JO', 'B005QWBAQ0', 'B08FDN5WD5', 'B07N2T83TQ',
            'B08FDP4GHW', 'B07K6S3QKR', 'B007ZU77VS', 'B007ZU77EA', 'B00EJFDXUQ',
            'B00EJDZYYQ', 'B07K496P7Z', 'B00EJF8GEO', 'B007ZU77PE', 'B005QWB23Q',
            'B005Q7BC90', 'B005QWAI68', 'B0CP69VSW7', 'B00OKCWT30', 'B08LTW293L',
            'B08KWBQY9R', 'B08KW8KN3L', 'B07J66BVWF', 'B08DRDMTZ9', 'B0D2Y2PBJ4',
            'B00CITDGOI', 'B08LTQCVL1', 'B08KW9JWLX', 'B08LTVDK6N', 'B08W2FN211',
            'B08W264522', 'B0CK7BQQJB', 'B091273N26', 'B077B38Q86', 'B08W1PFSS2',
            'B0B152GYKK', 'B06XPMGS51', 'B0B5GWV758', 'B00CTMRUOQ', 'B08MTNYGQX',
            'B0B29HS16Q', 'B09P7XMKW6', 'B0B29MY4CY', 'B0B1F2VWX6', 'B0B52D632R',
            'B0B15KFLJW', 'B0CP6BZQ22', 'B005QWB7XQ', 'B08PMCPR4B', 'B0CPJD1WCF',
            'B098JTHMYY', 'B07L8LX6FL'
        ];

        console.log('Starting price fetch for products...');
        const data = await getProductPrices(productIds);

        // Construct final price object
        const prices: Record<string, {
            currentPrice: number;
            previousPrice: number;
            lastUpdated: string;
            title: string;
            imageUrl: string;
        }> = {};

        if (data.ItemsResult?.Items) {
            for (const item of data.ItemsResult.Items) {
                const listing = item.Offers?.Listings?.[0];
                if (listing) {
                    prices[item.ASIN] = {
                        currentPrice: listing.Price?.Amount || 0,
                        previousPrice: listing.Price?.Amount || 0, // Note: This should ideally come from DB
                        lastUpdated: new Date().toISOString(),
                        title: item.ItemInfo?.Title?.DisplayValue || '',
                        imageUrl: item.Images?.Primary?.Medium?.URL || ''
                    };
                }
            }
        }

        return NextResponse.json({ prices });
    } catch (error) {
        console.error('Error fetching prices:', error);
        return NextResponse.json(
            { error: 'Failed to fetch prices' },
            { status: 500 }
        );
    }
}