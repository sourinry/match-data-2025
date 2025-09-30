const Match = require('../models/match');

// GET all matches
const getAllMatches = async (req, res) => {
  try {
    const matches = await Match.find().sort({ openDate: -1 }); // latest first
    res.status(200).json({
      success: true,
      count: matches.length,
      data: matches
    });
  } catch (error) {
    console.error("Error fetching matches:", error.message);
    res.status(500).json({
      success: false,
      message: "Server error while fetching matches"
    });
  }
};

module.exports = { getAllMatches };
