
import cloudinary from "../../utils/cloudinary.js";
import streamifier from "streamifier";
import Student from "../../models/Student.js";
import Transaction from "../../models/Transaction.js";
import Transcript from "../../models/Transcript.js";
import { generateTranscriptPdfBuffer } from "../../utils/generatePdfBuffer.js";
import { listEnv } from "swiftenv";
import { Resend } from "resend";

const {RESEND_API_KEY} = listEnv();
const resend = new Resend(RESEND_API_KEY); 

export const upsertFullTranscript = async (req, res) => {
  const { matricNo } = req.params;
  const { semesters } = req.body;
  const student  = await Student.findOne({ matricNo }); 
  if (!student) {
    return res.status(404).json({ message: "Student not found" });
  }

  if (!matricNo) {
    return res.status(400).json({ message: "matricNo, name, degreeProgramme, department, college are required" });
  }

  if (!Array.isArray(semesters) || semesters.length === 0) {
    return res.status(400).json({ message: "semesters must be a non-empty array" });
  }

  // Light validation for each semester
  for (const sem of semesters) {
    if (!sem.session || !sem.semester || !Array.isArray(sem.courses) || sem.courses.length === 0) {
      return res.status(400).json({ message: "Each semester must have session, semester, and non-empty courses" });
    }
    if (sem.totalCreditOffered === undefined || sem.totalCreditPassed === undefined || sem.semesterGPA === undefined) {
      return res.status(400).json({ message: "Each semester must include totalCreditOffered, totalCreditPassed, semesterGPA" });
    }
  }

  // prevent duplicates in the array itself
  const seen = new Set();
  for (const sem of semesters) {
    const key = `${sem.session}-${sem.semester}`;
    if (seen.has(key)) {
      return res.status(400).json({ message: `Duplicate semester detected: ${key}` });
    }
    seen.add(key);
  }

  try {
    const doc = await Transcript.findOneAndUpdate(
      { matricNo },
      {
        $set: {
          matricNo,
          name: student.fullName,
          degreeProgramme: student.course,
          department: student.course,
          college: student.college,
          semesters,
        },
      },
      { new: true, upsert: true }
    );

    return res.status(200).json({ message: "Transcript saved successfully", data: doc });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const requestTranscript = async (req, res) => {
    const { matricNo } = req.params;
    if (!matricNo) {
      return res.status(400).json({ message: "matricNo is required" });
    }
    try {
        const transaction = await Transaction.findOne({ matricNo, type: 'STUDENT TRANSCRIPT', status: 'completed' });
        if (!transaction) {
            return res.status(400).json({ message: "No completed transcript payment found for this matricNo, please pay for transcript" });
        }

        const transcript = await Transcript.findOne({ matricNo });
        if (!transcript) {
            return res.status(404).json({ message: "Transcript not found, please contact support" });
        }
        console.log(transcript)

        const pdfBuffer = await generateTranscriptPdfBuffer(transcript);
        
        // Upload to Cloudinary
        const upload = await new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            {
              resource_type: "raw",
              folder: "receipts",
              public_id: `${transcript.matricNo}-student-transcript.pdf`,
            },
            (error, result) => {
              if (error) return reject(error);
              resolve(result);
            }
          );
          streamifier.createReadStream(pdfBuffer).pipe(stream);
        });

        transcript.transcriptUrl = upload.secure_url;

        await transcript.save();

        const { data, error } = await resend.emails.send({
            from: 'Bells University Alumni Association <noreply@notifications.bellsuniversityalumni.com>',
            to: 'victorexpounder@gmail.com',
            subject: 'Student Transcript',
            html: `<p>Dear ${transcript.name},</p>
            <p>Your student transcript is ready. If you can't find it attached to this email, You can download it using the link below:</p>
            <a href="${upload.secure_url}" target="_blank">Download Transcript</a>
            <p>If you have any questions, please contact support.</p>
            <p>Best regards,<br>Bells University Alumni Association</p>
            <p><a href="https://bellsuniversityalumni.com">https://bellsuniversityalumni.com</a></p>`,
            attachments: [
              {
                filename: `${transcript.matricNo}-student-transcript.pdf`,
                content: pdfBuffer,
                contentType: 'application/pdf'
              }
            ]
        });
  
        if (error) {
            return console.error({ error });
        }
  
        console.log({ data });

        return res.status(200).json({ message: "Transcript generated successfully", transcriptUrl: upload.secure_url });

        

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error" });
    }
}
