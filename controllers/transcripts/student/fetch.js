import Transcript from "../../../models/Transcript.js";

export const getAllTranscripts = async (req, res) => {
    try {
        const transcripts = await Transcript.find();
        return res.status(200).json({ message: "Transcripts retrieved successfully", data: transcripts });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

export const getAllPendingTranscripts = async (req, res) => {
    try {
        const transcripts = await Transcript.find({ status: "pending" });
        return res.status(200).json({ message: "Pending transcripts retrieved successfully", data: transcripts });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

export const getAllApprovedTranscripts = async (req, res) => {
    try {
        const transcripts = await Transcript.find({ status: "approved" });
        return res.status(200).json({ message: "Approved transcripts retrieved successfully", data: transcripts });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

export const getAllRejectedTranscripts = async (req, res) => {
    try {
        const transcripts = await Transcript.find({ status: "rejected" });
        return res.status(200).json({ message: "Rejected transcripts retrieved successfully", data: transcripts });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

export const getTranscriptByMatricNo = async (req, res) => {
    const { matricNo } = req.params;
    if (!matricNo) {
        return res.status(400).json({ message: "matricNo is required" });
    }
    try {
        const transcript = await Transcript.findOne({ matricNo });
        if (!transcript) {
            return res.status(404).json({ message: "Transcript not found" });
        }
        return res.status(200).json({ message: "Transcript retrieved successfully", data: transcript });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error" });
    }
}