const puppeteer = require("puppeteer");
const Website = require("./websites.model");

// ================== 🔴 BLOCKED DOMAINS ==================
const BLOCKED_DOMAINS = [
  "amazon.com",
  "tiktok.com",
  "facebook.com",
  "twitter.com",
  "linkedin.com",
  "instagram.com",
  "youtube.com",
  "pinterest.com",
  "spotify.com",
  "soundcloud.com",
  "medium.com",
  "wattpad.com",
  "scribd.com",
  "play.google.com",
  "apps.apple.com",
  "checkout",
  "login",
  "signup",
  "account",
  "auth",
];

// ================== CONFIG ==================
const MAX_WAIT = 8000;

const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Safari/605.1.15",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/121 Safari/537.36",
];

// ================== UTILS ==================
const sleep = (min = 1000, max = 4000) =>
  new Promise((r) =>
    setTimeout(r, Math.floor(Math.random() * (max - min)) + min)
  );

// ================== BLOCK CHECK ==================
function isBlocked(url) {
  try {
    const parsed = new URL(url.startsWith("http") ? url : `https://${url}`);
    const host = parsed.hostname.toLowerCase();

    return BLOCKED_DOMAINS.some((d) => host.includes(d));
  } catch {
    return true;
  }
}

// ================== CLEAN URL ==================
function cleanUrl(rawUrl) {
  try {
    const url = new URL(rawUrl.startsWith("http") ? rawUrl : `https://${rawUrl}`);

    if (url.search || url.hash) return null;

    const path = url.pathname.replace(/\/$/, "");

    const segments = path.split("/").filter(Boolean);
    if (segments.length > 1) return null;

    return `${url.protocol}//${url.hostname}${path}`;
  } catch {
    return null;
  }
}

// ================== HUMAN BEHAVIOR ==================
async function humanBehavior(page) {
  try {
    const vp = page.viewport();

    if (vp) {
      for (let i = 0; i < 5; i++) {
        await page.mouse.move(
          Math.random() * vp.width,
          Math.random() * vp.height,
          { steps: 10 + Math.floor(Math.random() * 20) }
        );
        await sleep(200, 800);
      }
    }

    await page.evaluate(() => {
      window.scrollTo({
        top: document.body.scrollHeight * Math.random(),
        behavior: "smooth",
      });
    });

    await sleep(1500, 3000);
  } catch {
    // ignore
  }
}

// ================== BLOCK RESOURCES ==================
async function blockResources(page) {
  await page.setRequestInterception(true);

  page.on("request", (req) => {
    const type = req.resourceType();
    if (["image", "stylesheet", "font", "media"].includes(type)) {
      req.abort();
    } else {
      req.continue();
    }
  });
}

// ================== EXTRACTION ==================
async function extractData(page) {
  return await page.evaluate(() => {
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

    const phoneRegex =
      /(\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3}[-.\s]?\d{3,4}/g;

    const text = document.body?.innerText || "";

    const emails = text.match(emailRegex) || [];
    const phones = text.match(phoneRegex) || [];

    const mailto = [...document.querySelectorAll("a[href^='mailto:']")]
      .map((a) => a.href.replace("mailto:", ""));

    const whatsapp = [...document.querySelectorAll("a")]
      .map((a) => a.href)
      .filter(
        (h) =>
          h &&
          (h.includes("wa.me") ||
            h.includes("whatsapp.com") ||
            h.includes("api.whatsapp"))
      );

    const clean = (arr) =>
      [...new Set(arr.map((x) => x.trim()).filter(Boolean))];

    return {
      emails: clean([...emails, ...mailto]),
      phones: clean(phones),
      whatsapp: clean(whatsapp),
    };
  });
}

// ================== RETRY ==================
async function retry(fn, times = 3) {
  try {
    return await fn();
  } catch (err) {
    if (times <= 0) throw err;
    await sleep(2000, 5000);
    return retry(fn, times - 1);
  }
}

// ================== MAIN SCRAPER ==================
async function scrapeAndStore(urls = []) {
  const browser = await puppeteer.launch({
    headless: "new",
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
    ],
  });

  const page = await browser.newPage();

  await page.setViewport({ width: 1280, height: 800 });

  await page.setUserAgent(
    USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)]
  );

  await blockResources(page);

  const visited = new Set();

  for (const raw of urls) {
    if (isBlocked(raw)) continue;

    const url = cleanUrl(raw);
    if (!url || visited.has(url)) continue;

    visited.add(url);

    console.log("🌐 Visiting:", url);

    try {
      await retry(() =>
        page.goto(url, {
          waitUntil: "domcontentloaded",
          timeout: MAX_WAIT,
        })
      );

      await sleep(1000, 3000);

      await humanBehavior(page);

      const data = await extractData(page);

      if (!data.emails.length && !data.phones.length && !data.whatsapp.length) {
        console.log("⚠️ No data found:", url);
      }

      await Website.updateOne(
        { site: url },
        {
          site: url,
          emails: data.emails,
          phones: data.phones,
          whatsapp: data.whatsapp,
        },
        { upsert: true }
      );

      console.log("✅ Saved:", url);
    } catch (err) {
      console.log("❌ Failed:", url, err.message);
    }
  }

  await browser.close();
}

// ================== DB ==================
async function getAllWebsites() {
  return Website.find().sort({ createdAt: -1 });
}

async function deleteAllWebsites() {
  return Website.deleteMany({});
}

module.exports = {
  scrapeAndStore,
  getAllWebsites,
  deleteAllWebsites,
};