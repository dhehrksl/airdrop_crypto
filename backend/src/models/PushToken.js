const mongoose = require('mongoose');

const PushTokenSchema = new mongoose.Schema(
  {
    token: { type: String, required: true, unique: true, index: true },
    platform: { type: String, enum: ['ios', 'android', 'web'], default: 'android' },
    enabled: { type: Boolean, default: true },
    min_trust_score: { type: Number, default: 95, min: 0, max: 100 },
    notify_deadline: { type: Boolean, default: true },
    categories: { type: [String], default: [] },
    last_seen_at: { type: Date, default: Date.now },
  },
  { timestamps: true, versionKey: false }
);

module.exports = mongoose.model('PushToken', PushTokenSchema);
