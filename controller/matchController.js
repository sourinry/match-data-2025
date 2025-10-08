const { default: mongoose } = require('mongoose');
const Match = require('../models/match');
const Setting = require('../models/setting');

// Get matches for a specific sport
const getAllMatches = async (req, res) => {
  try {
    const sportId = req.body.sportId;
    const matches = await Match.find({ sportId }).lean();

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

// For Postman testing (get all matches)
const getMatch = async (req, res) => {
  try {
    const matches = await Match.find();
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

// Update specific match by _id
const updateMatchScoreIdAndType = async (req, res) => {
  try {
    const userID = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(userID)) {
      return res.status(400).json({
        status: 'fail',
        message: `Invalid MongoDB ID: ${userID}`
      });
    }

    const updateData = await Match.findByIdAndUpdate(userID, req.body, {
      new: true,
      runValidators: true
    });

    if (!updateData) {
      return res.status(404).json({
        status: 'fail',
        message: `Match data with ID ${userID} not found`
      });
    }

    res.status(200).json({
      status: 'success',
      data: { data: updateData }
    });
  } catch (error) {
    console.log(`Error updating scoreID, scoreType: ${error.message}`);
    res.status(500).json({
      status: 'false',
      message: 'Server error while updating ScoreId, scoreType'
    });
  }
};

// Update isActive field
const updateisActiveFiled = async (req, res) => {
  try {
    const id = req.params.id;
    const { isActive } = req.body;

    const match = await Match.findByIdAndUpdate(id, { isActive }, { new: true });

    res.status(200).json({
      success: true,
      data: { data: match }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// et all active matches
const getAllActiveMatches = async (req, res) => {
  try {
    const activeMatches = await Match.find({isActive: true });
    res.status(200).json({
      success: true,
      count: activeMatches.length,
      data: activeMatches
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

//delete api for postman 
const deleteAll = async(req,res)=>{
  try {
    await Match.deleteMany();

    res.status(200).json({
      status: 'success',
      message: 'match data delete successfully'
    })
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
}



//new api for update scoretype for specific sportId
const updateScoreTypeForNewMatches = async (req, res) => {
  const { sportId, scoreType } = req.body;

  if (!sportId || !scoreType) {
    return res.status(400).json({
      success: false,
      message: "sportId & scoreType are required",
    });
  }

  try {
    const settingResult = await Setting.updateOne(
      { sportId },
      { $set: { scoreType } },
      { upsert: true }
    );

    const result = await Match.updateMany(
      { sportId, isNew: true },
      { $set: { scoreType, isNew: false } }
    );

    if (result.modifiedCount == 0) {
      return res.json({
        success: true,
        message: "No new matches found to update",
      });
    }

    res.json({
      success: true,
      message: `ScoreType updated for ${result.modifiedCount} new matches`,
      updatedCount: result.modifiedCount,
    });
  } catch (err) {
    console.error("Error updating scoreType for new matches:", err);
    res.status(500).json({ success: false, error: "Server error" });
  }
};

//update bulk
// Update scoreType for all sports (bulk)
const updateAllScoreType = async (req, res) => {
  try {
    const { updates } = req.body; // Expecting an array of { sportId, scoreType }

    if (!Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid or empty updates array",
      });
    }

    let totalUpdated = 0;

    // Loop through each sport update
    for (const item of updates) {
      const { sportId, scoreType } = item;
      if (!sportId || !scoreType) continue;

      const result = await Match.updateMany(
        { sportId },
        { $set: { scoreType } }
      );
      totalUpdated += result.modifiedCount;
    }

    return res.json({
      success: true,
      message: `All sports updated successfully`,
      updatedCount: totalUpdated,
    });

  } catch (err) {
    console.error("Error updating scoreType:", err.message);
    res.status(500).json({
      success: false,
      message: "Server error while updating all sports",
    });
  }
};

//get all setting 
const getAllSettings = async (req, res) => {
  try {
    const { sportId } = req.body;
    const settings = await Setting.find({ sportId }).lean();

    if (!settings || settings.length == 0) {
      return res.status(400).json({
        success: false,
        message: "No settings found",
        data: [],
      });
    }

    return res.json({
      success: true,
      total: settings.length,
      data: settings,
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

module.exports = {
  getAllMatches,
  getMatch,
  updateMatchScoreIdAndType,
  updateisActiveFiled,
  getAllActiveMatches,
  deleteAll,
  updateScoreTypeForNewMatches,
  updateAllScoreType,
  getAllSettings
};
