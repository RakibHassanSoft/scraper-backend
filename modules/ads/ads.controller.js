const { scrapeAds,getAds, deleteAd } = require('./ads.service');

const startScraping = async (req, res) => {
    try {
        const { url } = req.body;

        const result = await scrapeAds(url);

        res.json({
            success: true,
            data: result
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const getAdsController = async (req, res) => {
    try {
        const ads = await getAds(); 
        res.json({
            success: true,
            count: ads.length,
            data: ads
        });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const deleteAdsController = async (req, res) => {
    try {
        await deleteAd();
        res.json({
            success: true,
            message: 'Ad deleted successfully'
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = { startScraping,getAdsController ,deleteAdsController};