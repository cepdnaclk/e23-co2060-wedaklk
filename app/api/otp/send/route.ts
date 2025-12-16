
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Otp from '@/models/Otp';

const TEXTLK_API_URL = 'https://app.text.lk/api/v3/sms/send';

// Helper to generate 6 digit OTP
function generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req: NextRequest) {
    try {
        const { mobilePhone } = await req.json();

        if (!mobilePhone) {
            return NextResponse.json(
                { error: 'Mobile phone number is required' },
                { status: 400 }
            );
        }

        // Basic phone validation (Sri Lanka context)
        // Assuming format 07xxxxxxxx or 947xxxxxxxx
        // Text.lk wants number like 947xxxxxxxx, so we might need to normalize
        let normalizedPhone = mobilePhone.replace(/\D/g, ''); // Remove non-digits
        if (normalizedPhone.startsWith('0')) {
            normalizedPhone = '94' + normalizedPhone.substring(1);
        }
        // If it doesn't start with 94 and is 9 digits (e.g. 71xxxxxxx), append 94
        if (normalizedPhone.length === 9) {
            normalizedPhone = '94' + normalizedPhone;
        }

        const otp = generateOTP();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes expiry

        await connectDB();

        // Store or Update OTP in DB
        // We update if exists to prevent spamming new IDs for same phone
        await Otp.findOneAndUpdate(
            { mobilePhone: normalizedPhone },
            {
                otp,
                expiresAt,
                isVerified: false
            },
            { upsert: true, new: true }
        );

        // Send SMS via Text.lk
        const apiToken = process.env.TEXTLK_API_TOKEN;
        const senderId = process.env.TEXTLK_SENDER_ID || 'TextLKDemo'; // Default if not set, though unlikely to work without registration

        if (!apiToken) {
            console.error('TEXTLK_API_TOKEN is not defined');
            return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
        }

        const payload = {
            recipient: normalizedPhone,
            sender_id: senderId,
            type: 'plain',
            message: `Your OTP is: ${otp}. Valid for 5 minutes.`
        };

        const response = await fetch(TEXTLK_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiToken}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (data.status === 'success') {
            return NextResponse.json({ message: 'OTP sent successfully' });
        } else {
            console.error('Text.lk API Error:', data);
            return NextResponse.json({ error: 'Failed to send SMS', details: data.message }, { status: 500 });
        }

    } catch (error) {
        console.error('OTP Send Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
