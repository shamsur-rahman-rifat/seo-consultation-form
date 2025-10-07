// Basic Library Imports
import dotenv from 'dotenv';
import express, { json, urlencoded } from 'express';
import rateLimit from 'express-rate-limit';
// import helmet from 'helmet';
import cors from 'cors';
import hpp from 'hpp';
import { resolve } from 'path';
import router from './src/route/api.js';

dotenv.config();
const app = new express();
const __dirname = resolve();

// Middleware

// Open CORS Policy - Allow any origin
app.use(cors({
  origin: '*',  // Allow all domains
  methods: ['GET', 'POST'],  // Allow only necessary methods (GET, POST for form submission)
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(hpp());
app.use(json({ limit: "20MB" }));
app.use(urlencoded({ extended: true }));

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 3000 });
app.use(limiter);

// app.use(
//   helmet({
//     contentSecurityPolicy: {
//       useDefaults: true,
//       directives: {
//         ...helmet.contentSecurityPolicy.getDefaultDirectives(),
//         "script-src": ["'self'", "https://assets.calendly.com"],
//         "frame-src": ["'self'", "https://calendly.com", "https://assets.calendly.com"], // Calendly or other services
//         "style-src": ["'self'", "'unsafe-inline'", "https://assets.calendly.com"],
//         // Allow embedding from your own origin plus ANY HTTP or HTTPS domain
//         "frame-ancestors": ["'self'", "http:", "https:"],
//       },
//     },
//     // Disable frameguard so it doesn't send X-Frame-Options header that blocks iframe embedding
//     frameguard: false,
//   })
// );


app.use('/api/sendPartialFormData', express.text({ type: '*/*' }), (req, res, next) => {
  if (typeof req.body === 'string') {
    try {
      req.body = JSON.parse(req.body);
    } catch (e) {
      console.error('Failed to parse JSON:', e);
    }
  }
  next();
});

app.use('/api', router);


// Serve static files from the React app
app.use(express.static(resolve(__dirname, 'client', 'dist')));

// Serve React front end for all routes not handled by the API
app.get(/(.*)/, (req, res, next) => {
  if (req.path.startsWith('/api')) {
    // If route starts with /api but no handler matched, pass to next middleware (404)
    return next();
  }
  // Otherwise serve React app
  res.sendFile(resolve(__dirname, 'client', 'dist', 'index.html'));
});

export default app;