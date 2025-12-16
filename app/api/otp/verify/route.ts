
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Otp from '@/models/Otp';

export async function POST(req: NextRequest) {
    try {
        const { mobilePhone, otp } = await req.json();

        if (!mobilePhone || !otp) {
            return NextResponse.json(
                { error: 'Mobile phone and OTP are required' },
                { status: 400 }
            );
        }

        let normalizedPhone = mobilePhone.replace(/\D/g, '');
        if (normalizedPhone.startsWith('0')) {
            normalizedPhone = '94' + normalizedPhone.substring(1);
        }
        if (normalizedPhone.length === 9) {
            normalizedPhone = '94' + normalizedPhone;
        }

        await connectDB();

        const otpRecord = await Otp.findOne({ mobilePhone: normalizedPhone });

        if (!otpRecord) {
            return NextResponse.json(
                { error: 'OTP not found or expired' },
                { status: 400 }
            );
        }

        if (otpRecord.otp !== otp) {
            return NextResponse.json(
                { error: 'Invalid OTP' },
                { status: 400 }
            );
        }

        if (new Date() > otpRecord.expiresAt) {
            return NextResponse.json(
                { error: 'OTP has expired' },
                { status: 400 }
            );
        }

        // Mark as verified
        otpRecord.isVerified = true;
        await otpRecord.save();

        return NextResponse.json({ message: 'OTP verified successfully' });

    } catch (error) {
        console.error('OTP Verify Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
