const express = require('express');
const authMiddleware = require('./middleware/authMiddleware');
require('dotenv').config(); 
const {connectionDB, client} = require('./config/db'); // DB connection function
const matchJob = require('./jobs/matchJob'); 
const cors = require('cors');
const cookieParser = require('cookie-parser');

const app = express();

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(cors({
   origin: ['http://localhost:4200', 'http://localhost:8080'],
   credentials: true  
}));


//user Routes
const userRoutes = require('./routes/authRoute');
app.use('/api/user', userRoutes);
//match Routes
const matchRoutes = require('./routes/matchRoute');
app.use('/api/matches', authMiddleware,matchRoutes);
//website whitelisting APIs
const websiteRoutes = require('./routes/websiteRoute');
app.use('/api/website', authMiddleware,websiteRoutes);



// //test redis
// app.get("/api/test-redis", async (req, res) => {
//   try {
//     await client.set("testKey", "Hello Redis!");
//     const value = await client.get("testKey");
//     res.json({ message: "Redis is working", value });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });


//PORT from env
const PORT = process.env.PORT || 5000;

// Start server
const startServer = async () => {
  try {
    //connection mongoDB
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


//to handel exit\shutdown
process.on("SIGINT", async () => {
  await client.quit();
  console.log("Redis disconnected");
  process.exit(0);
});


startServer();
