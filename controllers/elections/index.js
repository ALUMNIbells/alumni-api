import Election from "../../models/Election.js";

const checkSuperAdmin = (req, res) => {
  if (!req.user || req.user.role !== "super-admin") {
    res.status(403).json({
      success: false,
      message: "Only the super-admin can perform this action",
    });
    return false;
  }

  return true;
};

const checkStudent = (req, res) => {
  if (!req.user || req.user.role !== "student") {
    res.status(403).json({
      success: false,
      message: "Only students can vote in the election",
    });
    return false;
  }

  return true;
};

const sanitizeElection = (election, isPrivateView = false) => {
  const safeElection = { ...(election.toObject ? election.toObject() : election) };

  if (!isPrivateView) {
    delete safeElection.votes;
    delete safeElection.results;
    delete safeElection.collatedAt;
    delete safeElection.isPublished;
    delete safeElection.publishedAt;
    delete safeElection.createdBy;

    safeElection.positions = (safeElection.positions || []).map((position) => ({
      ...position,
      candidates: (position.candidates || []).map((candidate) => ({
        _id: candidate._id,
        fullName: candidate.fullName,
        imgurl: candidate.imgurl,
      })),
    }));
  }

  return safeElection;
};

const isElectionOpen = (election) => {
  const now = Date.now();
  console.log("Current time:", new Date(now).toISOString());
  console.log("Election start time:", new Date(election.startDate).toISOString());
  console.log("Election end time:", new Date(election.endDate).toISOString());
  const startTime = new Date(election.startDate).getTime();
  const endTime = new Date(election.endDate).getTime();

  return now >= startTime && now <= endTime;
};

export const createElection = async (req, res) => {
  try {
    if (!checkSuperAdmin(req, res)) return;

    const { title, description, session, startDate, endDate } = req.body;

    if (!title || !session || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: title, session, startDate, endDate",
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid date format for startDate or endDate",
      });
    }

    if (start >= end) {
      return res.status(400).json({
        success: false,
        message: "Election endDate must be later than startDate",
      });
    }

    const election = await Election.create({
      title,
      description: description || "",
      session,
      startDate: start,
      endDate: end,
      createdBy: req.user.id,
      status: "draft",
    });

    return res.status(201).json({
      success: true,
      message: "Election created successfully",
      data: election,
    });
  } catch (error) {
    console.error("Error creating election:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create election",
    });
  }
};

export const getElections = async (req, res) => {
  try {
    const elections = await Election.find().sort({ startDate: -1 }).lean();
    const isPrivateView = Boolean(req.user && ["super-admin", "admin"].includes(req.user.role));

    const data = elections.map((election) => sanitizeElection(election, isPrivateView));

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Error fetching elections:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch elections",
    });
  }
};

export const getElectionById = async (req, res) => {
  try {
    const { electionId } = req.params;
    const election = await Election.findById(electionId);

    if (!election) {
      return res.status(404).json({
        success: false,
        message: "Election not found",
      });
    }

    const isPrivateView = Boolean(req.user && ["super-admin", "admin"].includes(req.user.role));

    return res.status(200).json({
      success: true,
      data: sanitizeElection(election, isPrivateView),
    });
  } catch (error) {
    console.error("Error fetching election:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch election",
    });
  }
};

export const editElection = async (req, res) => {
  try {
    if (!checkSuperAdmin(req, res)) return;

    const { electionId } = req.params;
    const { title, description, session, startDate, endDate } = req.body;

    const election = await Election.findById(electionId);

    if (!election) {
      return res.status(404).json({
        success: false,
        message: "Election not found",
      });
    }

    if (election.votes.length > 0) {
      return res.status(400).json({
        success: false,
        message: "You cannot edit an election after voting has started",
      });
    }

    if (title) election.title = title;
    if (description) election.description = description;
    if (session) election.session = session;
    if (startDate) election.startDate = new Date(startDate);
    if (endDate) election.endDate = new Date(endDate);

    await election.save();

    return res.status(200).json({
      success: true,
      message: "Election updated successfully",
      data: election,
    });
  } catch (error) {
    console.error("Error editing election:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to edit election",
    });
  }
};

export const addPositionToElection = async (req, res) => {
  try {
    if (!checkSuperAdmin(req, res)) return;

    const { electionId } = req.params;
    const { title, description } = req.body;

    if (!title) {
      return res.status(400).json({
        success: false,
        message: "Position title is required",
      });
    }

    const election = await Election.findById(electionId);

    if (!election) {
      return res.status(404).json({
        success: false,
        message: "Election not found",
      });
    }

    if (election.votes.length > 0) {
      return res.status(400).json({
        success: false,
        message: "You cannot add new positions after voting has started",
      });
    }

    election.positions.push({
      title,
      description: description || "",
      candidates: [],
    });

    await election.save();

    return res.status(201).json({
      success: true,
      message: "Position added successfully",
      data: election.positions[election.positions.length - 1],
    });
  } catch (error) {
    console.error("Error adding position:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to add position",
    });
  }
};

