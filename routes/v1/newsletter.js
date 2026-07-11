import express from "express";
import {
  createNewsletter,
  deleteNewsletter,
  getNewsletterById,
  getNewsletters,
  updateNewsletter,
} from "../../controllers/newsletters/index.js";
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

router.get("/", getNewsletters);
router.get("/:newsletterId", getNewsletterById);
router.post("/", verifyTken, requireRole(["admin", "super-admin"]), createNewsletter);
router.patch("/:newsletterId", verifyTken, requireRole(["admin", "super-admin"]), updateNewsletter);
router.delete("/:newsletterId", verifyTken, requireRole(["admin", "super-admin"]), deleteNewsletter);

export default router;
