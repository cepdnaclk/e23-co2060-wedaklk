import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { Types } from 'mongoose';
import connectDB from '@/lib/mongodb';
import Job from '@/models/Job';
import { parseCommissionOrderId } from '@/lib/utils/commission';

const merchant_id = process.env.NEXT_PUBLIC_PAYHERE_MERCHANT_ID || '1232971';
const merchant_secret = process.env.PAYHERE_MERCHANT_SECRET || 'MzYzMDc0NzgwMDE4NDU0MjY1NzA0MTI5OTQ5OTY5MzI0OTU2NzYxNw==';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const order_id = formData.get('order_id') as string;
    const payhere_amount = formData.get('payhere_amount') as string;
    const payhere_currency = formData.get('payhere_currency') as string;
    const status_code = formData.get('status_code') as string;
    const md5sig = formData.get('md5sig') as string;
    const payment_id = formData.get('payment_id') as string;

    console.log('Payment notification received for order:', order_id, 'Status:', status_code);

    // Verify payment signature
    const local_md5sig = crypto
      .createHash('md5')
      .update(
        merchant_id +
        order_id +
        payhere_amount +
        payhere_currency +
        status_code +
        crypto
          .createHash('md5')
          .update(merchant_secret)
          .digest('hex')
          .toUpperCase()
      )
      .digest('hex')
      .toUpperCase();

    if (local_md5sig !== md5sig) {
      console.error('Payment verification failed - hash mismatch for order:', order_id);
      return NextResponse.json({ status: 'failed', error: 'Invalid signature' }, { status: 400 });
    }

    // Check if payment was successful (status_code 2 = success)
    if (status_code === '2') {
      console.log('Payment successful for order:', order_id, 'Payment ID:', payment_id);

      // Check if this is a commission payment
      const commissionData = parseCommissionOrderId(order_id);

      if (commissionData) {
        // This is a commission payment - accept the bid
        const { bidId } = commissionData;

        try {
          await connectDB();

          // Find the bid to get the job ID
          const Bid = (await import('@/models/Bid')).default;
          const bid = await Bid.findById(bidId);

          if (!bid) {
            console.error('Bid not found for commission payment:', bidId);
            return NextResponse.json({
              status: 'error',
              error: 'Bid not found'
            }, { status: 404 });
          }

          const jobId = bid.jobId;

          // Update job status to accepted
          const job = await Job.findById(jobId);

          if (!job) {
            console.error('Job not found for bid:', bidId);
            return NextResponse.json({
              status: 'error',
              error: 'Job not found'
            }, { status: 404 });
          }

          if (job.status === 'open') {
            job.status = 'accepted';
            await job.save();
            console.log('Bid accepted and job status updated for job:', jobId.toString());
          } else {
            console.log('Job already in status:', job.status, '- skipping update');
          }

          return NextResponse.json({
            status: 'success',
            message: 'Commission payment processed and bid accepted'
          }, { status: 200 });

        } catch (error) {
          console.error('Error processing commission payment:', error);
          return NextResponse.json({
            status: 'error',
            error: 'Failed to process commission payment'
          }, { status: 500 });
        }
      } else {
        // Regular payment (not commission)
        console.log('Regular payment processed for order:', order_id);
        return NextResponse.json({ status: 'success' }, { status: 200 });
      }
    } else {
      // Payment failed or cancelled
      console.log('Payment not successful for order:', order_id, 'Status code:', status_code);
      return NextResponse.json({ status: 'failed' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error processing notification:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}