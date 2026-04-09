const puppeteer = require('puppeteer');
const Website = require('./websites.model');

// 🔹 Random delay
function randomDelay(min = 2000, max = 6000) {
  return new Promise(r => setTimeout(r, Math.random() * (max - min) + min));
}

// 🔹 Extract info from page
async function extractInfo(page) {
  return await page.evaluate(() => {
    const results = { emails: [], phones: [], whatsapp: [] };
    const text = document.body.innerText.replace(/\n/g, ' ').replace(/\s+/g, ' ');

    const emailRegex = /\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-z]{2,}\b/gi;
    const phoneRegex = /(\+8801\d{9}|8801\d{9}|01\d{9})/g;

    results.emails = text.match(emailRegex) || [];
    results.phones = text.match(phoneRegex) || [];

    const links = Array.from(document.querySelectorAll('a'));
    links.forEach(l => {
      const href = decodeURIComponent(l.href);

      if (href.startsWith('mailto:')) results.emails.push(href.replace('mailto:', '').split('?')[0]);
      if (href.startsWith('tel:')) results.phones.push(href.replace('tel:', ''));
      if (href.includes('wa.me') || href.includes('whatsapp')) {
        const num = href.match(/\d{8,15}/);
        if (num) results.whatsapp.push(num[0]);
      }
    });

    const normalizePhone = (num) => {
      let cleaned = num.replace(/\s+/g, '').replace(/-/g, '').replace(/[^\d+]/g, '');
      if (cleaned.startsWith('01')) cleaned = '+88' + cleaned;
      else if (cleaned.startsWith('8801')) cleaned = '+' + cleaned;
      return cleaned;
    };

    const cleanPhones = arr => [...new Set(arr.map(normalizePhone).filter(num => /^(\+8801\d{9})$/.test(num)))];
    const cleanEmails = arr => [...new Set(arr.map(e => e.toLowerCase().trim()))];

    return {
      emails: cleanEmails(results.emails),
      phones: cleanPhones(results.phones),
      whatsapp: cleanPhones(results.whatsapp)
    };
  });
}

// 🔹 Scrape + store in DB
async function scrapeAndStore(urls) {
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();

  for (const url of urls) {
    console.log('Visiting:', url);
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
      await randomDelay();

      const data = await extractInfo(page);

      await Website.updateOne(
        { site: url },
        { site: url, ...data },
        { upsert: true }
      );

      console.log(`Saved: ${url} | Emails: ${data.emails.length} | Phones: ${data.phones.length}`);
      await randomDelay(5000, 12000);
    } catch (err) {
      console.log('Error scraping', url, err.message);
    }
  }

  await browser.close();
}

// 🔹 Get all
async function getAllWebsites() {
  return await Website.find().sort({ createdAt: -1 });
}

// 🔹 Delete all
async function deleteAllWebsites() {
  await Website.deleteMany({});
}

module.exports = {
  scrapeAndStore,
  getAllWebsites,
  deleteAllWebsites
};