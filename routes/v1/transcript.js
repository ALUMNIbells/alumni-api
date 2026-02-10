
import { Router } from "express";
import verifyTken from "../../verifyToken.js";
import { requestTranscript, upsertFullTranscript } from "../../controllers/transcripts/index.js";



const router = Router();
router.put("/:matricNo", verifyTken, upsertFullTranscript);
router.get("/:matricNo", verifyTken, requestTranscript);

export default router;