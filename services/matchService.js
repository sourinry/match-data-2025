/*
const fetchApiData = require('../utils/fetchApiData');
const Match = require('../models/match');

const syncMatches = async () => {
  try {
    console.log("Fetching matches from API...");

    // Step 1: API call
    const result = await fetchApiData({
      url: "https://scoreapi.365cric.com/api/match/getAllMatches",
      method: "post"
    });

    if (!result || !result.matches) {
      console.error("Invalid API response:", result);
      return;
    }

    const matches = result.matches;
    const eventIds = matches.map(m => m.eventId);

// Step 2: DB me check karna kaunse eventIds exist karte hain
  const eventIdsExists = await Match.find(
  { eventId: { $in: eventIds } },
  { eventId: 1, _id: 0 } // sirf eventId hi chahiye
);

// Step 3: Unique eventIds ko Set me store karna
    const eventIdsSet = new Set(eventIdsExists.map(m => m.eventId));
    console.log(`Total matches received: ${matches.length}`);

    if (matches.length === 0) return;

    // Step 2: Chunk matches to avoid huge bulkWrite (10k+ safe)
    const chunkSize = 1000; 
    for (let i = 0; i < matches.length; i += chunkSize) {
      const chunk = matches.slice(i, i + chunkSize);

      // Step 3: Prepare bulk operations
      const operations = chunk.filter(match => !eventIdsSet.has(match.eventId)).map(match => ({
        updateOne: {
          filter: { eventId: match.eventId, marketId: match.marketId },
          update: { $set: match },
          upsert: true
        }
      }));

      // Step 4: Execute bulk write
      await Match.bulkWrite(operations);
      console.log(`Saved chunk ${i / chunkSize + 1} / ${Math.ceil(matches.length / chunkSize)}`);
    }

    // await Match.deleteMany({ eventId: { $in: eventIds } });

    console.log("All matches saved successfully!");
  } catch (err) {
    console.error("Error in syncMatches:", err.message);
  }
};

module.exports = { syncMatches };
*/


/*
const fetchApiData = require('../utils/fetchApiData');
const Match = require('../models/match');

const syncMatches = async () => {
  try {
    console.log("Fetching matches from API...");

    // Step 1: API call
    const result = await fetchApiData({
      url: "https://scoreapi.365cric.com/api/match/getAllMatches",
      method: "post"
    });

    if (!result || !result.matches) {
      console.error("Invalid API response:", result);
      return;
    }

    const matches = result.matches;
    console.log(`Total matches received: ${matches.length}`);
    if (matches.length === 0) return;

    // Step 2: Chunk matches to avoid huge bulkWrite (10k+ safe)
    const chunkSize = 1000; 
    for (let i = 0; i < matches.length; i += chunkSize) {
      const chunk = matches.slice(i, i + chunkSize);

      // Step 3: Prepare bulk operations (no need to pre-check)
      const operations = chunk.map(match => ({
        updateOne: {
          filter: { eventId: match.eventId, marketId: match.marketId },
          update: { $set: match },
          upsert: true
        }
      }));

      if (operations.length > 0) {
        await Match.bulkWrite(operations, { ordered: false });
        console.log(`Saved chunk ${i / chunkSize + 1} / ${Math.ceil(matches.length / chunkSize)}`);
      }
    }

    console.log("All matches saved successfully!");
  } catch (err) {
    console.error("Error in syncMatches:", err.message);
  }
};

module.exports = { syncMatches };
*/


/*
const fetchApiData = require('../utils/fetchApiData');
const Match = require('../models/match');

const syncMatches = async () => {
  try {
    console.log("Fetching matches from API...");

    // Step 1: API call
    const result = await fetchApiData({
      url: "https://scoreapi.365cric.com/api/match/getAllMatches",
      method: "post"
    });

    // Step 2: Handle API error response
    if (result.success === false) {
      console.error("API request failed:", result.message);
      return;
    }

    if (!result || !result.matches) {
      console.error("Invalid API structure:", result);
      return;
    }

    const matches = result.matches;
    console.log(`Total matches received: ${matches.length}`);

    if (matches.length === 0) return;

    // Step 3: Chunk matches to avoid huge bulkWrite
    const chunkSize = 1000;
    for (let i = 0; i < matches.length; i += chunkSize) {
      const chunk = matches.slice(i, i + chunkSize);

      // Step 4: Prepare bulk operations
      const operations = chunk.map(match => ({
        updateOne: {
          filter: { eventId: match.eventId, marketId: match.marketId },
          update: { $set: match },
          upsert: true
        }
      }));

      // Step 5: Execute bulkWrite safely
      if (operations.length > 0) {
        try {
          await Match.bulkWrite(operations, { ordered: false });
          console.log(
            `Saved chunk ${Math.floor(i / chunkSize) + 1} / ${Math.ceil(matches.length / chunkSize)}`
          );
        } catch (err) {
          if (err.code === 11000) {
            console.warn("Duplicate key error ignored in bulkWrite.");
          } else {
            console.error("BulkWrite error:", err.message);
          }
        }
      }
    }

    console.log("All matches saved successfully!");
  } catch (err) {
    console.error("Error in syncMatches:", err.message);
  }
};

module.exports = { syncMatches };
*/

