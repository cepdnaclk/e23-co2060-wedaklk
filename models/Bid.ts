// ============================================
// FILE: models/Bid.ts
// MongoDB Bid Schema (TypeScript)
// ============================================

import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IBid extends Document {
  jobId: Types.ObjectId;
  bidder: {
    userId: Types.ObjectId;
    name: string;
    email: string;
    phone: string;
    nicNumber?: string;
  };
  price: number;
  message: string;
  createdAt: Date;
}

const BidSchema = new Schema<IBid>({
  jobId: {
    type: Schema.Types.ObjectId,
    ref: 'Job',
    required: true,
  },
  bidder: {
    userId: { type: Schema.Types.ObjectId, required: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    nicNumber: { type: String, trim: true },
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000,
  },
}, {
  timestamps: { createdAt: true, updatedAt: false },
});

BidSchema.index({ jobId: 1, 'bidder.userId': 1 }, { unique: true });

export default mongoose.models.Bid || mongoose.model<IBid>('Bid', BidSchema);
