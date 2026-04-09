const express = require('express');
const router = express.Router();
const { startScraping, getAdsController, deleteAdsController } = require('./ads.controller');

router.post('/scrape', startScraping);
router.get('/all-ads', getAdsController);
router.delete('/delete-ads', deleteAdsController);

module.exports = router;