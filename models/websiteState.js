import mongoose from 'mongoose';

const websiteStateSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      enum: ['CONTACT', 'DESCRIPTION', 'GET_INVOLVED_TEXT', 'MEMBERS'],
      unique: true,
      required: true,
      index: true,
    },
    value: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
    },
    
    version: {
      type: Number,
      default: 1,
    },
  },
  {
    timestamps: true,
  }
);

// Keep track of updates
websiteStateSchema.pre('save', function (next) {
  if (this.isModified('value')) {
    this.version = (this.version || 0) + 1;
  }
  next();
});

export default mongoose.model('WebsiteState', websiteStateSchema);
