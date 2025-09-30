const { syncMatches } = require('../services/matchService');

const startJob = () => {
    //setInterval(syncMatches, 10 * 60 * 1000);
    setInterval(syncMatches, 10 * 1000);

  // Run once on startup
  syncMatches();
};

module.exports = { startJob };
