import websiteState from "../models/websiteState.js";



export const getWebsiteConfig = async (req, res) => {
  try {
    const configs = await websiteState.find({
      key: { $in: ['CONTACT', 'DESCRIPTION', 'GET_INVOLVED_TEXT', 'MEMBERS'] },
    }).lean().populate('updatedBy');

    const configMap = {};
    configs.forEach((config) => {
      configMap[config.key] = config.value;
    });

    return res.status(200).json({
      success: true,
      data: configMap,
    });
  } catch (error) {
    console.error('Error in getWebsiteConfig:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error fetching website config',
    });
  }
};

export const updateWebsiteConfig = async (req, res) => {
  try {
    const { key, value } = req.body;

    // Validation
    if (!key || !value) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: key, value',
      });
    }

    
    const config = await websiteState.findOneAndUpdate(
      { key },
      {
        value,
        updatedBy: req.user.id,
      },
      { new: true, upsert: true }
    );

    return res.status(200).json({
      success: true,
      message: 'Website configuration updated successfully',
      data: config,
    });
  } catch (error) {
    console.error('Error in updateWebsiteConfig:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error updating website config',
    });
  }
};