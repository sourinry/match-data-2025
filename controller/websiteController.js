const { default: mongoose } = require('mongoose');
const Website = require('../models/website');
const { client } = require('../config/db'); // Redis client

const WEBSITE_CACHE_KEY = "websites:all"; // Redis key for all websites

// Create website API
const createWebsite = async (req, res) => {
  try {
    const websiteData = await Website.create(req.body);

    if (!websiteData) {
      return res.status(400).json({
        status: "fail",
        message: "website is not created",
      });
    }

    // Invalidate Redis cache after creating
    await client.del(WEBSITE_CACHE_KEY);

    res.status(201).json({
      status: "success",
      data: { websiteData },
    });
  } catch (error) {
    res.status(500).json({
      status: "fail",
      message: `error in create websites API error: ${error.message}`,
    });
  }
};

// GET all websites with Redis caching
const getAllWebsite = async (req, res) => {
  try {
    // Check Redis cache first
    const cached = await client.get(WEBSITE_CACHE_KEY);
    if (cached) {
      return res.status(200).json({
        status: "success",
        message: "fetched from Redis cache",
        length: JSON.parse(cached).length,
        data: { allWebsites: JSON.parse(cached) },
      });
    }

    // If cache misses, fetch from MongoDB
    const allWebsites = await Website.find();

    if (!allWebsites || allWebsites.length === 0) {
      return res.status(404).json({
        status: "fail",
        message: "cant find any websites",
      });
    }

    // Save result in Redis for 60 seconds
    await client.setEx(WEBSITE_CACHE_KEY, 60, JSON.stringify(allWebsites));

    res.status(200).json({
      status: "success",
      message: "find all websites",
      length: allWebsites.length,
      data: { allWebsites },
    });
  } catch (error) {
    res.status(500).json({
      status: "fail",
      message: `error in get websites API error: ${error.message}`,
    });
  }
};

// Update website by ID
const updateWebsiteById = async (req, res) => {
  try {
    const id = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: "fail",
        message: `${id} is not a mongoose type ID`,
      });
    }

    const updateWebsite = await Website.findByIdAndUpdate(id, req.body, {
      new: true,
    });

    if (!updateWebsite) {
      return res.status(404).json({
        status: "fail",
        message: `website with ${id} is not found`,
      });
    }

    // Invalidate cache after update
    await client.del(WEBSITE_CACHE_KEY);

    res.status(201).json({
      status: "success",
      message: `website with ${id} is successfully updated`,
      data: { updateWebsite },
    });
  } catch (error) {
    res.status(500).json({
      status: "fail",
      message: `error in update websites API error: ${error.message}`,
    });
  }
};

// Delete website by ID
const deleteWebsiteById = async (req, res) => {
  try {
    const id = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: "fail",
        message: `${id} is not a mongoose type ID`,
      });
    }

    const deletedWebsite = await Website.findByIdAndDelete(id);

    if (!deletedWebsite) {
      return res.status(400).json({
        status: "fail",
        message: `website with this: ${id} is not found`,
      });
    }

    // Invalidate cache after delete
    await client.del(WEBSITE_CACHE_KEY);

    res.status(200).json({
      status: "success",
      message: `website with this ${id} is deleted`,
      data: { Website: deletedWebsite },
    });
  } catch (error) {
    res.status(500).json({
      status: "fail",
      message: `error in delete websites API error: ${error.message}`,
    });
  }
};

module.exports = {
  createWebsite,
  getAllWebsite,
  updateWebsiteById,
  deleteWebsiteById,
};
