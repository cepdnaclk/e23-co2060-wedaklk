// ============================================
// FILE: app/api/auth/reset-password/route.ts
// Password Reset with Email OTP Verification
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import EmailOtp from '@/models/EmailOtp';
import VerifiedUser from '@/models/VerifiedUser';
import UnverifiedUser from '@/models/UnverifiedUser';
import { hashPassword } from '@/lib/auth';

export async function POST(req: NextRequest) {
    try {
        const { email, otp, newPassword } = await req.json();

        // Validate inputs
        if (!email || !otp || !newPassword) {
            return NextResponse.json(
                { error: 'Email, OTP, and new password are required' },
                { status: 400 }
            );
        }

        // Validate password strength
        if (newPassword.length < 6) {
            return NextResponse.json(
                { error: 'Password must be at least 6 characters' },
                { status: 400 }
            );
        }

        await connectDB();

        // Step 1: Verify the OTP
        const otpRecord = await EmailOtp.findOne({ email: email.toLowerCase() });

        if (!otpRecord) {
            return NextResponse.json(
                { error: 'No OTP found for this email. Please request a new one.' },
                { status: 404 }
            );
        }

        if (new Date() > otpRecord.expiresAt) {
            return NextResponse.json(
                { error: 'OTP has expired. Please request a new one.' },
                { status: 400 }
            );
        }

        if (otpRecord.otp !== otp) {
            return NextResponse.json(
                { error: 'Invalid OTP' },
                { status: 400 }
            );
        }

        // Step 2: Find user in VerifiedUser or UnverifiedUser
        let user = await VerifiedUser.findOne({ email: email.toLowerCase() });
        let userCollection = 'verified';

        if (!user) {
            user = await UnverifiedUser.findOne({ email: email.toLowerCase() });
            userCollection = 'unverified';
        }

        if (!user) {
            return NextResponse.json(
                { error: 'No account found with this email address' },
                { status: 404 }
            );
        }

        // Step 3: Hash new password and update
        const hashedPassword = await hashPassword(newPassword);
        user.password = hashedPassword;
        await user.save();

        // Step 4: Clean up — delete the used OTP record
        await EmailOtp.deleteOne({ _id: otpRecord._id });

        return NextResponse.json({
            message: 'Password reset successfully. You can now login with your new password.'
        });

    } catch (error) {
        console.error('Password Reset Error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
