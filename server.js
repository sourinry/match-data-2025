const express = require('express');
require('dotenv').config(); 
const connectionDB = require('./config/db'); // DB connection function
const matchJob = require('./jobs/matchJob'); 

const app = express();

// Middleware
app.use(express.json());

// Routes
const matchRoutes = require('./routes/matchRoute');
app.use('/api/matches', matchRoutes);

const PORT = process.env.PORT || 5000;

// Start server
const startServer = async () => {
  try {
    await connectionDB();
    // start cron / interval job
    matchJob.startJob();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Server start error:", error);
    process.exit(1);
  }
};

startServer();
