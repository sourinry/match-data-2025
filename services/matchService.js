/*
//old function
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

    //store it in match variable
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

*/



/*
// this is new 04/10/25
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
    if (!result || result.success === false) {
      console.error("API request failed or invalid response:", result.message || result);
      return;
    }

    const matches = result.matches;
    console.log(`Total matches received: ${matches.length}`);

    if (!matches || matches.length === 0) {
      const deleted = await Match.deleteMany({});
      console.log(`No matches in API, cleared DB. Deleted: ${deleted.deletedCount}`);
      return;
    }

    const chunkSize = 1000;
    const apiEventIds = []; // to keep track of all eventIds

    // Step 3: Process matches in chunks
    for (let i = 0; i < matches.length; i += chunkSize) {
      const chunk = matches.slice(i, i + chunkSize);

      const operations = chunk.map(match => {
        const { _id, ...matchData } = match; // remove _id to prevent MongoDB errors
        apiEventIds.push(match.eventId);

        return {
          updateOne: {
            filter: { eventId: match.eventId },
            update: [
              {
                $set: {
                  ...matchData,
                  // Preserve existing scoreType if already set
                  scoreType: {
                    $cond: [
                      { $or: [{ $eq: ["$scoreType", null] }, { $eq: ["$scoreType", ""] }] },
                      matchData.scoreType || "Upcoming", // default for new match
                      "$scoreType" // keep existing
                    ]
                  }
                }
              }
            ],
            upsert: true
          }
        };
      });

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

    // Step 4: Delete stale matches
    const deleted = await Match.deleteMany({ eventId: { $nin: apiEventIds } });
    console.log(`Deleted stale matches: ${deleted.deletedCount}`);

    console.log("All matches synced successfully!");
  } catch (err) {
    console.error("Error in syncMatches:", err.message);
  }
};

module.exports = { syncMatches };
*/


/* 
//2.0
const fetchApiData = require('../utils/fetchApiData');
const Match = require('../models/match');
const SportSetting = require('../models/sportSetting'); 

const syncMatches = async () => {
  try {
    console.log("Fetching matches from API...");

    const result = await fetchApiData({
      url: "https://scoreapi.365cric.com/api/match/getAllMatches",
      method: "post"
    });

    if (!result || result.success === false) {
      console.error("API request failed or invalid response:", result.message || result);
      return;
    }

    const matches = result.matches;
    console.log(`Total matches received: ${matches.length}`);

    if (!matches || matches.length === 0) {
      const deleted = await Match.deleteMany({});
      console.log(`No matches in API, cleared DB. Deleted: ${deleted.deletedCount}`);
      return;
    }

    const existingMatches = await Match.find({}, 'eventId sportId');
    const existingEventIds = new Set(existingMatches.map(m => m.eventId));

    // Fetch all sport settings in advance
    const sportSettings = await SportSetting.find({});
    const sportScoreTypeMap = Object.fromEntries(sportSettings.map(s => [s.sportId, s.scoreType]));

    const chunkSize = 1000;
    const apiEventIds = [];

    for (let i = 0; i < matches.length; i += chunkSize) {
      const chunk = matches.slice(i, i + chunkSize);

      const operations = chunk.map(match => {
        const { _id, ...matchData } = match;
        apiEventIds.push(match.eventId);

        // If match is NEW, assign scoreType from sportSetting
        if (!existingEventIds.has(match.eventId)) {
          const scoreTypeFromSetting = sportScoreTypeMap[match.sportId];
          if (scoreTypeFromSetting) {
            matchData.scoreType = scoreTypeFromSetting;
          }
        }

        return {
          updateOne: {
            filter: { eventId: match.eventId },
            update: { $set: matchData },
            upsert: true
          }
        };
      });

      if (operations.length > 0) {
        try {
          await Match.bulkWrite(operations, { ordered: false });
          console.log(
            `Saved chunk ${Math.floor(i / chunkSize) + 1} / ${Math.ceil(matches.length / chunkSize)}`
          );
        } catch (err) {
          if (err.code === 11000) console.warn("Duplicate key error ignored in bulkWrite.");
          else console.error("BulkWrite error:", err.message);
        }
      }
    }

    const deleted = await Match.deleteMany({ eventId: { $nin: apiEventIds } });
    console.log(`Deleted stale matches: ${deleted.deletedCount}`);

    console.log("All matches synced successfully!");
  } catch (err) {
    console.error("Error in syncMatches:", err.message);
  }
};

module.exports = { syncMatches };
*/

