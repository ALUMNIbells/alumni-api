import mongoose from "mongoose";
import { Resend } from "resend";
import { listEnv } from "swiftenv";
import ConnectionRequest from "../../models/ConnectionRequest.js";
import JobPost from "../../models/JobPost.js";
import Student from "../../models/Student.js";
import { connectionRequestTemplate } from "../../utils/emailTemplates.js";

const { RESEND_API_KEY } = listEnv();
const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

const PROFILE_FIELDS = [
  "fullName",
  "phone",
  "imgurl",
  "occupation",
  "address",
  "description",
];

const REQUIRED_PROFILE_FIELDS = ["fullName", "phone"];

const STUDENT_SUMMARY_FIELDS =
  "fullName email matricNo college course occupation imgurl description createdAt connections verified";

const parsePagination = (query) => {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || 10, 1), 50);
  const skip = (page - 1) * limit;

  return { page, limit, skip };
};

const escapeRegex = (value = "") => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

//matric year first four digits of matric number
const extractMatricYear = (matricNo = "") => {
  const year = String(matricNo).substring(0, 4);
  return year?.trim() || "";
};

const ensureStudentRole = (req, res) => {
  if (req.user?.role !== "student") {
    res.status(403).json({ message: "Only students can perform this action" });
    return false;
  }

  return true;
};

const ensureAdminOrSuperAdminRole = (req, res) => {
  if (req.user?.role !== "admin" && req.user?.role !== "super-admin") {
    res.status(403).json({ message: "Only admin and super-admin can perform this action" });
    return false;
  }

  return true;
};

const ensureSuperAdminRole = (req, res) => {
  if (req.user?.role !== "super-admin") {
    res.status(403).json({ message: "Only super-admin can perform this action" });
    return false;
  }

  return true;
};

const formatStudentProfile = (student) => ({
  id: student._id,
  matricNo: student.matricNo,
  fullName: student.fullName,
  email: student.email,
  phone: student.phone,
  college: student.college,
  course: student.course,
  imgurl: student.imgurl,
  occupation: student.occupation,
  address: student.address,
  description: student.description,
  verified: student.verified,
  createdAt: student.createdAt,
  updatedAt: student.updatedAt,
  connectionsCount: student.connections?.length || 0,
});

const buildStudentSearchMatch = (search) => {
  if (!search?.trim()) {
    return undefined;
  }

  const pattern = new RegExp(escapeRegex(search.trim()), "i");

  return {
    $or: [
      { fullName: pattern },
      { email: pattern },
      { matricNo: pattern },
      { college: pattern },
      { course: pattern },
      { occupation: pattern },
    ],
  };
};

const sendConnectionNotification = async (recipient, requester) => {
  if (!resend || !recipient?.email) {
    return;
  }

  const { error } = await resend.emails.send({
    from: "Bells University Alumni Association <noreply@notifications.bellsuniversityalumni.com>",
    to: recipient.email,
    subject: `${requester.fullName} wants to connect with you`,
    html: connectionRequestTemplate({
      recipientName: recipient.fullName,
      requesterName: requester.fullName,
      requesterCollege: requester.college,
      requesterCourse: requester.course,
      requesterOccupation: requester.occupation,
    }),
  });

  if (error) {
    console.error("Failed to send connection request email:", error);
  }
};

