const mongoose = require('mongoose');
const { createClient } = require('redis');

//mongoDB connection
const connectionDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URL);

    console.log(`Database connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`DB Connection Error: ${error.message}`);
    process.exit(1); // crash app if DB not connected (prod best practice)
  }
};


// redis conneections
// Create a Redis client
const client = createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379"   // Default Redis URL
});
// Handle errors
client.on("error", (err) => console.error("Redis Client Error", err));
// Connect once at startup
(async () => {
  try {
    await client.connect();
    console.log("Connected to Redis!");
  } catch (error) {
    console.error("Redis Connection Error:", error.message);
  }
})();


module.exports = {connectionDB, client };

