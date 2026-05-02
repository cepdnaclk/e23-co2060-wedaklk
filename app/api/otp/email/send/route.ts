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
                tls: {
                    rejectUnauthorized: false,
                },
            });

            const mailOptions = {
                from: `"wedak.lk" <${process.env.EMAIL_USER}>`,
                to: email,
                subject: 'Your Verification Code - wedak.lk',
                text: `Your OTP is: ${otp}. Valid for 5 minutes.`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #f9fafb; border-radius: 16px;">
                        <div style="text-align: center; margin-bottom: 24px;">
                            <h2 style="color: #1f2937; margin: 0;">wedak.lk</h2>
                        </div>
                        <div style="background: white; padding: 32px; border-radius: 12px; text-align: center; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                            <p style="color: #6b7280; font-size: 14px; margin-bottom: 8px;">Your verification code is</p>
                            <div style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #22c55e; margin: 16px 0; padding: 16px; background: #f0fdf4; border-radius: 8px;">${otp}</div>
                            <p style="color: #9ca3af; font-size: 12px; margin-top: 16px;">This code is valid for 5 minutes. Do not share it with anyone.</p>
                        </div>
                        <p style="color: #9ca3af; font-size: 11px; text-align: center; margin-top: 16px;">If you didn't request this code, please ignore this email.</p>
                    </div>
                `,
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
