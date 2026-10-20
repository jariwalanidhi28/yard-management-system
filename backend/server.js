const app = require('./app');
const { connectDB } = require('./config/db');

const PORT = process.env.PORT || 5000;

// Connect Database & start server
const startServer = async () => {
  await connectDB();

  const server = app.listen(PORT, () => {
    console.log(`===============================================`);
    console.log(`  Yard Management System (YMS) API Server`);
    console.log(`  Mode: ${process.env.NODE_ENV || 'development'}`);
    console.log(`  Listening on: http://localhost:${PORT}`);
    console.log(`  Health Check: http://localhost:${PORT}/api/health`);
    console.log(`===============================================`);
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (err) => {
    console.error(`[Unhandled Rejection] ${err.message}`);
    server.close(() => process.exit(1));
  });

  // Handle uncaught exceptions
  process.on('uncaughtException', (err) => {
    console.error(`[Uncaught Exception] ${err.message}`);
    process.exit(1);
  });
};

startServer();
