import { app } from './app';
import dns from 'dns';

// Force Node.js to use Google and Cloudflare DNS to bypass local SRV blocks
dns.setServers(['8.8.8.8', '1.1.1.1']);

import { env } from './config/env';
import { connectDB } from './db';
import { seedDemoBuyers } from './modules/buyers/seedBuyers';
import { seedDemoFpos } from './modules/fpos/seedFpos';
import { startPriceAlertWorker } from './modules/notifications/priceAlert.worker';

const PORT = process.env.PORT || env.PORT || 5000;

const startServer = async () => {
  try {
    // Environment variables verification without exposing secrets (Correction 8)
    const requiredVars = ['MONGODB_URI', 'DATA_GOV_API_KEY', 'JWT_ACCESS_SECRET'];
    const missingVars = requiredVars.filter((v) => !process.env[v] && !(env as any)[v]);
    if (missingVars.length > 0) {
      console.error(`❌ Critical Error: Missing required environment variables: ${missingVars.join(', ')}`);
      process.exit(1);
    }

    // 1. Connect to MongoDB Atlas
    await connectDB();
    await seedDemoBuyers();
    await seedDemoFpos();

    // 2. Start Automated Background Price Alert Worker (5 min frequency)
    startPriceAlertWorker(300000);

    // 3. Start the Express server
    app.listen(PORT, () => {
      console.log(`🚀 PRISMS Server is running in ${env.NODE_ENV} mode on port ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
