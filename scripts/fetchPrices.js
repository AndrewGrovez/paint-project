// ---- 1. Load environment variables from process.env ----
const { AMAZON_ACCESS_KEY, AMAZON_SECRET_KEY, AMAZON_PARTNER_TAG } = process.env;
const { SUPABASE_URL, SUPABASE_SERVICE_KEY } = process.env;

// ---- 2. Import required libraries ----
import fetch from 'node-fetch';
import crypto from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

// ---- 3. Create Supabase client ----
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// ---- 4. Define your product ASINs ----
const productIds = [
    'B08BK4VLC7',
    'B007ZU78JO',
    'B005QWBAQ0',
    'B08FDN5WD5',
    'B07N2T83TQ',
    'B08FDP4GHW',
    'B07K6S3QKR',
    'B007ZU77VS',
    'B007ZU77EA',
    'B00EJFDXUQ',
    'B00EJDZYYQ',
    'B07K496P7Z',
    'B00EJF8GEO',
    'B007ZU77PE',
    'B005QWB23Q',
    'B005Q7BC90',
    'B005QWAI68',
    'B0CP69VSW7',
    'B00OKCWT30',
    'B08LTW293L',
    'B08LTRLF6F',
    'B08KWBQY9R',
    'B08KW8KN3L',
    'B07J66BVWF',
    'B08DRDMTZ9',
    'B0D2Y2PBJ4',
    'B00CITDGOI',
    'B08LTQCVL1',
    'B08KW9JWLX',
    'B08LTVDK6N',
    'B08W2FN211',
    'B08W264522',
    'B0CK7BQQJB',
    'B091273N26',
    'B077B38Q86',
    'B08W1PFSS2',
    'B0B152GYKK',
    'B06XPMGS51',
    'B0B5GWV758',
    'B00CTMRUOQ',
    'B08MTNYGQX',
    'B0B29HS16Q',
    'B09P7XMKW6',
    'B0B29MY4CY',
    'B0B1F2VWX6',
    'B0B52D632R',
    'B0B15KFLJW',
    'B0CP6BZQ22',
    'B005QWB7XQ',
    'B08PMCPR4B',
    'B0CPJD1WCF',
    'B098JTHMYY',
    'B07L8LX6FL'
];

// ---- 5. Utility for signing Amazon requests (same logic as your Next.js route) ----
function sign(key, msg) {
  return crypto.createHmac('sha256', key).update(msg).digest();
}

// ---- 6. processBatch: fetch 10 items from Amazon's PA-API ----
async function processBatch(batchAsins) {
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
    PartnerTag: AMAZON_PARTNER_TAG,
    PartnerType: 'Associates',
    Marketplace: 'www.amazon.co.uk'
  };

  const payloadString = JSON.stringify(payload);
  const payloadHash = crypto.createHash('sha256').update(payloadString).digest('hex');

  const canonicalHeaders =
    'content-encoding:amz-1.0\n' +
    'content-type:application/json; charset=utf-8\n' +
    `host:${host}\n` +
    `x-amz-date:${amzdate}\n` +
    'x-amz-target:com.amazon.paapi5.v1.ProductAdvertisingAPIv1.GetItems\n';

  const signedHeaders = 'content-encoding;content-type;host;x-amz-date;x-amz-target';

  const canonicalRequest = [
    'POST',
    '/paapi5/getitems',
    '',
    canonicalHeaders,
    signedHeaders,
    payloadHash
  ].join('\n');

  const algorithm = 'AWS4-HMAC-SHA256';
  const credentialScope = `${datestamp}/${region}/${service}/aws4_request`;
  const stringToSign = [
    algorithm,
    amzdate,
    credentialScope,
    crypto.createHash('sha256').update(canonicalRequest).digest('hex')
  ].join('\n');

  let k = Buffer.from(`AWS4${AMAZON_SECRET_KEY}`, 'utf-8');
  k = sign(k, datestamp);
  k = sign(k, region);
  k = sign(k, service);
  k = sign(k, 'aws4_request');
  const signature = sign(k, stringToSign).toString('hex');

  const authorizationHeader = [
    `${algorithm} Credential=${AMAZON_ACCESS_KEY}/${credentialScope}`,
    `SignedHeaders=${signedHeaders}`,
    `Signature=${signature}`
  ].join(', ');

  const headers = {
    'content-encoding': 'amz-1.0',
    'content-type': 'application/json; charset=utf-8',
    host,
    'x-amz-date': amzdate,
    'x-amz-target': 'com.amazon.paapi5.v1.ProductAdvertisingAPIv1.GetItems',
    Authorization: authorizationHeader
  };

  const response = await fetch(`https://${host}/paapi5/getitems`, {
    method: 'POST',
    headers,
    body: payloadString
  });

  if (!response.ok) {
    const responseText = await response.text();
    throw new Error(
      `Amazon API error for batch [${batchAsins.join(', ')}]: ${response.status} ${response.statusText}\n` +
      `Details: ${responseText}`
    );
  }

  return response.json();
}

