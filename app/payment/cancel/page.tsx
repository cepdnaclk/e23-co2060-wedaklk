'use client';
import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import '../../styles/payment-pages.css';
function PaymentCancelContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const paymentType = searchParams?.get('type');
  const jobId = searchParams?.get('jobId');
  const bidId = searchParams?.get('bidId');

  const isCommissionPayment = paymentType === 'commission';

  useEffect(() => {
    const container = document.querySelector('.payment-container');
    if (container) {
      container.classList.add('fade-in');
    }
  }, []);

  return (
    <div className="payment-container cancel">
      <div className="payment-card">
        <div className="icon-wrapper cancel-icon">
          <svg viewBox="0 0 52 52" className="crossmark">
            <circle className="crossmark-circle" cx="26" cy="26" r="25" fill="none" />
            <path className="crossmark-cross" fill="none" d="M16 16 36 36 M36 16 16 36" />
          </svg>
        </div>

        <h1 className="payment-title">Payment Cancelled</h1>
        <p className="payment-message">
          {isCommissionPayment
            ? 'Commission payment was cancelled. The bid has not been accepted. You can try again or return to the job page.'
            : 'Your payment was cancelled. No charges have been made to your account.'
          }
        </p>

        <div className="payment-details">
          <div className="detail-row">
            <span className="detail-label">Status:</span>
            <span className="detail-value cancel-text">Cancelled</span>
          </div>
        </div>
        <div className="button-group">
          {isCommissionPayment && jobId ? (
            <>
              <button
                className="btn btn-secondary"
                onClick={() => router.push(`/dashboard/jobs/${jobId}`)}
              >
                Back to Job
              </button>
              <button
                className="btn btn-primary"
                onClick={() => router.push(`/dashboard/payments/pay-commission?jobId=${jobId}&bidId=${bidId}`)}
              >
                Try Again
              </button>
            </>
          ) : (
            <>
              <button
                className="btn btn-secondary"
                onClick={() => router.push('/')}
              >
                Back to Home
              </button>
              <button
                className="btn btn-primary"
                onClick={() => router.push('/')}
              >
                Try Again
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PaymentCancel() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PaymentCancelContent />
    </Suspense>
  );
}