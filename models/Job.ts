// ============================================
// FILE: models/Job.ts
// MongoDB Job Schema (TypeScript)
// ============================================

import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IJob extends Document {
  title: string;
  description: string;
  category: string;
  priceRange: {
    min: number;
    max: number;
  };
  location: {
    type: 'Point';
    coordinates: [number, number];
  };
  address?: string;
  radius: number;
  photos: string[];
  createdBy: {
    userId: Types.ObjectId;
    name: string;
    email: string;
    phone: string;
    nicNumber?: string;
  };
  status: 'open' | 'accepted' | 'completed';
  createdAt: Date;
  updatedAt: Date;
}

const JobSchema = new Schema<IJob>({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 120,
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 3000,
  },
  category: {
    type: String,
    required: true,
    trim: true,
  },
  priceRange: {
    min: { type: Number, required: true, min: 0 },
    max: { type: Number, required: true, min: 0 },
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: true,
      default: 'Point',
    },
    coordinates: {
      type: [Number],
      required: true,
      validate: {
        validator: (coords: number[]) => coords.length === 2,
        message: 'Location must contain latitude and longitude',
      },
    },
  },
  address: {
    type: String,
    trim: true,
  },
  radius: {
    type: Number,
    required: true,
    default: 10, // kilometers
  },
  photos: {
    type: [String],
    default: [],
  },
  createdBy: {
    userId: { type: Schema.Types.ObjectId, required: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    nicNumber: { type: String, trim: true },
  },
  status: {
    type: String,
    enum: ['open', 'accepted', 'completed'],
    default: 'open',
  },
}, {
  timestamps: true,
});

JobSchema.index({ location: '2dsphere' });
JobSchema.index({ category: 1, status: 1 });
JobSchema.index({ 'createdBy.userId': 1 });

export default mongoose.models.Job || mongoose.model<IJob>('Job', JobSchema);
