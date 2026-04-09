const express = require('express');
const router = express.Router();
const { scrapeSites, getSites, deleteSites } = require('./websites.controller');

router.post('/scrape-web', scrapeSites);
router.get('/get-websites', getSites);
router.delete('/delete-all-websites', deleteSites);

module.exports = router;