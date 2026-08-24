import express from "express";
import verifyTken from "../../verifyToken.js";
import {
  addCandidateToPosition,
  addPositionToElection,
  collateElectionResults,
  createElection,
  editElection,
  getElectionById,
  getElectionResults,
  getElections,
  publishElectionResults,
  voteInElection,
} from "../../controllers/elections/index.js";

const router = express.Router();

const requireRole = (roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: "Not authorized to perform this action",
    });
  }

  next();
};

/**
 * @openapi
 * tags:
 *   - name: Elections
 *     description: Election lifecycle and voting APIs
 */

/**
 * @openapi
 * /elections:
 *   get:
 *     tags: [Elections]
 *     summary: List all elections
 *     responses:
 *       200:
 *         description: Successful response with election list
 */
router.get("/", getElections);

/**
 * @openapi
 * /elections:
 *   post:
 *     tags: [Elections]
 *     summary: Create an election
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, session, startDate, endDate]
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               session:
 *                 type: string
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               endDate:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Election was created successfully
 *       403:
 *         description: User is not authorized
 */
router.post("/", verifyTken, requireRole(["super-admin"]), createElection);

/**
 * @openapi
 * /elections/{electionId}:
 *   get:
 *     tags: [Elections]
 *     summary: Fetch election details by id
 *     parameters:
 *       - in: path
 *         name: electionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Election details fetched successfully
 */
router.get("/:electionId", getElectionById);


//edit election
/**
 * @openapi
 * /elections/{electionId}:
 *   patch:
 *     tags: [Elections]
 *     summary: Edit an election
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: electionId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               session:
 *                 type: string
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               endDate:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Election updated successfully
 */
router.patch("/:electionId", verifyTken, editElection)

/**
 * @openapi
 * /elections/{electionId}/positions:
 *   post:
 *     tags: [Elections]
 *     summary: Add a new election position
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: electionId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title]
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Position created successfully
 */
router.post(
  "/:electionId/positions",
  verifyTken,
  requireRole(["super-admin"]),
  addPositionToElection
);

/**
 * @openapi
 * /elections/{electionId}/positions/{positionId}/candidates:
 *   post:
 *     tags: [Elections]
 *     summary: Add a candidate to an election position
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: electionId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: positionId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [fullName]
 *             properties:
 *               fullName:
 *                 type: string
 *               imgurl:
 *                 type: string
 *     responses:
 *       201:
 *         description: Candidate added successfully
 */
router.post(
  "/:electionId/positions/:positionId/candidates",
  verifyTken,
  requireRole(["super-admin"]),
  addCandidateToPosition
);

/**
 * @openapi
 * /elections/{electionId}/vote:
 *   post:
 *     tags: [Elections]
 *     summary: Submit a vote for a candidate in a position
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: electionId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [positionId, candidateId]
 *             properties:
 *               positionId:
 *                 type: string
 *               candidateId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Vote submitted successfully
 *       403:
 *         description: Voting is not allowed outside the election window
 */
router.post("/:electionId/vote", verifyTken, requireRole(["student"]), voteInElection);

/**
 * @openapi
 * /elections/{electionId}/collate-results:
 *   post:
 *     tags: [Elections]
 *     summary: Collate results for a completed election and store the result snapshot
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: electionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Results collated and saved successfully
 */
router.post(
  "/:electionId/collate-results",
  verifyTken,
  requireRole(["super-admin"]),
  collateElectionResults
);

/**
 * @openapi
 * /elections/{electionId}/publish-results:
 *   patch:
 *     tags: [Elections]
 *     summary: Publish stored election results for general viewing
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: electionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Results published successfully
 */
router.patch(
  "/:electionId/publish-results",
  verifyTken,
  requireRole(["super-admin"]),
  publishElectionResults
);

/**
 * @openapi
 * /elections/{electionId}/results:
 *   get:
 *     tags: [Elections]
 *     summary: Fetch election results
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: electionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Election results returned
 *       403:
 *         description: Results are not yet published
 */
router.get("/:electionId/results", getElectionResults);

export default router;
