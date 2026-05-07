const mongoose = require('mongoose');

const NotificationLogSchema = new mongoose.Schema(
  {
    airdrop_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Airdrop', required: true },
    kind: { type: String, enum: ['high_trust', 'deadline'], required: true },
    sent_at: { type: Date, default: Date.now },
    sent_count: { type: Number, default: 0 },
  },
  { versionKey: false }
);

NotificationLogSchema.index({ airdrop_id: 1, kind: 1 }, { unique: true });

module.exports = mongoose.model('NotificationLog', NotificationLogSchema);
