import Newsletter from "../../models/Newsletter.js";

export const createNewsletter = async (req, res) => {
  try {
    const { headline, imgurl, date, content, excerpt } = req.body;

    if (!headline || !imgurl || !content || !excerpt) {
      return res.status(400).json({
        message: "Missing required fields: headline, imgurl, date, content, excerpt",
      });
    }


    const newsletter = await Newsletter.create({
      headline,
      imgurl,
      content,
      excerpt,
      createdBy: req.user.id,
    });

    return res.status(201).json({
      message: "Newsletter created successfully",
      data: newsletter,
    });
  } catch (error) {
    console.error("Error creating newsletter:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getNewsletters = async (req, res) => {
  try {
    const newsletters = await Newsletter.find()
      .sort({ date: -1, createdAt: -1 })
      .populate("createdBy", "fullName email role")
      .lean();

    return res.status(200).json(newsletters);
  } catch (error) {
    console.error("Error fetching newsletters:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getNewsletterById = async (req, res) => {
  try {
    const { newsletterId } = req.params;

    const newsletter = await Newsletter.findById(newsletterId)
      .populate("createdBy", "fullName email role")
      .lean();

    if (!newsletter) {
      return res.status(404).json({ message: "Newsletter not found" });
    }

    return res.status(200).json(newsletter);
  } catch (error) {
    console.error("Error fetching newsletter:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const updateNewsletter = async (req, res) => {
  try {
    const { newsletterId } = req.params;
    const { headline, imgurl, date, content, excerpt } = req.body;

    const updates = {};

    if (headline !== undefined) updates.headline = headline;
    if (imgurl !== undefined) updates.imgurl = imgurl;
    if (content !== undefined) updates.content = content;
    if (excerpt !== undefined) updates.excerpt = excerpt;

    if (date !== undefined) {
      const parsedDate = new Date(date);
      if (Number.isNaN(parsedDate.getTime())) {
        return res.status(400).json({ message: "Invalid date format" });
      }
      updates.date = parsedDate;
    }

    const newsletter = await Newsletter.findByIdAndUpdate(newsletterId, updates, {
      new: true,
      runValidators: true,
    });

    if (!newsletter) {
      return res.status(404).json({ message: "Newsletter not found" });
    }

    return res.status(200).json({
      message: "Newsletter updated successfully",
      data: newsletter,
    });
  } catch (error) {
    console.error("Error updating newsletter:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteNewsletter = async (req, res) => {
  try {
    const { newsletterId } = req.params;
    const newsletter = await Newsletter.findByIdAndDelete(newsletterId);

    if (!newsletter) {
      return res.status(404).json({ message: "Newsletter not found" });
    }

    return res.status(200).json({ message: "Newsletter deleted successfully" });
  } catch (error) {
    console.error("Error deleting newsletter:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
