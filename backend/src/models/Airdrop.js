const mongoose = require('mongoose');

const AirdropSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    official_link: { type: String, required: true },
    end_date: { type: Date, default: null },
    trust_score: { type: Number, required: true, min: 0, max: 100 },
    reward: { type: String, default: '' },
    category: {
      type: String,
      enum: ['L2', 'DeFi', 'NFT', 'Bounty', 'Testnet', 'Meme', 'Other'],
      default: 'Other',
      index: true,
    },
    tags: { type: [String], default: [] },
    sources: { type: [String], default: [] },
    source_hash: { type: String, required: true, unique: true, index: true },
    raw_text: { type: String, default: '' },
    created_at: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

AirdropSchema.index({ trust_score: -1, created_at: -1 });
AirdropSchema.index({ end_date: 1 });
AirdropSchema.index({ title: 'text', description: 'text', tags: 'text' });

module.exports = mongoose.model('Airdrop', AirdropSchema);
