const express = require('express');
require('dotenv').config(); 
const {connectionDB, client} = require('./config/db'); // DB connection function
const matchJob = require('./jobs/matchJob'); 
const cors = require('cors');

const app = express();

// Middleware
app.use(express.json());
app.use(cors({
   origin: ['http://localhost:4200', 'http://localhost:8080']
}))

//match Routes
const matchRoutes = require('./routes/matchRoute');
app.use('/api/matches', matchRoutes);
//website whitelisting APIs
const websiteRoutes = require('./routes/websiteRoute');
app.use('/api/website', websiteRoutes);



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
