'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, BadgeDollarSign, Loader2, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';

export default function PayCommissionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const jobId = searchParams?.get('jobId') || '';
  const bidId = searchParams?.get('bidId') || '';

  const [isPaying, setIsPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCompletePayment = async () => {
    if (!jobId || !bidId) {
      setError('Missing job or bid information.');
      return;
    }

    try {
      setIsPaying(true);
      setError(null);

      const response = await fetch('/api/bids/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId, bidId }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to accept bid');
      }

      router.push(`/dashboard/jobs/${jobId}`);
    } catch (err: any) {
      console.error('Failed to complete commission payment', err);
      setError(err.message || 'Unable to complete payment right now.');
    } finally {
      setIsPaying(false);
    }
  };

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
            Confirm the commission payment to finish accepting this bid.
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
              This is a sample confirmation screen. Actual payment gateway integration will be added later.
            </p>
          </div>
        </div>

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="space-y-3 text-sm text-slate-600">
          <p>
            You are about to accept a bid for this job. A service commission will be charged to your saved card.
          </p>
          <p className="text-xs text-slate-500">
            Note: Commission amount and payment breakdown will be shown here once the real gateway is connected.
          </p>
        </div>

        <button
          type="button"
          onClick={handleCompletePayment}
          disabled={isPaying}
          className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-emerald-500 text-white py-3 text-sm font-semibold hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-300 disabled:opacity-50"
        >
          {isPaying ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
          Complete payment & accept bid
        </button>
      </div>
    </div>
  );
}


