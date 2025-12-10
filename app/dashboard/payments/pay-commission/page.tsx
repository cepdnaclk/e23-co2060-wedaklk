'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, BadgeDollarSign, Loader2, AlertCircle } from 'lucide-react';
import { useState, useEffect, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { PayHereService } from '@/lib/payhere';
import { calculateCommission, formatPayHereAmount, generateCommissionOrderId } from '@/lib/utils/commission';

interface BidDetail {
  _id: string;
  jobId: string;
  price: number;
  message: string;
  createdAt: string;
  bidder: {
    userId: string;
    name: string;
    email: string;
    phone: string;
  };
}

function PayCommissionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const jobId = searchParams?.get('jobId') || '';
  const bidId = searchParams?.get('bidId') || '';

  const [isPaying, setIsPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [bid, setBid] = useState<BidDetail | null>(null);
  const [commissionAmount, setCommissionAmount] = useState<number>(0);

  useEffect(() => {
    if (!jobId || !bidId) {
      setError('Missing job or bid information. Please try again from the job page.');
      setIsLoading(false);
      return;
    }

    fetchBidDetails();
  }, [jobId, bidId]);

  const fetchBidDetails = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/bids?jobId=${jobId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch bid details');
      }

      const foundBid = data.bids.find((b: BidDetail) => b._id === bidId);
      if (!foundBid) {
        throw new Error('Bid not found');
      }

      setBid(foundBid);
      const commission = calculateCommission(foundBid.price);
      setCommissionAmount(commission);
    } catch (err: any) {
      console.error('Failed to fetch bid details', err);
      setError(err.message || 'Unable to load bid details. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePayCommission = async () => {
    if (!bid || !session?.user) {
      setError('Missing required information. Please try again.');
      return;
    }

    try {
      setIsPaying(true);
      setError(null);

      const orderId = generateCommissionOrderId(bidId);
      const amount = formatPayHereAmount(commissionAmount);
      const currency = 'LKR';

      // Get payment hash from backend
      const hashResponse = await fetch('/api/payment/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: orderId,
          amount: amount,
          currency: currency,
          items: `Commission for job acceptance (10% of Rs. ${bid.price.toLocaleString()})`,
        }),
      });

      const hashData = await hashResponse.json();
      if (!hashResponse.ok) {
        throw new Error(hashData.error || 'Failed to generate payment hash');
      }

      const user = session.user as any;
      const firstName = user.firstName || user.name?.split(' ')[0] || 'User';
      const lastName = user.lastName || user.name?.split(' ').slice(1).join(' ') || '';

      // Configure PayHere payment
      const paymentConfig = {
        sandbox: true,
        merchant_id: hashData.merchant_id,
        return_url: `${window.location.origin}/payment/success?type=commission&jobId=${jobId}&bidId=${bidId}`,
        cancel_url: `${window.location.origin}/payment/cancel?type=commission&jobId=${jobId}&bidId=${bidId}`,
        notify_url: `${window.location.origin}/api/payment/notify`,
        order_id: orderId,
        items: `Commission Payment - Job Acceptance`,
        amount: amount,
        currency: currency,
        first_name: firstName,
        last_name: lastName,
        email: user.email || '',
        phone: user.mobilePhone || '',
        address: 'N/A',
        city: 'Colombo',
        country: 'Sri Lanka',
        hash: hashData.hash,
      };

      console.log('Initiating PayHere payment with config:', { ...paymentConfig, hash: '[REDACTED]' });

      // Trigger PayHere payment modal
      await PayHereService.initiatePayment(paymentConfig);
    } catch (err: any) {
      console.error('Failed to initiate payment', err);
      setError(err.message || 'Unable to start payment. Please try again.');
      setIsPaying(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center gap-4">
          <Link
            href={jobId ? `/dashboard/jobs/${jobId}` : '/dashboard/jobs'}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft size={20} className="text-gray-600" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Pay commission</h1>
            <p className="text-sm text-slate-500 mt-1">
              Loading payment details...
            </p>
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-12 text-center">
          <Loader2 className="mx-auto animate-spin text-emerald-500" size={32} />
          <p className="mt-3 text-sm text-slate-500">Loading bid details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Link
          href={jobId ? `/dashboard/jobs/${jobId}` : '/dashboard/jobs'}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft size={20} className="text-gray-600" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Pay commission</h1>
          <p className="text-sm text-slate-500 mt-1">
            Complete the commission payment to accept this bid
          </p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-6 space-y-6 max-w-xl">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-200">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
            <BadgeDollarSign size={24} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Commission payment</h2>
            <p className="text-sm text-slate-500">
              10% service commission for accepting this bid
            </p>
          </div>
        </div>

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 flex items-start gap-2">
            <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {bid && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Bid amount:</span>
                <span className="text-lg font-semibold text-slate-900">
                  Rs. {bid.price.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Commission (5%):</span>
                <span className="text-lg font-semibold text-emerald-600">
                  Rs. {commissionAmount.toLocaleString()}
                </span>
              </div>
              <div className="pt-3 border-t border-slate-300">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-slate-700">Total to pay:</span>
                  <span className="text-xl font-bold text-slate-900">
                    Rs. {commissionAmount.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
              <p className="font-medium mb-1">Bidder: {bid.bidder.name}</p>
              <p className="text-xs text-blue-600">{bid.message}</p>
            </div>

            <div className="text-xs text-slate-500 space-y-1">
              <p>• You will be redirected to PayHere payment gateway</p>
              <p>• After successful payment, the bid will be automatically accepted</p>
              <p>• You will see bidder's details after successful payment</p>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={handlePayCommission}
          disabled={isPaying || !bid || !!error}
          className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-emerald-500 text-white py-3 text-sm font-semibold hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPaying ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Opening payment gateway...
            </>
          ) : (
            <>
              <BadgeDollarSign size={16} />
              Pay Rs. {commissionAmount.toLocaleString()} & Accept Bid
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default function PayCommissionPage() {
  return (
    <Suspense fallback={
      <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center">
        <Loader2 className="mx-auto animate-spin text-emerald-500" size={32} />
        <p className="mt-3 text-sm text-slate-500">Loading payment details…</p>
      </div>
    }>
      <PayCommissionContent />
    </Suspense>
  );
}

