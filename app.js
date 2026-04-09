const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

const app = express();

// 🔐 Security headers
app.use(helmet());

// 🌍 Enable CORS (frontend can call backend)
app.use(cors({
    origin: '*', // ⚠️ change to frontend URL in production
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// 📦 Body Parser (IMPORTANT)
app.use(express.json({ limit: '10mb' }));       // JSON
app.use(express.urlencoded({ extended: true })); // form-data

// ⚡ Compression (faster response)
app.use(compression());

// 📊 Logger (see requests in console)
app.use(morgan('dev'));

// 🚫 Rate limiter (prevent abuse)
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 min
    max: 100                  // max 100 requests per IP
});
app.use(limiter);

// ================= ROUTES =================
app.use('/api/ads', require('./modules/ads/ads.routes'));
app.use('/api/pages', require('./modules/pages/pages.routes'));
app.use('/api/web', require('./modules/websites/websites.routes'));

// 🧪 Test route
app.get('/', (req, res) => {
    res.send('API Running...');
});

// ❌ 404 handler
app.use((req, res) => {
    res.status(404).json({ message: 'Route not found' });
});

// 💥 Global error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        message: 'Server Error',
        error: err.message
    });
});

module.exports = app;