
import mongoose, { Document, Schema } from 'mongoose';

export interface IOtp extends Document {
    mobilePhone: string;
    otp: string;
    expiresAt: Date;
    isVerified: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const OtpSchema = new Schema<IOtp>({
    mobilePhone: {
        type: String,
        required: true,
        index: true // Add index for faster queries
    },
    otp: {
        type: String,
        required: true,
    },
    expiresAt: {
        type: Date,
        required: true,
        index: { expires: 0 } // Auto-delete documents after they expire
    },
    isVerified: {
        type: Boolean,
        default: false,
    }
}, {
    timestamps: true,
    collection: 'otps'
});

export default mongoose.models.Otp || mongoose.model<IOtp>('Otp', OtpSchema);
