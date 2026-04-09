const { scrapeAndStore, getAllWebsites, deleteAllWebsites } = require('./websites.service');

const scrapeSites = async (req, res) => {
  const { urls } = req.body;
  if (!urls || !Array.isArray(urls)) return res.status(400).json({ message: "URLs required" });

  scrapeAndStore(urls); // run in background
  res.json({ message: "Scraping started..." });
};

const getSites = async (req, res) => {
   
  const data = await getAllWebsites();
  res.json(data);
};

const deleteSites = async (req, res) => {
  await deleteAllWebsites();
  res.json({ message: "All websites deleted" });
};

module.exports = { scrapeSites, getSites, deleteSites };