// ---- 7. getProductPrices: handle concurrency-limited batching of all ASINs ----
async function getProductPrices(asins) {
  const batchSize = 10;
  const concurrency = 3; // # of batches in parallel

  // Break up ASINs into groups of 10
  const batches = [];
  for (let i = 0; i < asins.length; i += batchSize) {
    batches.push(asins.slice(i, i + batchSize));
  }

  const allResults = {
    ItemsResult: { Items: [] }
  };

  // Process the batch array in slices of `concurrency`
  for (let i = 0; i < batches.length; i += concurrency) {
    const batchSlice = batches.slice(i, i + concurrency);
    // Each slice is processed in parallel
    const results = await Promise.all(batchSlice.map((b) => processBatch(b)));
    // Merge results
    for (const r of results) {
      if (r.ItemsResult?.Items) {
        allResults.ItemsResult.Items.push(...r.ItemsResult.Items);
      }
    }
  }

  return allResults;
}

// ---- 8. Update Supabase with the prices ----
async function updatePrices(prices) {
  for (const [productId, priceData] of Object.entries(prices)) {
    const { currentPrice, title, imageUrl } = priceData;

    // 8a. Fetch last price
    const { data: lastPriceRecord, error: selectError } = await supabase
      .from('price_history')
      .select('price')
      .eq('product_id', productId)
      .order('captured_at', { ascending: false })
      .limit(1)
      .single();

    if (selectError) {
      console.error(`Could not select last price for ${productId}:`, selectError);
      continue;
    }
    const lastPrice = lastPriceRecord?.price;

    // 8b. Insert new history record
    const { error: insertError } = await supabase.from('price_history').insert({
      product_id: productId,
      price: currentPrice,
      title,
      image_url: imageUrl
    });
    if (insertError) {
      console.error(`Could not insert history for ${productId}:`, insertError);
      continue;
    }

    // 8c. Update product record
    const { error: updateError } = await supabase
      .from('products')
      .update({
        current_price: currentPrice,
        last_price: lastPrice ?? currentPrice,
        last_updated: new Date().toISOString()
      })
      .eq('id', productId);

    if (updateError) {
      console.error(`Could not update product for ${productId}:`, updateError);
      continue;
    }
  }
}

// ---- 9. Main function: fetch from Amazon, then store in Supabase ----
async function main() {
  console.log('Starting daily price fetch...');

  // 9a. Fetch from Amazon
  const data = await getProductPrices(productIds);

  // 9b. Build the `prices` object
  const prices = {};
  if (data.ItemsResult?.Items) {
    for (const item of data.ItemsResult.Items) {
      const listing = item.Offers?.Listings?.[0];
      if (listing) {
        prices[item.ASIN] = {
          currentPrice: listing.Price?.Amount || 0,
          title: item.ItemInfo?.Title?.DisplayValue || '',
          imageUrl: item.Images?.Primary?.Medium?.URL || ''
        };
      }
    }
  }

  console.log(`Got ${Object.keys(prices).length} product prices from Amazon.`);

  // 9c. Update Supabase
  await updatePrices(prices);

  console.log('Successfully updated prices in Supabase.');
}

// ---- 10. Execute main, catch errors ----
main().catch((err) => {
  console.error('Error in daily price script:', err);
  process.exit(1);
});