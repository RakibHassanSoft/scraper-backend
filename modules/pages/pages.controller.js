const { scrapeAndStore, getAllPages, deleteAllPages } = require('./pages.service');

// 🔥 SCRAPE API
const scrapePages = async (req, res) => {
    const { urls } = req.body;

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
        return res.status(400).json({ message: "URLs array required" });
    }

    // Run scraping in background
    scrapeAndStore(urls);

    res.json({ message: "Scraping started...", totalUrls: urls.length });
};

// 📥 GET
const getPages = async (req, res) => {
    const data = await getAllPages();
    res.json(data);
};

// 🗑 DELETE
const deletePages = async (req, res) => {
    await deleteAllPages();
    res.json({ message: "All pages deleted" });
};

module.exports = {
    scrapePages,
    getPages,
    deletePages
};