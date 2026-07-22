import express from "express";
import Log from "../../models/Log.js";
import verifyTken from "../../verifyToken.js";

const router = express.Router();

const requireRole = (roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: "Not authorized to perform this action",
    });
  }
  next();
};


router.get("/", verifyTken, requireRole(["admin", "super-admin"]), async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit; 
    const logs = await Log.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)

    const total = await Log.countDocuments();

    res.status(200).json(
      {
        logs,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit),
        },
      }
    );
  } catch (error) {
    console.error("Error fetching logs:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;