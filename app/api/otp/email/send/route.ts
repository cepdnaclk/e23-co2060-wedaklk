import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import EmailOtp from '@/models/EmailOtp';
import nodemailer from 'nodemailer';

// Helper to generate 6 digit OTP
function generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req: NextRequest) {
    try {
        const { email } = await req.json();

        if (!email) {
            return NextResponse.json(
                { error: 'Email is required' },
                { status: 400 }
            );
        }

        const otp = generateOTP();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes expiry

        await connectDB();

        // Store or Update OTP in DB
        await EmailOtp.findOneAndUpdate(
            { email: email.toLowerCase() },
            {
                otp,
                expiresAt,
                isVerified: false
            },
            { upsert: true, new: true }
        );

        if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
            // Send Email via Nodemailer
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS,
                },
            });

            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: email,
                subject: 'Your Verification Code',
                text: `Your OTP is: ${otp}. Valid for 5 minutes.`,
                html: `<p>Your OTP is: <strong>${otp}</strong>. Valid for 5 minutes.</p>`,
            };

            // We try to send the email, but if it fails we catch it.
            try {
                await transporter.sendMail(mailOptions);
                return NextResponse.json({ message: 'OTP sent successfully' });
            } catch (emailError: any) {
                console.error('Nodemailer Error:', emailError);
                return NextResponse.json({ error: 'Failed to send email. Please check configuration.' }, { status: 500 });
            }
        } else {
            console.log(`[LOCAL TEST] OTP for ${email} is ${otp}`);
            return NextResponse.json({ message: 'OTP logged to console (Test Mode)' });
        }

    } catch (error) {
        console.error('Email OTP Send Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
