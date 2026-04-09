const puppeteer = require('puppeteer');
const Ad = require('./ads.model');

const scrapeAds = async (targetUrl) => {
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--single-process'
    ],
  });

  const page = await browser.newPage();
  let pageUrls = new Set();

  const existing = await Ad.find({});
  existing.forEach(e => pageUrls.add(e.url));

  page.on('response', async (response) => {
    const req = response.request();
    if (req.url().includes('/api/graphql/') && req.method() === 'POST') {
      try {
        const text = await response.text();
        const json = JSON.parse(text);
        const edges = json.data?.ad_library_main?.search_results_connection?.edges;

        if (edges) {
          for (const edge of edges) {
            const ad = edge.node.collated_results[0];
            const profileUrl = ad.snapshot?.page_profile_uri;

            if (profileUrl && !pageUrls.has(profileUrl)) {
              pageUrls.add(profileUrl);
              await Ad.create({ url: profileUrl });
              console.log("Saved:", profileUrl);
            }
          }
        }
      } catch (e) {}
    }
  });

  await page.goto(targetUrl, { waitUntil: 'networkidle0' });

  let scrolls = 0;
  while (pageUrls.size < 5000 && scrolls < 50) { // limit scrolls
    await page.evaluate(() => window.scrollBy(0, window.innerHeight * 2));
    await new Promise(r => setTimeout(r, 3000));
    scrolls++;
  }

  await browser.close();
  return { total: pageUrls.size };
};

// Trigger automatically every X hours (Node cron example)
const cron = require('node-cron');
cron.schedule('0 */6 * * *', async () => { // every 6 hours
  console.log('Starting background scrape...');
  await scrapeAds('https://www.facebook.com/ads/library/?q=example');
  console.log('Scrape finished.');
});
// const scrapeAds = async (targetUrl) => {
//     const browser = await puppeteer.launch({
//         headless: false,
//         args: ['--no-sandbox']
//     });

//     const page = await browser.newPage();

//     let pageUrls = new Set();

//     // Load from DB
//     const existing = await Ad.find({});
//     existing.forEach(e => pageUrls.add(e.url));

//     page.on('response', async (response) => {
//         const req = response.request();

//         if (req.url().includes('/api/graphql/') && req.method() === 'POST') {
//             try {
//                 const text = await response.text();
//                 const json = JSON.parse(text);
//                 const edges = json.data?.ad_library_main?.search_results_connection?.edges;

//                 if (edges) {
//                     for (const edge of edges) {
//                         const ad = edge.node.collated_results[0];
//                         const profileUrl = ad.snapshot?.page_profile_uri;

//                         if (profileUrl && !pageUrls.has(profileUrl)) {
//                             pageUrls.add(profileUrl);

//                             await Ad.create({ url: profileUrl });
//                             console.log("Saved:", profileUrl);
//                         }
//                     }
//                 }
//             } catch (e) {}
//         }
//     });

//     await page.goto(targetUrl, { waitUntil: 'networkidle2' });

//     while (pageUrls.size < 5000) {
//         await page.evaluate(() => window.scrollBy(0, window.innerHeight * 2));
//         await new Promise(r => setTimeout(r, 3000));
//     }

//     await browser.close();

//     return { total: pageUrls.size };
// };
const getAds = async (req, res) => {
    try {
        const ads = await Ad.find().limit(50); // limit for safety

        return ads;
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const deleteAd = async () => {
    try {
        //detelte the table
        await Ad.deleteMany({});
    } catch (err) {
        throw new Error(err.message);
    }   
};

module.exports = { scrapeAds,getAds,deleteAd };