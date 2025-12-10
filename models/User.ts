// ============================================
// FILE 1: models/User.ts
// MongoDB User Schema (TypeScript)
// ============================================

import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  firstName: string;
  lastName: string;
  email: string;
  mobilePhone: string;
  profession: string;
  province: string;
  district: string;
  address: string;
  password: string;
  kyc: {
    documentType: 'NIC' | 'Passport' | 'Driving License';
    documentFrontUrl: string;
    documentBackUrl: string;
    verified: boolean;
  };

  acceptedTerms: boolean;
  acceptedTermsDate: Date;
  isActive: boolean;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>({
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  mobilePhone: {
    type: String,
    required: [true, 'Mobile phone is required'],
    unique: true
  },
  profession: {
    type: String,
    required: [true, 'Profession is required']
  },
  province: {
    type: String,
    required: [true, 'Province is required']
  },
  district: {
    type: String,
    required: [true, 'District is required']
  },
  address: {
    type: String,
    required: [true, 'Address is required']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6
  },
  kyc: {
    documentType: {
      type: String,
      enum: ['NIC', 'Passport', 'Driving License'],
      required: true
    },
    documentFrontUrl: {
      type: String,
      required: true
    },
    documentBackUrl: {
      type: String,
      required: true
    },
    verified: {
      type: Boolean,
      default: false
    }
  },

  acceptedTerms: {
    type: Boolean,
    required: true,
    default: false
  },
  acceptedTermsDate: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  },
  emailVerified: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Removed duplicate index declarations
// The unique: true property already creates indexes for email and mobilePhone
// UserSchema.index({ email: 1 }); // REMOVED
// UserSchema.index({ mobilePhone: 1 }); // REMOVED

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);