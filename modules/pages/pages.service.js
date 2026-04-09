const puppeteer = require('puppeteer');
const Page = require('./pages.model');

// 🔥 SCRAPE + STORE
async function scrapeAndStore(urls) {
    const browser = await puppeteer.launch({
        headless: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    for (const fbUrl of urls) {
        const aboutUrl = fbUrl.replace(/\/$/, "") + "/about_contact_and_basic_info";
        console.log("Scraping:", aboutUrl);

        try {
            await page.goto(aboutUrl, { waitUntil: 'networkidle2', timeout: 60000 });
            await new Promise(r => setTimeout(r, 3000));

            const data = await page.evaluate(() => {
                const results = { website: [], socialMedia: [], emails: [], phones: [], whatsapp: [] };
                const links = Array.from(document.querySelectorAll('a'));

                links.forEach(link => {
                    const href = link.href || '';

                    // External websites
                    if (href.includes('l.facebook.com/l.php?u=')) {
                        const params = new URLSearchParams(href.split('?')[1]);
                        const realUrl = params.get('u');
                        if (realUrl && !realUrl.includes('facebook.com')) {
                            const clean = realUrl.split('?')[0].toLowerCase();
                            if (clean.includes('.com')) results.website.push(clean);
                            else results.socialMedia.push(clean);
                        }
                    }

                    // WhatsApp links
                    if (href.includes('wa.me') || href.includes('api.whatsapp.com')) {
                        const match = href.match(/(?:\/|phone=)(\d+)/);
                        if (match) results.whatsapp.push(match[1]);
                    }

                    // Phone numbers
                    if (href.startsWith('tel:')) results.phones.push(href.replace('tel:', '').trim());

                    // Emails
                    if (href.startsWith('mailto:')) results.emails.push(href.replace('mailto:', '').split('?')[0].trim());
                });

                const text = document.body.innerText;
                const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
                const phoneRegex = /(\+8801|01)[3-9]\d{8}/g;

                results.emails.push(...(text.match(emailRegex) || []));
                results.phones.push(...(text.match(phoneRegex) || []));

                const clean = arr => [...new Set(arr.filter(Boolean))];

                return {
                    website: clean(results.website),
                    socialMedia: clean(results.socialMedia),
                    emails: clean(results.emails),
                    phones: clean(results.phones),
                    whatsapp: clean(results.whatsapp)
                };
            });

            const finalData = { facebookUrl: fbUrl, ...data };

            // Save/update in DB
            await Page.updateOne(
                { facebookUrl: fbUrl },
                finalData,
                { upsert: true }
            );

            console.log("Saved:", fbUrl);

            await new Promise(r => setTimeout(r, 3000)); // optional delay between pages
        } catch (err) {
            console.log("Error scraping:", fbUrl, err.message);
        }
    }

    await browser.close();
}


// 📥 GET ALL
async function getAllPages() {
    return await Page.find().sort({ createdAt: -1 });
}

// 🗑 DELETE ALL
async function deleteAllPages() {
    await Page.deleteMany({});
}

module.exports = {
    scrapeAndStore,
    getAllPages,
    deleteAllPages
};