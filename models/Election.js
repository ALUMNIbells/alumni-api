import mongoose from "mongoose";

const CandidateSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    imgurl: { type: String, default: "" },
    voteCount: { type: Number, default: 0 },
  },
  { _id: true, timestamps: true }
);

const PositionSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    candidates: [CandidateSchema],
  },
  { _id: true, timestamps: true }
);

const VoteSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    positionId: { type: mongoose.Schema.Types.ObjectId, required: true },
    candidateId: { type: mongoose.Schema.Types.ObjectId, required: true },
  },
  { timestamps: true }
);

const ResultCandidateSchema = new mongoose.Schema(
  {
    candidateId: { type: mongoose.Schema.Types.ObjectId, required: true },
    fullName: { type: String, required: true },
    imgurl: { type: String, default: "" },
    voteCount: { type: Number, default: 0 },
  },
  { _id: false }
);

const PositionResultSchema = new mongoose.Schema(
  {
    positionId: { type: mongoose.Schema.Types.ObjectId, required: true },
    title: { type: String, required: true },
    totalVotes: { type: Number, default: 0 },
    winner: { type: ResultCandidateSchema, default: null },
    candidates: [ResultCandidateSchema],
  },
  { _id: false }
);

const ElectionSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    session: { type: String, required: true, trim: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ["draft", "active", "ended", "published"],
      default: "draft",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
    },
    positions: [PositionSchema],
    votes: [VoteSchema],
    results: [PositionResultSchema],
    isPublished: { type: Boolean, default: false },
    publishedAt: { type: Date, default: null },
    collatedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

ElectionSchema.index({ session: 1, title: 1 });
ElectionSchema.index({ startDate: 1, endDate: 1 });

const Election = mongoose.model("Election", ElectionSchema);

export default Election;
