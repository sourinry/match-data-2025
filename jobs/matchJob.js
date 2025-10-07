/*
const { syncMatches } = require('../services/matchService');

const startJob = () => {
    setInterval(syncMatches, 10 * 60 * 1000);
    // setInterval(syncMatches, 10 * 1000);
    
    // Run once on startup
    syncMatches();
};

module.exports = { startJob };
*/

const { syncMatches } = require('../services/matchService');

const startJob = () => {
  // Run once immediately on startup
  (async () => {
    try {
      console.log(`[${new Date().toISOString()}] Initial match sync started...`);
      await syncMatches();
      console.log(`[${new Date().toISOString()}] Initial match sync completed.`);
    } catch (err) {
      console.error(`[${new Date().toISOString()}] Initial sync failed:`, err.message);
    }
  })();

  // Set interval to run every 10 minutes safely
  setInterval(async () => {
    try {
      console.log(`[${new Date().toISOString()}] Scheduled match sync started...`);
      await syncMatches();
      console.log(`[${new Date().toISOString()}] Scheduled match sync completed.`);
    } catch (err) {
      console.error(`[${new Date().toISOString()}] Scheduled sync failed:`, err.message);
    }
  }, 10 * 60 * 1000); // 10 minutes
};

module.exports = { startJob };