const express = require('express');
const router = express.Router();

const {
    scrapePages,
    getPages,
    deletePages
} = require('./pages.controller');

router.post('/scrape-pages', scrapePages);
router.get('/get-pages', getPages);
router.delete('/delete-pages', deletePages);

module.exports = router;