export const getStudentProfile = async (req, res) => {
  try {
    if (!ensureStudentRole(req, res)) {
      return;
    }

    const student = await Student.findById(req.user.id)
      .select("-password -token -tokenExpiry -resetToken -resetTokenExpiry")
      .lean();

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    return res.status(200).json({
      message: "Profile retrieved successfully",
      data: formatStudentProfile(student),
    });
  } catch (error) {
    console.error("Error retrieving student profile:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const updateStudentProfile = async (req, res) => {
  try {
    if (!ensureStudentRole(req, res)) {
      return;
    }

    const updateData = {};

    for (const field of PROFILE_FIELDS) {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        const value = typeof req.body[field] === "string" ? req.body[field].trim() : req.body[field];
        updateData[field] = value;
      }
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        message: `No updatable fields provided. Allowed fields: ${PROFILE_FIELDS.join(", ")}`,
      });
    }

    for (const field of REQUIRED_PROFILE_FIELDS) {
      if (Object.prototype.hasOwnProperty.call(updateData, field) && !updateData[field]) {
        return res.status(400).json({ message: `${field} cannot be empty` });
      }
    }

    const student = await Student.findByIdAndUpdate(
      req.user.id,
      { $set: updateData },
      { new: true, runValidators: true }
    )
      .select("-password -token -tokenExpiry -resetToken -resetTokenExpiry")
      .lean();

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    return res.status(200).json({
      message: "Profile updated successfully",
      data: formatStudentProfile(student),
    });
  } catch (error) {
    console.error("Error updating student profile:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const sendConnectionRequest = async (req, res) => {
  try {
    if (!ensureStudentRole(req, res)) {
      return;
    }

    const { studentId } = req.params;
    const currentStudentId = new mongoose.Types.ObjectId(req.user.id);

    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({ message: "Invalid student ID" });
    }

    if (studentId === req.user.id) {
      return res.status(400).json({ message: "You cannot send a connection request to yourself" });
    }

    const [currentStudent, recipient] = await Promise.all([
      Student.findById(req.user.id).select(STUDENT_SUMMARY_FIELDS).lean(),
      Student.findById(studentId).select(STUDENT_SUMMARY_FIELDS).lean(),
    ]);

    if (!currentStudent) {
      return res.status(404).json({ message: "Student not found" });
    }

    if (!recipient || !recipient.verified) {
      return res.status(404).json({ message: "Recipient not found" });
    }

    const currentConnections = (currentStudent.connections || []).map((connectionId) => String(connectionId));
    if (currentConnections.includes(studentId)) {
      return res.status(400).json({ message: "You are already connected with this student" });
    }

    const [existingPendingRequest, reversePendingRequest, latestSameDirectionRequest] = await Promise.all([
      ConnectionRequest.findOne({ requester: currentStudentId, recipient: studentId, status: "pending" }),
      ConnectionRequest.findOne({ requester: studentId, recipient: currentStudentId, status: "pending" }),
      ConnectionRequest.findOne({ requester: currentStudentId, recipient: studentId }).sort({ createdAt: -1 }),
    ]);

    if (existingPendingRequest) {
      return res.status(400).json({ message: "Connection request already sent" });
    }

    if (reversePendingRequest) {
      return res.status(400).json({
        message: "This student has already sent you a connection request. Accept it instead.",
        requestId: reversePendingRequest._id,
      });
    }

    let connectionRequest;

    if (latestSameDirectionRequest?.status === "rejected") {
      latestSameDirectionRequest.status = "pending";
      latestSameDirectionRequest.respondedAt = null;
      connectionRequest = await latestSameDirectionRequest.save();
    } else {
      connectionRequest = await ConnectionRequest.create({
        requester: currentStudentId,
        recipient: studentId,
      });
    }

    await sendConnectionNotification(recipient, currentStudent);

    return res.status(201).json({
      message: "Connection request sent successfully",
      data: connectionRequest,
    });
  } catch (error) {
    console.error("Error sending connection request:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getConnectionRequests = async (req, res) => {
  try {
    if (!ensureStudentRole(req, res)) {
      return;
    }

    const { page, limit, skip } = parsePagination(req.query);
    const type = req.query.type === "sent" ? "sent" : "incoming";
    const query =
      type === "sent"
        ? { requester: req.user.id, status: "pending" }
        : { recipient: req.user.id, status: "pending" };

    const [requests, total] = await Promise.all([
      ConnectionRequest.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate(type === "sent" ? "recipient" : "requester", "fullName email matricNo college course occupation imgurl")
        .lean(),
      ConnectionRequest.countDocuments(query),
    ]);

    const data = requests.map((request) => ({
      id: request._id,
      status: request.status,
      createdAt: request.createdAt,
      respondedAt: request.respondedAt,
      student: type === "sent" ? request.recipient : request.requester,
    }));

    return res.status(200).json({
      message: "Connection requests retrieved successfully",
      data,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching connection requests:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const acceptConnectionRequest = async (req, res) => {
  try {
    if (!ensureStudentRole(req, res)) {
      return;
    }

    const { requestId } = req.params;

    const connectionRequest = await ConnectionRequest.findOne({
      _id: requestId,
      recipient: req.user.id,
      status: "pending",
    });

    if (!connectionRequest) {
      return res.status(404).json({ message: "Pending connection request not found" });
    }

    connectionRequest.status = "accepted";
    connectionRequest.respondedAt = new Date();
    await connectionRequest.save();

    await Promise.all([
      Student.findByIdAndUpdate(req.user.id, { $addToSet: { connections: connectionRequest.requester } }),
      Student.findByIdAndUpdate(connectionRequest.requester, { $addToSet: { connections: connectionRequest.recipient } }),
    ]);

    const connectedStudent = await Student.findById(connectionRequest.requester)
      .select("fullName email matricNo college course occupation imgurl")
      .lean();

    return res.status(200).json({
      message: "Connection request accepted successfully",
      data: connectedStudent,
    });
  } catch (error) {
    console.error("Error accepting connection request:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const rejectConnectionRequest = async (req, res) => {
  try {
    if (!ensureStudentRole(req, res)) {
      return;
    }

    const { requestId } = req.params;

    const connectionRequest = await ConnectionRequest.findOne({
      _id: requestId,
      recipient: req.user.id,
      status: "pending",
    });

    if (!connectionRequest) {
      return res.status(404).json({ message: "Pending connection request not found" });
    }

    connectionRequest.status = "rejected";
    connectionRequest.respondedAt = new Date();
    await connectionRequest.save();

    return res.status(200).json({
      message: "Connection request rejected successfully",
      data: connectionRequest,
    });
  } catch (error) {
    console.error("Error rejecting connection request:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const cancelSentConnectionRequest = async (req, res) => {
  try {
    if (!ensureStudentRole(req, res)) {
      return;
    }

    const { requestId } = req.params;

    const connectionRequest = await ConnectionRequest.findOne({
      _id: requestId,
      requester: req.user.id,
      status: "pending",
    });

    if (!connectionRequest) {
      return res.status(404).json({ message: "Pending sent connection request not found" });
    }

    await ConnectionRequest.deleteOne({ _id: connectionRequest._id });

    return res.status(200).json({
      message: "Sent connection request cancelled successfully",
    });
  } catch (error) {
    console.error("Error cancelling sent connection request:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getConnections = async (req, res) => {
  try {
    if (!ensureStudentRole(req, res)) {
      return;
    }

    const { page, limit, skip } = parsePagination(req.query);
    const search = req.query.search || req.query.q || "";

    const student = await Student.findById(req.user.id).select("connections").lean();

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    const connections = student.connections || [];
    if (connections.length === 0) {
      return res.status(200).json({
        message: "Connections retrieved successfully",
        data: [],
        pagination: {
          total: 0,
          page,
          limit,
          pages: 0,
        },
      });
    }

    const query = {
      _id: { $in: connections },
      verified: true,
    };

    const searchMatch = buildStudentSearchMatch(search);
    if (searchMatch) {
      Object.assign(query, searchMatch);
    }

    const [records, total] = await Promise.all([
      Student.find(query)
        .select("fullName email matricNo college course occupation imgurl description")
        .sort({ fullName: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Student.countDocuments(query),
    ]);

    return res.status(200).json({
      message: "Connections retrieved successfully",
      data: records,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching connections:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const discoverStudents = async (req, res) => {
  try {
    if (!ensureStudentRole(req, res)) {
      return;
    }

    const { page, limit, skip } = parsePagination(req.query);
    const search = req.query.search || req.query.q || "";

    const currentStudent = await Student.findById(req.user.id)
      .select("college course occupation matricNo connections")
      .lean();

    if (!currentStudent) {
      return res.status(404).json({ message: "Student not found" });
    }

    const currentStudentId = new mongoose.Types.ObjectId(req.user.id);
    const currentMatricYear = extractMatricYear(currentStudent.matricNo);
    const searchMatch = buildStudentSearchMatch(search);
    const match = {
      _id: { $ne: currentStudentId },
      verified: true,
    };

    if (searchMatch) {
      Object.assign(match, searchMatch);
    }

    const college = (currentStudent.college || "").toLowerCase();
    const course = (currentStudent.course || "").toLowerCase();
    const occupation = (currentStudent.occupation || "").toLowerCase();

    const [students, total] = await Promise.all([
      Student.aggregate([
        { $match: match },
        {
          $addFields: {
            matricYear: {
              $arrayElemAt: [{ $split: [{ $ifNull: ["$matricNo", ""] }, "/"] }, 0],
            },
            sameCollegeScore: {
              $cond: [
                { $eq: [{ $toLower: { $ifNull: ["$college", ""] } }, college] },
                3,
                0,
              ],
            },
            sameCourseScore: {
              $cond: [
                { $eq: [{ $toLower: { $ifNull: ["$course", ""] } }, course] },
                3,
                0,
              ],
            },
            sameOccupationScore: {
              $cond: [
                {
                  $and: [
                    { $ne: [occupation, ""] },
                    { $eq: [{ $toLower: { $ifNull: ["$occupation", ""] } }, occupation] },
                  ],
                },
                2,
                0,
              ],
            },
            sameMatricYearScore: {
              $cond: [{ $eq: ["$matricYear", currentMatricYear] }, 1, 0],
            },
            randomScore: {
              $multiply: [{ $rand: {} }, 0.5],
            },
          },
        },
        {
          $addFields: {
            relevanceScore: {
              $add: [
                "$sameCollegeScore",
                "$sameCourseScore",
                "$sameOccupationScore",
                "$sameMatricYearScore",
                "$randomScore",
              ],
            },
          },
        },
        { $sort: { relevanceScore: -1, createdAt: -1 } },
        { $skip: skip },
        { $limit: limit },
        {
          $project: {
            fullName: 1,
            email: 1,
            matricNo: 1,
            college: 1,
            course: 1,
            occupation: 1,
            imgurl: 1,
            description: 1,
            createdAt: 1,
            sameCollegeScore: 1,
            sameCourseScore: 1,
            sameOccupationScore: 1,
            sameMatricYearScore: 1,
            relevanceScore: 1,
          },
        },
      ]),
      Student.countDocuments(match),
    ]);

    const connectionIds = (currentStudent.connections || []).map((connectionId) => String(connectionId));
    const discoveredIds = students.map((student) => student._id);

    const pendingRequests = discoveredIds.length
      ? await ConnectionRequest.find({
          status: "pending",
          $or: [
            { requester: currentStudentId, recipient: { $in: discoveredIds } },
            { requester: { $in: discoveredIds }, recipient: currentStudentId },
          ],
        }).lean()
      : [];

    const pendingSent = new Set(
      pendingRequests
        .filter((request) => String(request.requester) === req.user.id)
        .map((request) => String(request.recipient))
    );
    const pendingReceived = new Set(
      pendingRequests
        .filter((request) => String(request.recipient) === req.user.id)
        .map((request) => String(request.requester))
    );

    const data = students.map((student) => {
      const studentId = String(student._id);
      const matchReasons = [];

      if (student.sameCollegeScore) {
        matchReasons.push("same-college");
      }
      if (student.sameCourseScore) {
        matchReasons.push("same-course");
      }
      if (student.sameOccupationScore) {
        matchReasons.push("same-occupation");
      }
      if (student.sameMatricYearScore) {
        matchReasons.push("same-matric-year");
      }

      let connectionStatus = "none";
      if (connectionIds.includes(studentId)) {
        connectionStatus = "connected";
      } else if (pendingSent.has(studentId)) {
        connectionStatus = "pending-sent";
      } else if (pendingReceived.has(studentId)) {
        connectionStatus = "pending-received";
      }

      return {
        id: student._id,
        fullName: student.fullName,
        email: student.email,
        matricNo: student.matricNo,
        college: student.college,
        course: student.course,
        occupation: student.occupation,
        imgurl: student.imgurl,
        description: student.description,
        createdAt: student.createdAt,
        connectionStatus,
        matchReasons,
      };
    });

    return res.status(200).json({
      message: "Students discovered successfully",
      data,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error discovering students:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const createJobPost = async (req, res) => {
  try {
    const isStudent = req.user?.role === "student";
    const isSuperAdmin = req.user?.role === "super-admin";

    if (!isStudent && !isSuperAdmin) {
      return res.status(403).json({ message: "Only students and super-admin can create job posts" });
    }

    if (isStudent && !ensureStudentRole(req, res)) {
      return;
    }

    const { title, location, description } = req.body;

    if (!title || !location || !description) {
      return res.status(400).json({
        message: "Missing required fields: title, location, description",
      });
    }

    if (isStudent) {
      const currentStudent = await Student.findById(req.user.id).select("verified").lean();
      if (!currentStudent) {
        return res.status(404).json({ message: "Student not found" });
      }

      if (!currentStudent.verified) {
        return res.status(403).json({ message: "Only verified students can create job posts" });
      }
    }

    const jobPost = await JobPost.create({
      author: req.user.id,
      authorModel: isStudent ? "Student" : "Admin",
      title: title.trim(),
      location: location.trim(),
      description: description.trim(),
    });

    return res.status(201).json({
      message: "Job post created successfully",
      data: jobPost,
    });
  } catch (error) {
    console.error("Error creating job post:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getJobFeed = async (req, res) => {
  try {
    if (!ensureStudentRole(req, res)) {
      return;
    }

    const { page, limit, skip } = parsePagination(req.query);
    const search = (req.query.search || req.query.q || "").trim();

    const currentStudent = await Student.findById(req.user.id).select("connections").lean();
    if (!currentStudent) {
      return res.status(404).json({ message: "Student not found" });
    }

    const currentStudentId = new mongoose.Types.ObjectId(req.user.id);
    const connectionIds = (currentStudent.connections || []).map(
      (connectionId) => new mongoose.Types.ObjectId(String(connectionId))
    );

    const match = {
      active: true,
      author: { $ne: currentStudentId },
    };

    if (search) {
      match.title = new RegExp(escapeRegex(search), "i");
    }

    const recentThreshold = new Date(Date.now() - 1000 * 60 * 60 * 24 * 14);

    const [jobs, total] = await Promise.all([
      JobPost.aggregate([
        { $match: match },
        {
          $addFields: {
            isStudentAuthor: {
              $eq: ["$authorModel", "Student"],
            },
            connectionScore: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$authorModel", "Student"] },
                    { $in: ["$author", connectionIds] },
                  ],
                },
                10,
                0,
              ],
            },
            recentScore: {
              $cond: [{ $gte: ["$createdAt", recentThreshold] }, 3, 0],
            },
            randomScore: {
              $multiply: [{ $rand: {} }, 1.5],
            },
          },
        },
        {
          $addFields: {
            relevanceScore: {
              $add: ["$connectionScore", "$recentScore", "$randomScore"],
            },
          },
        },
        { $sort: { relevanceScore: -1, createdAt: -1 } },
        {
          $lookup: {
            from: "students",
            localField: "author",
            foreignField: "_id",
            as: "studentAuthor",
          },
        },
        {
          $lookup: {
            from: "admins",
            localField: "author",
            foreignField: "_id",
            as: "adminAuthor",
          },
        },
        { $skip: skip },
        { $limit: limit },
        {
          $project: {
            title: 1,
            location: 1,
            description: 1,
            verified: 1,
            createdAt: 1,
            isConnection: {
              $and: [{ $eq: ["$authorModel", "Student"] }, { $in: ["$author", connectionIds] }],
            },
            authorModel: 1,
            author: {
              $cond: [
                { $eq: ["$authorModel", "Student"] },
                {
                  $let: {
                    vars: {
                      source: { $arrayElemAt: ["$studentAuthor", 0] },
                    },
                    in: {
                      _id: "$$source._id",
                      fullName: "$$source.fullName",
                      email: "$$source.email",
                      matricNo: "$$source.matricNo",
                      college: "$$source.college",
                      course: "$$source.course",
                      occupation: "$$source.occupation",
                      imgurl: "$$source.imgurl",
                    },
                  },
                },
                {
                  $let: {
                    vars: {
                      source: { $arrayElemAt: ["$adminAuthor", 0] },
                    },
                    in: {
                      _id: "$$source._id",
                      fullName: "$$source.fullName",
                      email: "$$source.email",
                      role: "$$source.role",
                    },
                  },
                },
              ],
            },
          },
        },
      ]),
      JobPost.countDocuments(match),
    ]);

    

    return res.status(200).json({
      message: "Job feed retrieved successfully",
      data: jobs,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching job feed:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getMyJobs = async (req, res) => {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const authorModel = req.user?.role === "student" ? "Student" : "Admin";

    const [jobs, total] = await Promise.all([
      JobPost.find({ author: req.user.id, authorModel })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      JobPost.countDocuments({ author: req.user.id, authorModel }),
    ]);

    return res.status(200).json({
      message: "Personal jobs retrieved successfully",
      data: jobs,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching personal jobs:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getAllJobs = async (req, res) => {
  try {
    if (!ensureSuperAdminRole(req, res)) {
      return;
    }

    const { page, limit, skip } = parsePagination(req.query);
    const search = (req.query.search || req.query.q || "").trim();

    const query = {};
    if (search) {
      query.title = new RegExp(escapeRegex(search), "i");
    }
    if (req.query.verified === "true") {
      query.verified = true;
    }
    if (req.query.verified === "false") {
      query.verified = false;
    }
    if (req.query.active === "true") {
      query.active = true;
    }
    if (req.query.active === "false") {
      query.active = false;
    }

    const [jobs, total] = await Promise.all([
      JobPost.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("author", "fullName email matricNo college course occupation imgurl role")
        .lean(),
      JobPost.countDocuments(query),
    ]);

    return res.status(200).json({
      message: "All jobs retrieved successfully",
      data: jobs,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching all jobs:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const verifyJobPost = async (req, res) => {
  try {
    if (!ensureAdminOrSuperAdminRole(req, res)) {
      return;
    }

    const { jobId } = req.params;
    const { verified = true } = req.body;

    const job = await JobPost.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: "Job post not found" });
    }

    const parsedVerified =
      typeof verified === "string" ? verified.toLowerCase() === "true" : Boolean(verified);

    job.verified = parsedVerified;
    job.verifiedBy = req.user.id;
    job.verifiedAt = new Date();
    await job.save();

    return res.status(200).json({
      message: `Job post ${job.verified ? "verified" : "unverified"} successfully`,
      data: job,
    });
  } catch (error) {
    console.error("Error verifying job post:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const updateJobPost = async (req, res) => {
  try {
    const { jobId } = req.params;
    const job = await JobPost.findById(jobId);

    if (!job) {
      return res.status(404).json({ message: "Job post not found" });
    }

    const isSuperAdmin = req.user?.role === "super-admin";
    const isOwner =
      String(job.author) === String(req.user.id) &&
      ((job.authorModel === "Student" && req.user?.role === "student") ||
        (job.authorModel === "Admin" && req.user?.role !== "student"));

    if (!isSuperAdmin && !isOwner) {
      return res.status(403).json({ message: "You are not authorized to update this job post" });
    }

    const updateData = {};
    const editableFields = ["title", "location", "description", "active"];

    for (const field of editableFields) {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        const value = typeof req.body[field] === "string" ? req.body[field].trim() : req.body[field];
        updateData[field] = value;
      }
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: "No updatable fields provided" });
    }

    if (updateData.title === "" || updateData.location === "" || updateData.description === "") {
      return res.status(400).json({ message: "title, location and description cannot be empty" });
    }

    const updatedJob = await JobPost.findByIdAndUpdate(
      jobId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).lean();

    return res.status(200).json({
      message: "Job post updated successfully",
      data: updatedJob,
    });
  } catch (error) {
    console.error("Error updating job post:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteJobPost = async (req, res) => {
  try {
    const { jobId } = req.params;
    const job = await JobPost.findById(jobId);

    if (!job) {
      return res.status(404).json({ message: "Job post not found" });
    }

    const isSuperAdmin = req.user?.role === "super-admin";
    const isOwner =
      String(job.author) === String(req.user.id) &&
      ((job.authorModel === "Student" && req.user?.role === "student") ||
        (job.authorModel === "Admin" && req.user?.role !== "student"));

    if (!isSuperAdmin && !isOwner) {
      return res.status(403).json({ message: "You are not authorized to delete this job post" });
    }

    await JobPost.deleteOne({ _id: jobId });

    return res.status(200).json({
      message: "Job post deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting job post:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getAllStudents = async (req, res) => {
  try {
    if (!ensureAdminOrSuperAdminRole(req, res)) {
      return;
    }

    const { page, limit, skip } = parsePagination(req.query);
    const search = (req.query.search || req.query.q || "").trim();

    const query = {};
    if (search) {
      query.$or = [
        { fullName: new RegExp(escapeRegex(search), "i") },
        { email: new RegExp(escapeRegex(search), "i") },
        { matricNo: new RegExp(escapeRegex(search), "i") },
        { college: new RegExp(escapeRegex(search), "i") },
        { course: new RegExp(escapeRegex(search), "i") },
      ];
    }

    const [students, total] = await Promise.all([
      Student.find(query)
        .select("-password -token -tokenExpiry -resetToken -resetTokenExpiry")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Student.countDocuments(query),
    ]);

    return res.status(200).json({
      message: "Students retrieved successfully",
      data: students,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching students:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
