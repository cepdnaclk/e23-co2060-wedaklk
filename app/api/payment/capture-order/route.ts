import { NextRequest, NextResponse } from 'next/server';
import { captureOrder } from '@/lib/paypal';
import connectDB from '@/lib/mongodb';
import Job from '@/models/Job';
import { parseCommissionOrderId } from '@/lib/utils/commission';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderID, customId } = body;

    if (!orderID) {
      return NextResponse.json(
        { error: 'Missing PayPal order ID' },
        { status: 400 }
      );
    }

    console.log('Capturing PayPal order:', orderID);

    // Capture the PayPal payment
    const captureResult = await captureOrder(orderID);

    if (captureResult.status !== 'COMPLETED') {
      console.error('Payment not completed. Status:', captureResult.status);
      return NextResponse.json(
        { status: 'failed', error: 'Payment was not completed' },
        { status: 400 }
      );
    }

    console.log('Payment captured successfully. Capture ID:', captureResult.captureId);

    // Check if this is a commission payment
    const commissionData = customId ? parseCommissionOrderId(customId) : null;

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
            error: 'Bid not found',
          }, { status: 404 });
        }

        const jobId = bid.jobId;

        // Update job status to accepted
        const job = await Job.findById(jobId);

        if (!job) {
          console.error('Job not found for bid:', bidId);
          return NextResponse.json({
            status: 'error',
            error: 'Job not found',
          }, { status: 404 });
        }

        if (job.status === 'open') {
          job.status = 'accepted';
          job.acceptedBidId = bidId;
          await job.save();
          console.log('Bid accepted and job status updated for job:', jobId.toString());
        } else {
          console.log('Job already in status:', job.status, '- skipping update');
        }

        return NextResponse.json({
          status: 'success',
          message: 'Commission payment processed and bid accepted',
          captureId: captureResult.captureId,
        }, { status: 200 });

      } catch (error) {
        console.error('Error processing commission payment:', error);
        return NextResponse.json({
          status: 'error',
          error: 'Failed to process commission payment',
        }, { status: 500 });
      }
    } else {
      // Regular payment (not commission)
      console.log('Regular payment captured. Order:', orderID);
      return NextResponse.json({
        status: 'success',
        captureId: captureResult.captureId,
      }, { status: 200 });
    }
  } catch (error) {
    console.error('Error capturing payment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
