import express from "express";
import {
  createInquiry,
  deleteInquiry,
  getInquiries,
  getInquiryById,
  updateInquiryStatus,
} from "../../controllers/inquiries/index.js";
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

router.post("/", createInquiry);
router.get("/", verifyTken, requireRole(["admin", "super-admin"]), getInquiries);
router.get("/:inquiryId", verifyTken, requireRole(["admin", "super-admin"]), getInquiryById);
router.patch("/:inquiryId/status", verifyTken, requireRole(["admin", "super-admin"]), updateInquiryStatus);
router.delete("/:inquiryId", verifyTken, requireRole(["admin", "super-admin"]), deleteInquiry);

export default router;
