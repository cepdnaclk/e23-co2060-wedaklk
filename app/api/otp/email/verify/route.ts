import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import EmailOtp from '@/models/EmailOtp';

export async function POST(req: NextRequest) {
    try {
        const { email, otp } = await req.json();

        if (!email || !otp) {
            return NextResponse.json(
                { error: 'Email and OTP are required' },
                { status: 400 }
            );
        }

        await connectDB();

        const record = await EmailOtp.findOne({ email: email.toLowerCase() });

        if (!record) {
            return NextResponse.json({ error: 'No OTP found for this email' }, { status: 404 });
        }

        if (record.isVerified) {
            return NextResponse.json({ error: 'Email is already verified' }, { status: 400 });
        }

        if (new Date() > record.expiresAt) {
            return NextResponse.json({ error: 'OTP has expired' }, { status: 400 });
        }

        if (record.otp !== otp) {
            return NextResponse.json({ error: 'Invalid OTP' }, { status: 400 });
        }

        // Mark as verified
        record.isVerified = true;
        await record.save();

        return NextResponse.json({ message: 'Email verified successfully' });

    } catch (error) {
        console.error('Email OTP Verify Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