/*
const fetchApiData = require('../utils/fetchApiData');
const Match = require('../models/match');

const syncMatches = async () => {
  try {
    console.log("Fetching matches from API...");

    // Step 1: API call
    const result = await fetchApiData({
      url: "https://scoreapi.365cric.com/api/match/getAllMatches",
      method: "post"
    });

    // Step 2: Handle API error response
    if (result.success === false) {
      console.error("API request failed:", result.message);
      return;
    }

    if (!result || !result.matches) {
      console.error("Invalid API structure:", result);
      return;
    }

    const matches = result.matches;
    console.log(`Total matches received: ${matches.length}`);

    if (matches.length === 0) return;

    // Step 3: Set lastSyncedAt timestamp
    const now = new Date();
    const chunkSize = 1000;

    // Step 4: Process matches in chunks
    for (let i = 0; i < matches.length; i += chunkSize) {
      const chunk = matches.slice(i, i + chunkSize);

      const operations = chunk.map(match => {
        // Remove _id from API to avoid MongoDB immutable field error
        const { _id, ...matchData } = match;

        // Add lastSyncedAt to each document
        matchData.lastSyncedAt = now;

        return {
          updateOne: {
            filter: { eventId: match.eventId, marketId: match.marketId },
            update: { $set: matchData },
            upsert: true
          }
        };
      });

      // Execute bulkWrite safely
      if (operations.length > 0) {
        try {
          await Match.bulkWrite(operations, { ordered: false });
          console.log(
            `Saved chunk ${Math.floor(i / chunkSize) + 1} / ${Math.ceil(matches.length / chunkSize)}`
          );
        } catch (err) {
          if (err.code === 11000) {
            console.warn("Duplicate key error ignored in bulkWrite.");
          } else {
            console.error("BulkWrite error:", err.message);
          }
        }
      }
    }

    // Step 5: Delete stale matches not updated in this sync
    const deleted = await Match.deleteMany({ lastSyncedAt: { $lt: now } });
    console.log(`Deleted stale matches: ${deleted.deletedCount}`);

    console.log("All matches synced successfully!");
  } catch (err) {
    console.error("Error in syncMatches:", err.message);
  }
};

module.exports = { syncMatches };
*/



const fetchApiData = require('../utils/fetchApiData');
const Match = require('../models/match');

const syncMatches = async () => {
  try {
    console.log("Fetching matches from API...");

    // Step 1: API call
    const result = await fetchApiData({
      url: "https://scoreapi.365cric.com/api/match/getAllMatches",
      method: "post"
    });

    // Step 2: Handle API error response
    if (result.success === false) {
      console.error("API request failed:", result.message);
      return;
    }

    if (!result || !result.matches) {
      console.error("Invalid API structure:", result);
      return;
    }

    const matches = result.matches;
    console.log(`Total matches received: ${matches.length}`);

    if (matches.length === 0){
        const deleted = await Match.deleteMany({});
        console.log(`No matches in API, cleared DB. Deleted: ${deleted.deletedCount}`);
        return;
    }

    const chunkSize = 1000;
    const apiEventIds = []; // store all eventIds from API

    // Step 3: Process matches in chunks
    for (let i = 0; i < matches.length; i += chunkSize) {
      const chunk = matches.slice(i, i + chunkSize);

      const operations = chunk.map(match => {
        // Remove _id from API to avoid MongoDB immutable field error
        const { _id, ...matchData } = match;

        // Collect eventId for cleanup later
        apiEventIds.push(match.eventId);

        return {
          updateOne: {
            // filter: { eventId: match.eventId, marketId: match.marketId },
            filter: { eventId: match.eventId },
            update: { $set: matchData },
            upsert: true
          }
        };
      });

      // Execute bulkWrite safely
      if (operations.length > 0) {
        try {
          await Match.bulkWrite(operations, { ordered: false });
          console.log(
            `Saved chunk ${Math.floor(i / chunkSize) + 1} / ${Math.ceil(matches.length / chunkSize)}`
          );
        } catch (err) {
          if (err.code === 11000) {
            console.warn("Duplicate key error ignored in bulkWrite.");
          } else {
            console.error("BulkWrite error:", err.message);
          }
        }
      }
    }

    // Step 4: Delete stale matches by ID comparison
    const deleted = await Match.deleteMany({ eventId: { $nin: apiEventIds } });
    console.log(`Deleted stale matches: ${deleted.deletedCount}`);

    console.log("All matches synced successfully!");
  } catch (err) {
    console.error("Error in syncMatches:", err.message);
  }
};

module.exports = { syncMatches };

