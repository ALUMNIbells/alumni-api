import mongoose from "mongoose";

const courseSchema = new mongoose.Schema({
    code: {type : String, required: true},
    title: { type: String, required: true },     
    units: { type: Number, required: true },     
    score: { type: Number },                     
    grade: { type: String, required: true },
},
{ _id: false }
)

const semesterSchema = new mongoose.Schema({
    session: { type: String, required: true },
    semester: { type: String, required: true, enum: ["FIRST", "SECOND"] },
    courses: { type: [courseSchema], default: [] },
    totalCreditOffered: { type: Number, required: true },
    totalCreditPassed: { type: Number, required: true },
    semesterGPA: { type: Number, required: true },
    level: { type: Number },

    // optional running totals (after this semester)
    cumulativeCreditOffered: { type: Number },
    cumulativeCreditPassed: { type: Number },
    cgpa: { type: Number }, 
},
{ _id: false }
)

const TranscriptSchema = new mongoose.Schema(
  {
    matricNo: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    degreeProgramme: { type: String, required: true },
    department: { type: String, required: true },
    college: { type: String, required: true },
    semesters: { type: [semesterSchema], default: [] },
    transcriptUrl: { type: String },
  },
  { timestamps: true }
);

const Transcript = mongoose.model("Transcript", TranscriptSchema);
export default Transcript;