export const addCandidateToPosition = async (req, res) => {
  try {
    if (!checkSuperAdmin(req, res)) return;

    const { electionId, positionId } = req.params;
    const { fullName, imgurl } = req.body;

    if (!fullName) {
      return res.status(400).json({
        success: false,
        message: "Candidate fullName is required",
      });
    }

    const election = await Election.findById(electionId);

    if (!election) {
      return res.status(404).json({
        success: false,
        message: "Election not found",
      });
    }

    const position = election.positions.id(positionId);

    if (!position) {
      return res.status(404).json({
        success: false,
        message: "Position not found",
      });
    }

    if (election.votes.length > 0) {
      return res.status(400).json({
        success: false,
        message: "You cannot add candidates after voting has started",
      });
    }

    position.candidates.push({
      fullName,
      imgurl: imgurl || "",
    });

    await election.save();

    return res.status(201).json({
      success: true,
      message: "Candidate added successfully",
      data: position.candidates[position.candidates.length - 1],
    });
  } catch (error) {
    console.error("Error adding candidate:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to add candidate",
    });
  }
};

export const voteInElection = async (req, res) => {
  try {
    if (!checkStudent(req, res)) return;

    const { electionId } = req.params;
    const { positionId, candidateId } = req.body;

    if (!positionId || !candidateId) {
      return res.status(400).json({
        success: false,
        message: "positionId and candidateId are required",
      });
    }

    const election = await Election.findById(electionId);

    if (!election) {
      return res.status(404).json({
        success: false,
        message: "Election not found",
      });
    }

    if (isElectionOpen(election) === false) {
      return res.status(403).json({
        success: false,
        message: "Voting closed, Voting is only allowed within the election time frame",
      });
    }

    if (election.status === "published" || election.status === "ended") {
      return res.status(403).json({
        success: false,
        message: "Voting is closed for this election",
      });
    }

    const position = election.positions.id(positionId);
    if (!position) {
      return res.status(404).json({
        success: false,
        message: "Position not found",
      });
    }

    const candidate = position.candidates.id(candidateId);
    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: "Candidate not found for this position",
      });
    }

    const hasVotedForPosition = election.votes.some(
      (vote) =>
        String(vote.studentId) === String(req.user.id) &&
        String(vote.positionId) === String(positionId)
    );

    if (hasVotedForPosition) {
      return res.status(409).json({
        success: false,
        message: "You have already voted for this position",
      });
    }

    election.votes.push({
      studentId: req.user.id,
      positionId,
      candidateId,
    });

    election.status = "active";
    await election.save();

    return res.status(200).json({
      success: true,
      message: "Vote submitted successfully",
      data: {
        electionId,
        positionId,
        candidateId,
      },
    });
  } catch (error) {
    console.error("Error voting in election:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to submit vote",
    });
  }
};

export const collateElectionResults = async (req, res) => {
  try {
    if (!checkSuperAdmin(req, res)) return;

    const { electionId } = req.params;
    const election = await Election.findById(electionId);

    if (!election) {
      return res.status(404).json({
        success: false,
        message: "Election not found",
      });
    }

    const now = Date.now();
    const electionEnd = new Date(election.endDate).getTime();

    if (now < electionEnd) {
      return res.status(400).json({
        success: false,
        message: "Results can only be collated after the election has ended",
      });
    }

    const results = election.positions.map((position) => {
      const positionVotes = election.votes.filter(
        (vote) => String(vote.positionId) === String(position._id)
      );

      const candidateResults = position.candidates.map((candidate) => {
        const voteCount = positionVotes.filter(
          (vote) => String(vote.candidateId) === String(candidate._id)
        ).length;

        return {
          candidateId: candidate._id,
          fullName: candidate.fullName,
          imgurl: candidate.imgurl,
          voteCount,
        };
      });

      const sortedCandidates = [...candidateResults].sort((a, b) => b.voteCount - a.voteCount);
      const winner = sortedCandidates[0] || null;

      return {
        positionId: position._id,
        title: position.title,
        totalVotes: positionVotes.length,
        winner,
        candidates: sortedCandidates,
      };
    });

    election.results = results;
    election.collatedAt = new Date();
    election.status = "ended";
    election.isPublished = false;
    election.publishedAt = null;
    await election.save();

    return res.status(200).json({
      success: true,
      message: "Election results collated successfully",
      data: results,
    });
  } catch (error) {
    console.error("Error collating election results:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to collate election results",
    });
  }
};

export const publishElectionResults = async (req, res) => {
  try {
    if (!checkSuperAdmin(req, res)) return;

    const { electionId } = req.params;
    const election = await Election.findById(electionId);

    if (!election) {
      return res.status(404).json({
        success: false,
        message: "Election not found",
      });
    }

    if (!election.results || election.results.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Election results must be collated before publishing",
      });
    }

    election.isPublished = true;
    election.publishedAt = new Date();
    election.status = "published";
    await election.save();

    return res.status(200).json({
      success: true,
      message: "Election results published successfully",
      data: election.results,
    });
  } catch (error) {
    console.error("Error publishing election results:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to publish election results",
    });
  }
};

export const getElectionResults = async (req, res) => {
  try {
    const { electionId } = req.params;
    const election = await Election.findById(electionId);

    if (!election) {
      return res.status(404).json({
        success: false,
        message: "Election not found",
      });
    }

    const isSuperAdmin = req.user && req.user.role === "super-admin";
    const isPubliclyVisible = Boolean(election.isPublished);

    if (!isSuperAdmin && !isPubliclyVisible) {
      return res.status(403).json({
        success: false,
        message: "Election results are private until they are published",
      });
    }

    if(!election.results || election.results.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Election results not found, ensure to collate results first",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        electionId: election._id,
        title: election.title,
        session: election.session,
        isPublished: election.isPublished,
        collatedAt: election.collatedAt,
        results: election.results || [],
      },
    });
  } catch (error) {
    console.error("Error fetching election results:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch election results",
    });
  }
};
