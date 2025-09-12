// Get all farms in the system (admin only)
const getAllFarms = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    // Get all farms with pagination
    const farms = await Farm.find({})
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("userId", "fullName email");

    // Get total count for pagination
    const total = await Farm.countDocuments({});
    const totalPages = Math.ceil(total / limit);

    const response = new ResponseEntity(1, "All farms retrieved successfully", {
      farms,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
    res.status(200).json(response);
  } catch (error) {
    console.error("Error fetching all farms:", error);
    const response = new ResponseEntity(0, "Error fetching all farms", {});
    res.status(500).json(response);
  }
};
const Farm = require("../models/farm.model.js");
const ResponseEntity = require("../utils/ResponseEntity.js");

// Get all farms for authenticated user
const getFarms = async (req, res) => {
  try {
    const userId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    // Get farms with pagination
    const farms = await Farm.findByUserId(userId, { page, limit });

    // Get total count for pagination
    const total = await Farm.countDocuments({ userId });
    const totalPages = Math.ceil(total / limit);

    const response = new ResponseEntity(1, "Farms retrieved successfully", {
      farms,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });

    res.status(200).json(response);
  } catch (error) {
    console.error("Error fetching farms:", error);
    const response = new ResponseEntity(0, "Error fetching farms", {});
    res.status(500).json(response);
  }
};

// Get single farm by ID
const getFarm = async (req, res) => {
  try {
    const farmId = req.params.id;
    const userId = req.user._id;

    const farm = await Farm.findById(farmId);

    if (!farm) {
      const response = new ResponseEntity(0, "Farm not found", {});
      return res.status(404).json(response);
    }

    // Check if user owns this farm
    if (!farm.isOwnedBy(userId)) {
      const response = new ResponseEntity(0, "Access denied", {});
      return res.status(403).json(response);
    }

    const response = new ResponseEntity(1, "Farm retrieved successfully", farm);
    res.status(200).json(response);
  } catch (error) {
    console.error("Error fetching farm:", error);
    const response = new ResponseEntity(0, "Error fetching farm", {});
    res.status(500).json(response);
  }
};

// Create new farm
const createFarm = async (req, res) => {
  try {
    const userId = req.user._id;
    console.log("userId", userId);
    console.log("req.body", req.body);

    if (!req.body) {
      const response = new ResponseEntity(0, "No request body provided", {});
      return res.status(400).json(response);
    }

    const {
      name,
      crop,
      plantingDate,
      harvestDate,
      description,
      coordinates,
      area,
    } = req.body;

    // Basic validation
    if (
      !name ||
      !crop ||
      !plantingDate ||
      !harvestDate ||
      !coordinates ||
      !area
    ) {
      const response = new ResponseEntity(0, "Missing required fields", {});
      return res.status(400).json(response);
    }

    // Validate coordinates
    if (!Array.isArray(coordinates) || coordinates.length < 3) {
      const response = new ResponseEntity(
        0,
        "Invalid coordinates. Must be an array with at least 3 points",
        {}
      );
      return res.status(400).json(response);
    }

    // Validate dates
    const plantDate = new Date(plantingDate);
    const harvestDate_ = new Date(harvestDate);

    if (plantDate >= harvestDate_) {
      const response = new ResponseEntity(
        0,
        "Harvest date must be after planting date",
        {}
      );
      return res.status(400).json(response);
    }

    // FIX: Convert coordinates to GeoJSON format
    const geoJsonCoordinates = {
      type: "Polygon",
      coordinates: [coordinates], // Wrap coordinates in an array for GeoJSON Polygon format
    };

    const farmData = {
      name: name.trim(),
      crop: crop.trim(),
      plantingDate: plantDate,
      harvestDate: harvestDate_,
      description: description?.trim(),
      area: parseFloat(area),
      userId,
      coordinates: geoJsonCoordinates, // Use the GeoJSON format
    };

    const farm = await Farm.create(farmData);

    const response = new ResponseEntity(1, "Farm created successfully", farm);
    res.status(201).json(response);
  } catch (error) {
    console.error("Error creating farm:", error);

    if (error.name === "ValidationError") {
      const response = new ResponseEntity(0, error.message, {});
      return res.status(400).json(response);
    }

    const response = new ResponseEntity(0, "Error creating farm", {});
    res.status(500).json(response);
  }
};

// Update farm
const updateFarm = async (req, res) => {
  try {
    const farmId = req.params.id;
    const userId = req.user._id;
    const updateData = req.body;

    const farm = await Farm.findById(farmId);

    if (!farm) {
      const response = new ResponseEntity(0, "Farm not found", {});
      return res.status(404).json(response);
    }

    // Check if user owns this farm
    if (!farm.isOwnedBy(userId)) {
      const response = new ResponseEntity(0, "Access denied", {});
      return res.status(403).json(response);
    }

    // Validate dates if provided
    if (updateData.plantingDate && updateData.harvestDate) {
      const plantDate = new Date(updateData.plantingDate);
      const harvestDate = new Date(updateData.harvestDate);

      if (plantDate >= harvestDate) {
        const response = new ResponseEntity(
          0,
          "Harvest date must be after planting date",
          {}
        );
        return res.status(400).json(response);
      }
    }

    // Update farm
    const updatedFarm = await Farm.findByIdAndUpdate(farmId, updateData, {
      new: true,
      runValidators: true,
    });

    const response = new ResponseEntity(
      1,
      "Farm updated successfully",
      updatedFarm
    );
    res.status(200).json(response);
  } catch (error) {
    console.error("Error updating farm:", error);

    if (error.name === "ValidationError") {
      const response = new ResponseEntity(0, error.message, {});
      return res.status(400).json(response);
    }

    const response = new ResponseEntity(0, "Error updating farm", {});
    res.status(500).json(response);
  }
};

// Delete farm
const deleteFarm = async (req, res) => {
  try {
    const farmId = req.params.id;
    const userId = req.user._id;

    const farm = await Farm.findById(farmId);

    if (!farm) {
      const response = new ResponseEntity(0, "Farm not found", {});
      return res.status(404).json(response);
    }

    // Check if user owns this farm
    if (!farm.isOwnedBy(userId)) {
      const response = new ResponseEntity(0, "Access denied", {});
      return res.status(403).json(response);
    }

    await Farm.findByIdAndDelete(farmId);

    const response = new ResponseEntity(1, "Farm deleted successfully", {});
    res.status(200).json(response);
  } catch (error) {
    console.error("Error deleting farm:", error);
    const response = new ResponseEntity(0, "Error deleting farm", {});
    res.status(500).json(response);
  }
};

module.exports = {
  getFarms,
  getFarm,
  createFarm,
  updateFarm,
  deleteFarm,
  getAllFarms,
};
