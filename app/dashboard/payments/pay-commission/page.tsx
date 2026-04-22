'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, BadgeDollarSign, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { useState, useEffect, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import { calculateCommission, formatPaymentAmount, generateCommissionOrderId } from '@/lib/utils/commission';

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

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [bid, setBid] = useState<BidDetail | null>(null);
  const [commissionAmount, setCommissionAmount] = useState<number>(0);

  // Exchange rate state
  const [exchangeRate, setExchangeRate] = useState<number | null>(null);
  const [usdAmount, setUsdAmount] = useState<string>('0.00');
  const [rateLoading, setRateLoading] = useState(true);
  const [paymentProcessing, setPaymentProcessing] = useState(false);

  useEffect(() => {
    if (!jobId || !bidId) {
      setError('Missing job or bid information. Please try again from the job page.');
      setIsLoading(false);
      return;
    }

    fetchBidDetails();
    fetchExchangeRate();
  }, [jobId, bidId]);

  // Recalculate USD when commission or rate changes
  useEffect(() => {
    if (commissionAmount > 0 && exchangeRate) {
      const usd = commissionAmount / exchangeRate;
      setUsdAmount(usd.toFixed(2));
    }
  }, [commissionAmount, exchangeRate]);

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

  const fetchExchangeRate = async () => {
    try {
      setRateLoading(true);
      const response = await fetch('/api/payment/exchange-rate');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch exchange rate');
      }

      setExchangeRate(data.rate);
    } catch (err: any) {
      console.error('Failed to fetch exchange rate', err);
      // Use a fallback rate
      setExchangeRate(320);
    } finally {
      setRateLoading(false);
    }
  };

  const createPayPalOrder = async (): Promise<string> => {
    if (!bid) throw new Error('Bid not loaded');

    const orderId = generateCommissionOrderId(bidId);
    const amount = formatPaymentAmount(parseFloat(usdAmount));

    const response = await fetch('/api/payment/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        order_id: orderId,
        amount_usd: amount,
        description: `Commission for job acceptance (5% of Rs. ${bid.price.toLocaleString()})`,
        custom_id: orderId,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to create payment order');
    }

    return data.orderID;
  };

  const onPayPalApprove = async (data: { orderID: string }) => {
    try {
      setPaymentProcessing(true);
      setError(null);

      const orderId = generateCommissionOrderId(bidId);

      const response = await fetch('/api/payment/capture-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderID: data.orderID,
          customId: orderId,
        }),
      });

      const result = await response.json();

      if (response.ok && result.status === 'success') {
        // Redirect to success page
        router.push(`/payment/success?type=commission&jobId=${jobId}&bidId=${bidId}`);
      } else {
        throw new Error(result.error || 'Payment processing failed');
      }
    } catch (err: any) {
      console.error('Payment capture failed', err);
      setError(err.message || 'Payment processing failed. Please try again.');
      setPaymentProcessing(false);
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

  const paypalClientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || 'test';

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
              5% service commission for accepting this bid
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

            {/* Currency conversion display */}
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium mb-1">Currency conversion</p>
                  {rateLoading ? (
                    <p className="text-xs text-amber-600 flex items-center gap-1">
                      <Loader2 size={12} className="animate-spin" />
                      Fetching live exchange rate...
                    </p>
                  ) : (
                    <>
                      <p className="text-xs text-amber-600">
                        1 USD = Rs. {exchangeRate?.toFixed(2)} (live rate)
                      </p>
                      <p className="text-sm font-semibold mt-1">
                        Rs. {commissionAmount.toLocaleString()} = <span className="text-emerald-700">${usdAmount} USD</span>
                      </p>
                    </>
                  )}
                </div>
                <button
                  type="button"
                  onClick={fetchExchangeRate}
                  disabled={rateLoading}
                  className="p-2 rounded-lg hover:bg-amber-100 transition-colors disabled:opacity-50"
                  title="Refresh exchange rate"
                >
                  <RefreshCw size={16} className={rateLoading ? 'animate-spin' : ''} />
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
              <p className="font-medium mb-1">Bidder: {bid.bidder.name}</p>
              <p className="text-xs text-blue-600">{bid.message}</p>
            </div>

            <div className="text-xs text-slate-500 space-y-1">
              <p>• You will pay <span className="font-semibold">${usdAmount} USD</span> via PayPal</p>
              <p>• After successful payment, the bid will be automatically accepted</p>
              <p>• You will see bidder&apos;s details after successful payment</p>
            </div>

            {/* PayPal Buttons */}
            {paymentProcessing ? (
              <div className="w-full flex items-center justify-center gap-2 rounded-full bg-emerald-500 text-white py-3 text-sm font-semibold">
                <Loader2 size={16} className="animate-spin" />
                Processing payment...
              </div>
            ) : (
              <PayPalScriptProvider
                options={{
                  clientId: paypalClientId,
                  currency: 'USD',
                  intent: 'capture',
                }}
              >
                <PayPalButtons
                  style={{
                    color: 'gold',
                    shape: 'pill',
                    label: 'pay',
                    height: 48,
                  }}
                  disabled={!bid || !!error || rateLoading || !exchangeRate}
                  createOrder={async () => {
                    try {
                      return await createPayPalOrder();
                    } catch (err: any) {
                      setError(err.message || 'Failed to create order');
                      throw err;
                    }
                  }}
                  onApprove={async (data) => {
                    await onPayPalApprove(data);
                  }}
                  onCancel={() => {
                    router.push(`/payment/cancel?type=commission&jobId=${jobId}&bidId=${bidId}`);
                  }}
                  onError={(err) => {
                    console.error('PayPal error:', err);
                    setError('Payment failed. Please try again.');
                  }}
                />
              </PayPalScriptProvider>
            )}
          </div>
        )}
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
