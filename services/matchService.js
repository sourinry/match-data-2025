
//new functionm 06/10/25
const fetchApiData = require("../utils/fetchApiData");
const Match = require("../models/match");

const syncMatches = async () => {
  try {
    console.log("Fetching matches from API...");

    // Step 1: Fetch data from external API
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

    // Step 2: Fetch all existing matches once
    const existingMatches = await Match.find({}, { eventId: 1 }).lean();
    const existingEventIds = new Set(existingMatches.map((m) => m.eventId));

    const chunkSize = 1000;
    const apiEventIds = [];
    const newEventIds = [];

    // Step 3: Process in chunks
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
              $setOnInsert: { isNew: true }, // only on insert
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

    // Step 4: Mark old matches (not in newEventIds) as not new
    await Match.updateMany(
      { eventId: { $nin: newEventIds } },
      { $set: { isNew: false } }
    );

    // Step 5: Delete stale matches
    const deleted = await Match.deleteMany({ eventId: { $nin: apiEventIds } });
    console.log(`Deleted stale matches: ${deleted.deletedCount}`);

    // Step 6: Final summary
    console.log(
      `Sync complete → Total: ${matches.length}, New: ${newEventIds.length}, Deleted: ${deleted.deletedCount}`
    );
  } catch (error) {
    console.error("Error in syncMatches:", error.message);
  }
};

module.exports = { syncMatches };