/* 
//
/onst fetchApiData = require('../utils/fetchApiData');/
const Match = require('../models/match');
const SportSetting = require('../models/sportSetting');

const syncMatches = async () => {
  try {
    console.log("Fetching matches from API...");

    const result = await fetchApiData({
      url: "https://scoreapi.365cric.com/api/match/getAllMatches",
      method: "post"
    });

    if (!result || result.success === false) {
      console.error("API request failed or invalid response:", result.message || result);
      return;
    }

    const matches = result.matches;
    console.log(`Total matches received: ${matches.length}`);

    if (!matches || matches.length === 0) {
      const deleted = await Match.deleteMany({});
      console.log(`No matches in API, cleared DB. Deleted: ${deleted.deletedCount}`);
      return;
    }

    // Get current sport settings
    const sportSettings = await SportSetting.find({});
    const sportScoreTypeMap = {};
    sportSettings.forEach(s => {
      sportScoreTypeMap[s.sportId] = s.scoreType;
    });

    const apiEventIds = [];
    const chunkSize = 1000;

    for (let i = 0; i < matches.length; i += chunkSize) {
      const chunk = matches.slice(i, i + chunkSize);

      for (const match of chunk) {
        const { _id, ...matchData } = match;
        apiEventIds.push(match.eventId);

        // Check if match already exists
        const existingMatch = await Match.findOne({ eventId: match.eventId });

        if (!existingMatch) {
          // New match → apply scoreType based on SportSetting
          const newScoreType =
            sportScoreTypeMap[match.sportId] || matchData.scoreType || "Upcoming";

          await Match.updateOne(
            { eventId: match.eventId },
            { $set: { ...matchData, scoreType: newScoreType } },
            { upsert: true }
          );

          // console.log(`🆕 New match added (${match.eventId}) with scoreType = ${newScoreType}`);
        } else {
          // Existing match → update only matchData, not scoreType
          delete matchData.scoreType;
          await Match.updateOne(
            { eventId: match.eventId },
            { $set: matchData }
          );
        }
      }
    }

    // Delete stale matches (no longer in API)
    const deleted = await Match.deleteMany({ eventId: { $nin: apiEventIds } });
    console.log(`Deleted stale matches: ${deleted.deletedCount}`);

    console.log("All matches synced successfully!");
  } catch (err) {
    console.error("Error in syncMatches:", err.message);
  }
};

module.exports = { syncMatches };

*/




//new functionm 06/10/25
const fetchApiData = require("../utils/fetchApiData");
const Match = require("../models/match");

const syncMatches = async () => {
  try {
    console.log("Fetching matches from API...");

    // Step 1️⃣: Fetch data from external API
    const result = await fetchApiData({
      url: "https://scoreapi.365cric.com/api/match/getAllMatches",
      method: "post",
    });

    if (result.success === false) {
      console.error("API fetch failed:", result.message);
      return;
    }

    if (!result || !Array.isArray(result.matches)) {
      console.error("Invalid API structure:", result);
      return;
    }

    const matches = result.matches;
    console.log(`Total matches received: ${matches.length}`);

    if (matches.length === 0) {
      const deleted = await Match.deleteMany({});
      console.log(`🧹 No matches in API, DB cleared. Deleted: ${deleted.deletedCount}`);
      return;
    }

    // Step 2️⃣: Fetch all existing matches once
    const existingMatches = await Match.find({}, { eventId: 1 }).lean();
    const existingEventIds = new Set(existingMatches.map((m) => m.eventId));

    const chunkSize = 1000;
    const apiEventIds = [];
    const newEventIds = [];

    // Step 3️⃣: Process in chunks
    for (let i = 0; i < matches.length; i += chunkSize) {
      const chunk = matches.slice(i, i + chunkSize);

      const operations = chunk.map((match) => {
        const { _id, ...matchData } = match;
        apiEventIds.push(match.eventId);

        const isNew = !existingEventIds.has(match.eventId);
        if (isNew) newEventIds.push(match.eventId);

        return {
          updateOne: {
            filter: { eventId: match.eventId },
            update: {
              $set: { ...matchData },
              $setOnInsert: { isNew: true }, // ✅ only on insert
            },
            upsert: true,
          },
        };
      });

      if (operations.length > 0) {
        try {
          await Match.bulkWrite(operations, { ordered: false });
          console.log(
            `Processed chunk ${Math.floor(i / chunkSize) + 1}/${Math.ceil(
              matches.length / chunkSize
            )}`
          );
        } catch (err) {
          console.error("BulkWrite error:", err.message);
        }
      }
    }

    // Step 4️⃣: Mark old matches (not in newEventIds) as not new
    await Match.updateMany(
      { eventId: { $nin: newEventIds } },
      { $set: { isNew: false } }
    );

    // Step 5️⃣: Delete stale matches
    const deleted = await Match.deleteMany({ eventId: { $nin: apiEventIds } });
    console.log(`Deleted stale matches: ${deleted.deletedCount}`);

    // Step 6️⃣: Final summary
    console.log(
      `✅ Sync complete → Total: ${matches.length}, New: ${newEventIds.length}, Deleted: ${deleted.deletedCount}`
    );
  } catch (error) {
    console.error("Error in syncMatches:", error.message);
  }
};

module.exports = { syncMatches };

