import { Resend } from "resend";
import { listEnv } from "swiftenv";
import Admin from "../../models/Admin.js";
import Inquiry from "../../models/Inquiry.js";
import { inquiryNotificationTemplate, inquiryResponseTemplate } from "../../utils/emailTemplates.js";

const { RESEND_API_KEY } = listEnv();
const resend = new Resend(RESEND_API_KEY);

export const createInquiry = async (req, res) => {
  try {
    const { name, phone, email, message } = req.body;

    if (!name || !phone || !email || !message) {
      return res.status(400).json({
        message: "Missing required fields: name, phone, email, message",
      });
    }

    const inquiry = await Inquiry.create({
      name,
      phone,
      email,
      message,
    });

    const admins = await Admin.find(
      {
        role: { $in: ["admin", "super-admin"] },
      },
      { email: 1, fullName: 1 }
    ).lean();

    const recipientEmails = admins.map((admin) => admin.email).filter(Boolean);

    if (recipientEmails.length > 0) {
      const { error } = await resend.emails.send({
        from: "Bells University Alumni Association <noreply@notifications.bellsuniversityalumni.com>",
        to: recipientEmails,
        subject: "New Alumni Inquiry Received",
        html: inquiryNotificationTemplate({
          name,
          phone,
          email,
          message,
          submittedAt: inquiry.createdAt,
        }),
      });

      if (error) {
        console.error("Failed to send inquiry notification email:", error);
      }
    }

    return res.status(201).json({
      message: "Inquiry submitted successfully",
      data: inquiry,
    });
  } catch (error) {
    console.error("Error creating inquiry:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getInquiries = async (req, res) => {
  try {
    const inquiries = await Inquiry.find().sort({ createdAt: -1 }).lean();
    return res.status(200).json(inquiries);
  } catch (error) {
    console.error("Error fetching inquiries:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getInquiryById = async (req, res) => {
  try {
    const { inquiryId } = req.params;
    const inquiry = await Inquiry.findById(inquiryId).lean();

    if (!inquiry) {
      return res.status(404).json({ message: "Inquiry not found" });
    }

    return res.status(200).json(inquiry);
  } catch (error) {
    console.error("Error fetching inquiry:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const updateInquiryStatus = async (req, res) => {
  try {
    const { inquiryId } = req.params;
    const { status, response } = req.body;

    if (!status || !["new", "resolved"].includes(status) || !response) {
      return res.status(400).json({
        message: "Invalid status or response. Allowed status values are: new, read, resolved",
      });
    }

    const inquiry = await Inquiry.findByIdAndUpdate(
      inquiryId,
      { status, response },
      { new: true, runValidators: true }
    );

    if (!inquiry) {
      return res.status(404).json({ message: "Inquiry not found" });
    }

    if (status === "resolved") {
        const { error } = await resend.emails.send({
            from: "Bells University Alumni Association <noreply@notifications.bellsuniversityalumni.com>",
            to: inquiry.email,
            subject: "Response to Your Alumni Inquiry",
            html: inquiryResponseTemplate({
              name: inquiry.name,
              phone: inquiry.phone,
              email: inquiry.email,
              message: response,
            }),
          });
    
          if (error) {
            console.error("Failed to send inquiry response email:", error);
        }
    }

    return res.status(200).json({
      message: "Inquiry status updated successfully",
      data: inquiry,
    });
  } catch (error) {
    console.error("Error updating inquiry:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteInquiry = async (req, res) => {
  try {
    const { inquiryId } = req.params;
    const inquiry = await Inquiry.findByIdAndDelete(inquiryId);

    if (!inquiry) {
      return res.status(404).json({ message: "Inquiry not found" });
    }

    return res.status(200).json({ message: "Inquiry deleted successfully" });
  } catch (error) {
    console.error("Error deleting inquiry:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
