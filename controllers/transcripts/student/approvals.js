import { listEnv } from "swiftenv";
import Transcript from "../../../models/Transcript.js";
import { generateTranscriptPdfBuffer } from "../../../utils/generatePdfBuffer.js";
import { Resend } from "resend";
import { uploadFile } from "../../../utils/upload.js";
import Student from "../../../models/Student.js";

const {RESEND_API_KEY} = listEnv();
const resend = new Resend(RESEND_API_KEY); 

export const approveTranscript = async (req, res) => {
    const { id } = req.params;
    if(req.user.role !== "registrar-admin"){
      return res.status(403).json({ message: "Forbidden: You do not have permission to perform this action" });
    }
    if (!id) {
      return res.status(400).json({ message: "Transcript ID is required" });
    }
    
    try {
        const transcript = await Transcript.findById(id);
        if (!transcript) {
          return res.status(404).json({ message: "Transcript not found" });
        }
        if (transcript.status === "approved") {
          return res.status(400).json({ message: "Transcript is already approved", transcriptUrl: transcript.transcriptUrl });
        }
        const student = await Student.findOne({ matricNo: transcript.matricNo });
        console.log(student.email);
        if (!student) {
          return res.status(404).json({ message: "Student not found, please contact support" });
        }
         const pdfBuffer = await generateTranscriptPdfBuffer(transcript);
         const transcriptUrl = await uploadFile(
          "student-transcripts",
          `${transcript.matricNo}-student-transcript.pdf`, 
           pdfBuffer);
        transcript.transcriptUrl = transcriptUrl.secure_url;
        transcript.status = "approved";
        await transcript.save();

        const { data, error } = await resend.emails.send({
            from: 'Bells University Alumni Association <noreply@notifications.bellsuniversityalumni.com>',
            to: student.email,
            subject: 'Student Transcript Approved',
            html: `<p>Dear ${transcript.name},</p>
            <p>Your student transcript request has been approved. You can download your transcript attached or access it by clicking the link below:</p>
            <a href="${transcriptUrl.secure_url}" target="_blank">Download Transcript</a>
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

        return res.status(200).json({ message: "Transcript approved successfully", transcriptUrl: transcriptUrl.secure_url });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error" });
     }
};

export const rejectTranscript = async (req, res) => {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ message: "Transcript ID is required" });
    }
    try {
        const transcript = await Transcript.findById(id);
        if (!transcript) {
          return res.status(404).json({ message: "Transcript not found" }); 
        }
        if (transcript.status === "rejected") {
          return res.status(400).json({ message: "Transcript is already rejected" });
        }
        if (transcript.status === "approved") {
          return res.status(400).json({ message: "Transcript is already approved and cannot be rejected" });
        }
        transcript.status = "rejected";
        await transcript.save();
        return res.status(200).json({ message: "Transcript rejected successfully" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

