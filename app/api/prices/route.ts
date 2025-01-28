import { NextResponse } from 'next/server';
import crypto from 'crypto';

const ACCESS_KEY = process.env.AMAZON_ACCESS_KEY!;
const SECRET_KEY = process.env.AMAZON_SECRET_KEY!;
const PARTNER_TAG = process.env.AMAZON_PARTNER_TAG!;

function sign(key: Buffer | Uint8Array, msg: string): Buffer {
    return crypto.createHmac('sha256', key).update(msg).digest();
}

async function getProductPrices(asins: string[]) {
    const host = 'webservices.amazon.co.uk';
    const region = 'eu-west-1';
    const service = 'ProductAdvertisingAPI';

    // Function to process a batch of ASINs
    async function processBatch(batchAsins: string[]) {
        const amzdate = new Date().toISOString().replace(/[:\-]|\.\d{3}/g, '');
        const datestamp = amzdate.slice(0, 8);

        const payload = {
            "Operation": "GetItems",
            "ItemIds": batchAsins,
            "Resources": [
                "Images.Primary.Medium",
                "ItemInfo.Title",
                "Offers.Listings.Price"
            ],
            "PartnerTag": PARTNER_TAG,
            "PartnerType": "Associates",
            "Marketplace": "www.amazon.co.uk"
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
            'x-amz-target': 'com.amazon.paapi5.v1.ProductAdvertisingAPIv1.GetItems',
            'Authorization': authorization_header
        };

        const response = await fetch(`https://${host}/paapi5/getitems`, {
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

    // Process ASINs in batches of 10
    const batchSize = 10;
    let allResults = { ItemsResult: { Items: [] } };

    for (let i = 0; i < asins.length; i += batchSize) {
        const batchAsins = asins.slice(i, i + batchSize);
        console.log(`Processing batch ${i/batchSize + 1}:`, batchAsins);
        
        try {
            const batchResult = await processBatch(batchAsins);
            if (batchResult.ItemsResult?.Items) {
                allResults.ItemsResult.Items = [
                    ...allResults.ItemsResult.Items,
                    ...batchResult.ItemsResult.Items
                ];
            }
            // Add a small delay between batches
            if (i + batchSize < asins.length) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        } catch (error) {
            console.error(`Error processing batch ${i/batchSize + 1}:`, error);
        }
    }

    return allResults;
}

export async function GET() {
    try {
        const productIds = [
            "B08BK4VLC7", // Original Crown Clean Extreme
            "B007ZU78JO", // Original Dulux Diamond Matt
            "B005QWBAQ0", // Original Johnstone's Trade
            "B08FDN5WD5", // Dulux Trade Vinyl Matt Special Value
            "B07N2T83TQ", // Dulux Trade Diamond Satinwood
            "B08FDP4GHW", // Dulux Super Matt
            "B07K6S3QKR", // Dulux Trade Quick Dry Satinwood
            "B007ZU77VS", // Dulux Trade Gloss
            "B007ZU77EA", // Dulux Trade Diamond Eggshell
            "B00EJFDXUQ", // Dulux Trade Mouldshield
            "B00EJDZYYQ", // Dulux Trade Undercoat
            "B07K496P7Z", // Dulux Trade Quick Dry Gloss
            "B00EJF8GEO", // Dulux Trade Durable Flat Matt
            "B007ZU77PE",  // Dulux Trade Vinyl Matt
            "B005QWB23Q", // Johnstone's Covaplus
            "B005Q7BC90", // Johnstone's Vinyl Matt
            "B005QWAI68", // Johnstone's Undercoat
            "B0CP69VSW7", // Johnstone's Guard Durable
            "B00OKCWT30", // Johnstone's Water-Based Satin
            "B08LTW293L", // Crown Extreme Inhibiting
            "B0D9LS2K37", // Crown Covermatt
            "B08KWBQY9R", // Crown Vinyl Matt
            "B08KW8KN3L", // Crown Gloss
            "B07J66BVWF", // Crown Fastflow Satin
            "B08DRDMTZ9", // Crown Fastflow Dual
            "B0D2Y2PBJ4", // Crown Fastflow Primer
            "B00CITDGOI", // Crown Acrylic Eggshell
            "B08LTQCVL1", // Crown All-Purpose Primer
            "B08KW9JWLX", // Crown Eggshell
            "B08LTVDK6N",  // Crown Steracryl
            "B08W2FN211", // WRX Satinwood 5L
            "B08W264522", // WRX Satinwood 2.5L
            "B0CK7BQQJB", // WRX Gloss
            "B091273N26", // Eggshell High Traffic
            "B077B38Q86", // TIKKURILA Sauna Wax
            "B08W1PFSS2", // Ceiling Paint
            "B0B152GYKK", // TIKKURILA Helmi 1L
            "B06XPMGS51", // Farrow & Ball Estate
            "B0B5GWV758", // TIKKURILA Super White
            "B00CTMRUOQ", // Farrow & Ball Modern
            "B08MTNYGQX", // TIKKURILA Presto Filler
            "B0B29HS16Q", // TIKKURILA Miranol
            "B09P7XMKW6", // TIKKURILA Supi Floor
            "B0B29MY4CY", // TIKKURILA Vinyl Matt
            "B0B1F2VWX6", // TIKKURILA Kiva Lacquer
            "B0B52D632R", // TIKKURILA Optiva Primer
            "B0B15KFLJW",  // TIKKURILA Helmi 750ml
            "B0CP6BZQ22", // Johnstone's Jonmat Premium
            "B005QWB7XQ", // Johnstone's Acrylic Eggshell
            "B08PMCPR4B", // Johnstone's Guard Brilliant
            "B0CPJD1WCF", // Johnstone's Water-Based Gloss
            "B098JTHMYY", // Johnstone's Perfect Matt
            "B07L8LX6FL"  // Johnstone's Stain Away
        ];

        console.log('Starting price fetch for products:', productIds);

        const data = await getProductPrices(productIds);
        console.log('Amazon API Response:', JSON.stringify(data, null, 2));

        const prices: Record<string, any> = {};

        if (data.ItemsResult?.Items) {
            for (const item of data.ItemsResult.Items) {
                const listing = item.Offers?.Listings?.[0];
                if (listing) {
                    prices[item.ASIN] = {
                        currentPrice: listing.Price?.Amount || 0,
                        previousPrice: listing.Price?.Amount || 0,
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