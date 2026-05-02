import mongoose, { Document, Schema } from 'mongoose';

export interface IEmailOtp extends Document {
    email: string;
    otp: string;
    expiresAt: Date;
    isVerified: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const EmailOtpSchema = new Schema<IEmailOtp>({
    email: {
        type: String,
        required: true,
        index: true
    },
    otp: {
        type: String,
        required: true,
    },
    expiresAt: {
        type: Date,
        required: true,
        index: { expires: 0 }
    },
    isVerified: {
        type: Boolean,
        default: false,
    }
}, {
    timestamps: true,
    collection: 'email_otps'
});

export default mongoose.models.EmailOtp || mongoose.model<IEmailOtp>('EmailOtp', EmailOtpSchema);
