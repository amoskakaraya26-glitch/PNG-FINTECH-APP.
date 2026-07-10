import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import path from 'path';
import fs from 'fs';
import { config } from '../../config/default';
import http from 'http';
import { initSocket } from './socket';


// Route imports
import authRoutes from './routes/auth.routes';
import sevispassRoutes from './routes/sevispass.routes';
import facialRecognitionRoutes from './routes/facial-recognition.routes';
import walletRoutes from './routes/wallet.routes';
import kycRoutes from './routes/kyc.routes';
import bankRoutes from './routes/bank.routes';
import merchantRoutes from './routes/merchant.routes';
import qrRoutes from './routes/qr.routes';
import transferRoutes from './routes/transfer.routes';
import notificationRoutes from './routes/notifications.routes';
import contactRoutes from './routes/contacts.routes';
import billRoutes from './routes/bills.routes';
import scheduledRoutes from './routes/scheduled.routes';
import referralRoutes from './routes/referral.routes';
import disputeRoutes from './routes/dispute.routes';
import aiRoutes from './routes/ai.routes';
import adminRoutes from './routes/admin.routes';
import coreFeaturesRoutes from './routes/core-features.routes';
import dashboardRoutes from './routes/dashboard.routes';
import receiptRoutes from './routes/receipt.routes';
dotenv.config();

const app = express();
const PORT = process.env.PORT || config.app.port;
const isDev = process.env.NODE_ENV !== 'production';
const frontendBuildCandidates = [
  path.resolve(process.cwd(), 'src/app/build'),
  path.resolve(process.cwd(), 'dist/src/app/build'),
  path.resolve(__dirname, '../../src/app/build'),
  path.resolve(__dirname, '../../public/app'),
];
const frontendBuildPath = frontendBuildCandidates.find((candidate) =>
  fs.existsSync(path.join(candidate, 'index.html'))
);
const frontendIndexPath = frontendBuildPath ? path.join(frontendBuildPath, 'index.html') : '';
const hasFrontendBuild = Boolean(frontendBuildPath);

// Rate limiters
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20, // 20 login attempts per 15 min
  message: { error: 'Too many login attempts, please try again in 15 minutes.' },
});

// Security & parsing middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin: process.env.FRONTEND_URL || (isDev ? '*' : 'http://localhost:3001'),
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(globalLimiter);

// Request logger (dev only)
if (isDev) {
  app.use((req, _res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
  });
}

// Health checks
app.get('/health', (_req, res) => res.json({ status: 'OK', timestamp: new Date().toISOString() }));

if (!isDev && hasFrontendBuild && frontendBuildPath) {
  app.use(express.static(frontendBuildPath));
}

// API Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/auth', sevispassRoutes);
app.use('/api/auth', facialRecognitionRoutes); // Facial recognition biometric login
app.use('/api/wallet', walletRoutes);
app.use('/api/kyc', kycRoutes);
app.use('/api/bank', bankRoutes);
app.use('/api/merchant', merchantRoutes);
app.use('/api/qr', qrRoutes);
app.use('/api/transfers', transferRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/bills', billRoutes);
app.use('/api/scheduled', scheduledRoutes);
app.use('/api/referrals', referralRoutes);
app.use('/api/disputes', disputeRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin', dashboardRoutes); // Admin dashboard
app.use('/api', coreFeaturesRoutes); // Core features: transactions, 2FA, compliance, notifications
app.use('/api/receipt', receiptRoutes);

if (!isDev && hasFrontendBuild) {
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path === '/health') {
      next();
      return;
    }

    res.sendFile(frontendIndexPath);
  });
} else {
  app.get('/', (_req, res) => res.json({ message: 'PNG Fintech E-Wallet API v2.0', status: 'running', env: process.env.NODE_ENV }));
}

// 404 handler
app.use((_req, res) => res.status(404).json({ error: 'Route not found' }));

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = status < 500 ? err.message : 'Internal server error';
  if (status >= 500) console.error(`[ERROR] ${req.method} ${req.path}:`, err.stack);
  res.status(status).json({ error: message });
});

export { app };

if (require.main === module) {


  const server =
    http.createServer(app);



  initSocket(server);




  server.listen(
    PORT,
    () => {


      console.log(
        `✅ PNG Fintech API running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`
      );


    }
  );


}
