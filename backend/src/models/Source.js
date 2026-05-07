const mongoose = require('mongoose');

const SourceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    type: { type: String, enum: ['telegram', 'web'], required: true },
    target: { type: String, required: true },
    enabled: { type: Boolean, default: true },
    consecutive_failures: { type: Number, default: 0 },
    last_crawled_at: { type: Date, default: null },
    last_error: { type: String, default: '' },
  },
  { timestamps: true, versionKey: false }
);

module.exports = mongoose.model('Source', SourceSchema);
