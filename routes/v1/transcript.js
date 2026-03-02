
import { Router } from "express";
import verifyTken from "../../verifyToken.js";
import { requestTranscript, upsertFullTranscript } from "../../controllers/transcripts/student/index.js";
import { getAllApprovedTranscripts, getAllPendingTranscripts, getAllRejectedTranscripts, getAllTranscripts, getTranscriptByMatricNo } from "../../controllers/transcripts/student/fetch.js";
import { approveTranscript, rejectTranscript } from "../../controllers/transcripts/student/approvals.js";



const router = Router();
router.put("/:matricNo", verifyTken, upsertFullTranscript);
router.put("/request/:matricNo", verifyTken, requestTranscript);
router.get("/all", verifyTken, getAllTranscripts);
router.get("/pending", verifyTken, getAllPendingTranscripts);
router.get("/approved", verifyTken, getAllApprovedTranscripts);
router.get("/rejected", verifyTken, getAllRejectedTranscripts);
router.get("/:matricNo", verifyTken, getTranscriptByMatricNo);
router.put("/approve/:id", verifyTken, approveTranscript);
router.put("/reject/:id", verifyTken, rejectTranscript);


export default router;