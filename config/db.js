const mongoose = require('mongoose');
const connectionDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URL);

    console.log(`Database connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`DB Connection Error: ${error.message}`);
    process.exit(1); // crash app if DB not connected (prod best practice)
  }
};

module.exports = connectionDB;
