import express from "express";

import verifyTken from "../../verifyToken.js";
import websiteState from "../../models/websiteState.js";
import { getWebsiteConfig, updateWebsiteConfig } from "../../controllers/configController.js";


const router = express.Router();

const requireRole = (roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to perform this action',
    });
  }
  next();
};

// Get website config (public)
router.get('/config', getWebsiteConfig);

// Update website config (SuperAdmin only)
router.put('/config', verifyTken, requireRole(['super-admin', 'admin']), updateWebsiteConfig);

export default router;
