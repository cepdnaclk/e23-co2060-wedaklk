'use client';
import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import '../../styles/payment-pages.css';

export default function PaymentSuccess() {
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
    <div className="payment-container success">
      <div className="payment-card">
        <div className="icon-wrapper success-icon">
          <svg viewBox="0 0 52 52" className="checkmark">
            <circle className="checkmark-circle" cx="26" cy="26" r="25" fill="none" />
            <path className="checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
          </svg>
        </div>

        <h1 className="payment-title">Payment Successful!</h1>
        <p className="payment-message">
          {isCommissionPayment
            ? 'Commission payment completed successfully. The bid has been accepted and the job owner will be notified.'
            : 'Your payment has been processed successfully. Thank you for your purchase!'
          }
        </p>

        <div className="payment-details">
          <div className="detail-row">
            <span className="detail-label">Status:</span>
            <span className="detail-value success-text">Completed</span>
          </div>
        </div>
        <div className="button-group">
          {isCommissionPayment && jobId ? (
            <button
              className="btn btn-primary"
              onClick={() => router.push(`/dashboard/jobs/${jobId}?paymentSuccess=true&bidId=${bidId}`)}
            >
              View Job Details
            </button>
          ) : (
            <button
              className="btn btn-primary"
              onClick={() => router.push('/')}
            >
              Back to Home
            </button>
          )}
        </div>
      </div>
    </div>
  );
}