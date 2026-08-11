/**
 * @swagger
 * tags:
 *   - name: Students
 *     description: Student profile, alumni connections, jobs, and messaging
 */

/**
 * @swagger
 * /students/profile:
 *   get:
 *     summary: Get the authenticated student's profile
 *     tags: [Students]
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
 *       403:
 *         description: Only students can perform this action
 *   patch:
 *     summary: Update the authenticated student's profile details
 *     tags: [Students]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullName:
 *                 type: string
 *               phone:
 *                 type: string
 *               college:
 *                 type: string
 *               course:
 *                 type: string
 *               imgurl:
 *                 type: string
 *               occupation:
 *                 type: string
 *               address:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       400:
 *         description: Invalid request body
 */

/**
 * @swagger
 * /students/discover:
 *   get:
 *     summary: Discover other alumni with weighted relevance and search support
 *     tags: [Students]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by full name, email, matric number, college, course, or occupation
 *     responses:
 *       200:
 *         description: Students discovered successfully
 */

/**
 * @swagger
 * /students/connections:
 *   get:
 *     summary: Get the authenticated student's accepted connections
 *     tags: [Students]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search within the current connection list
 *     responses:
 *       200:
 *         description: Connections retrieved successfully
 * /students/connections/{studentId}:
 *   delete:
 *     summary: Remove an existing connection between authenticated student and another student
 *     tags: [Students]
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Connection removed successfully
 *       400:
 *         description: Invalid student id or not connected
 */

/**
 * @swagger
 * /students/connections/requests:
 *   get:
 *     summary: Get pending connection requests for the authenticated student
 *     tags: [Students]
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [incoming, sent]
 *         description: Defaults to incoming
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Connection requests retrieved successfully
 */

/**
 * @swagger
 * /students/connections/requests/{studentId}:
 *   post:
 *     summary: Send a connection request to another student
 *     tags: [Students]
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       201:
 *         description: Connection request sent successfully
 *       400:
 *         description: Invalid request or already connected
 */

/**
 * @swagger
 * /students/connections/requests/{requestId}/accept:
 *   patch:
 *     summary: Accept a pending connection request
 *     tags: [Students]
 *     parameters:
 *       - in: path
 *         name: requestId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Connection request accepted successfully
 */

/**
 * @swagger
 * /students/connections/requests/{requestId}/reject:
 *   patch:
 *     summary: Reject a pending connection request
 *     tags: [Students]
 *     parameters:
 *       - in: path
 *         name: requestId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Connection request rejected successfully
 */

/**
 * @swagger
 * /students/messages/conversations:
 *   get:
 *     summary: Get the authenticated student's message conversations
 *     tags: [Students]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search conversation partners by name, email, matric number, college, course, or occupation
 *     responses:
 *       200:
 *         description: Conversations retrieved successfully
 */

/**
 * @swagger
 * /students/messages/{studentId}:
 *   get:
 *     summary: Get paginated messages exchanged with a connected student
 *     tags: [Students]
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Messages retrieved successfully
 *   post:
 *     summary: Send a text message to a connected student
 *     tags: [Students]
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - body
 *             properties:
 *               body:
 *                 type: string
 *               replyToMessageId:
 *                 type: string
 *                 description: Optional message ID to tag this message as a reply
 *     responses:
 *       201:
 *         description: Message sent successfully
 *       403:
 *         description: Messaging is only allowed between connected students
 */

/**
 * @swagger
 * /students/messages/{studentId}/read:
 *   patch:
 *     summary: Mark unread messages from a connected student as read
 *     tags: [Students]
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Messages marked as read successfully
 */

/**
 * @swagger
 * /students/messages/message/{messageId}:
 *   patch:
 *     summary: Edit a previously sent message within 10 minutes
 *     tags: [Students]
 *     parameters:
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - body
 *             properties:
 *               body:
 *                 type: string
 *     responses:
 *       200:
 *         description: Message edited successfully
 *       400:
 *         description: Invalid message ID or edit window expired
 *       403:
 *         description: Only the sender can edit a message
 */

/**
 * @swagger
 * /students/messages/message/{messageId}:
 *   delete:
 *     summary: Delete a previously sent message within 24 hours
 *     tags: [Students]
 *     parameters:
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Message deleted successfully
 *       400:
 *         description: Invalid message ID or delete window expired
 *       403:
 *         description: Only the sender can delete a message
 */

/**
 * @swagger
 * /students/jobs:
 *   post:
 *     summary: Create a job post as an authenticated student
 *     tags: [Students]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - location
 *               - description
 *             properties:
 *               title:
 *                 type: string
 *               location:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Job post created successfully
 */

/**
 * @swagger
 * /students/jobs/feed:
 *   get:
 *     summary: Get a job feed that prioritizes recent connection posts and randomizes the rest
 *     tags: [Students]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search job posts by title
 *     responses:
 *       200:
 *         description: Job feed retrieved successfully
 */

import express from "express";
import {
  acceptConnectionRequest,
  cancelSentConnectionRequest,
  createJobPost,
  deleteJobPost,
  deleteStudentMessage,
  disconnectStudent,
  discoverStudents,
  editStudentMessage,
  getAllJobs,
  getAllStudents,
  getConversationMessages,
  getConnections,
  getConnectionRequests,
  getJobFeed,
  getMessageConversations,
  getMyJobs,
  getStudentProfile,
  markConversationAsRead,
  rejectConnectionRequest,
  sendStudentMessage,
  sendConnectionRequest,
  updateJobPost,
  updateStudentProfile,
  verifyJobPost,
} from "../../controllers/students/index.js";
import verifyTken from "../../verifyToken.js";

const router = express.Router();

router.get("/profile", verifyTken, getStudentProfile);
router.patch("/profile", verifyTken, updateStudentProfile);
router.get("/discover", verifyTken, discoverStudents);
router.get("/connections", verifyTken, getConnections);
router.delete("/connections/:studentId", verifyTken, disconnectStudent);
router.get("/connections/requests", verifyTken, getConnectionRequests);
router.post("/connections/requests/:studentId", verifyTken, sendConnectionRequest);
router.patch("/connections/requests/:requestId/accept", verifyTken, acceptConnectionRequest);
router.patch("/connections/requests/:requestId/reject", verifyTken, rejectConnectionRequest);
router.delete("/connections/requests/:requestId/cancel", verifyTken, cancelSentConnectionRequest);
router.get("/messages/conversations", verifyTken, getMessageConversations);
router.get("/messages/:studentId", verifyTken, getConversationMessages);
router.post("/messages/:studentId", verifyTken, sendStudentMessage);
router.patch("/messages/:studentId/read", verifyTken, markConversationAsRead);
router.patch("/messages/message/:messageId", verifyTken, editStudentMessage);
router.delete("/messages/message/:messageId", verifyTken, deleteStudentMessage);
router.post("/jobs", verifyTken, createJobPost);
router.get("/jobs/feed", verifyTken, getJobFeed);
router.get("/jobs/my", verifyTken, getMyJobs);
router.get("/jobs", verifyTken, getAllJobs);
router.patch("/jobs/:jobId/verify", verifyTken, verifyJobPost);
router.patch("/jobs/:jobId", verifyTken, updateJobPost);
router.delete("/jobs/:jobId", verifyTken, deleteJobPost);
router.get("/all", verifyTken, getAllStudents);

export default router;
