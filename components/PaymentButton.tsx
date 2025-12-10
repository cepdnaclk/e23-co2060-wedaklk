'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { PayHereButtonProps, PaymentDetails } from '@/types/payhere';
const PayHereButton: React.FC<PayHereButtonProps> = ({
  paymentDetails,
  buttonText = 'Pay Now',
  buttonClassName = 'payhere-button',
  buttonStyle,
  onSuccess,
  onCancel,
  onError,
  disabled = false,
  loading = false,
  sandbox = true,
}) => {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  useEffect(() => {
    // Set up PayHere event handlers
    if (typeof window !== 'undefined' && (window as any).payhere) {
      (window as any).payhere.onCompleted = function onCompleted(orderId: string): void {
        console.log('Payment completed. OrderID:', orderId);
        setIsProcessing(false);
        
        // Call custom success callback if provided
        if (onSuccess) {
          onSuccess(orderId);
        } else {
          // Default: redirect to success page
          router.push('/payment/success');
        }
      };
      (window as any).payhere.onDismissed = function onDismissed(): void {
        console.log('Payment dismissed');
        setIsProcessing(false);
        
        // Call custom cancel callback if provided
        if (onCancel) {
          onCancel();
        } else {
          // Default: redirect to cancel page
          router.push('/payment/cancel');
        }
      };
      (window as any).payhere.onError = function onErrorHandler(error: string): void {
        console.log('Error:', error);
        setIsProcessing(false);
        
        // Call custom error callback if provided
        if (onError) {
          onError(error);
        } else {
          // Default: redirect to cancel page
          router.push('/payment/cancel');
        }
      };
    }
    // Cleanup
    return () => {
      if (typeof window !== 'undefined' && (window as any).payhere) {
        (window as any).payhere.onCompleted = null;
        (window as any).payhere.onDismissed = null;
        (window as any).payhere.onError = null;
      }
    };
  }, [router, onSuccess, onCancel, onError]);
  const handlePayment = async (): Promise<void> => {
    if (isProcessing || disabled || loading) return;
    setIsProcessing(true);
    try {
      // Request backend to generate the hash value
      const response = await fetch('/api/payment/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentDetails),
      });
      if (response.ok) {
        const data = await response.json();
        const { hash, merchant_id } = data;
        // Payment configuration
        const payment: PayHerePayment = {
          sandbox: sandbox,
          merchant_id: merchant_id,
          return_url: undefined,
          cancel_url: undefined,
          notify_url: `${window.location.origin}/api/payment/notify`,
          order_id: paymentDetails.order_id,
          items: paymentDetails.items,
          amount: paymentDetails.amount,
          currency: paymentDetails.currency,
          first_name: paymentDetails.first_name,
          last_name: paymentDetails.last_name,
          email: paymentDetails.email,
          phone: paymentDetails.phone,
          address: paymentDetails.address,
          city: paymentDetails.city,
          country: paymentDetails.country,
          hash: hash,
          ...(paymentDetails.delivery_address && { delivery_address: paymentDetails.delivery_address }),
          ...(paymentDetails.delivery_city && { delivery_city: paymentDetails.delivery_city }),
          ...(paymentDetails.delivery_country && { delivery_country: paymentDetails.delivery_country }),
          ...(paymentDetails.custom_1 && { custom_1: paymentDetails.custom_1 }),
          ...(paymentDetails.custom_2 && { custom_2: paymentDetails.custom_2 }),
        };
        // Initialize PayHere payment
        if ((window as any).payhere) {
          (window as any).payhere.startPayment(payment);
        } else {
          console.error('PayHere SDK not loaded');
          setIsProcessing(false);
        }
      } else {
        console.error('Failed to generate hash for payment.');
        setIsProcessing(false);
      }
    } catch (error) {
      console.error('An error occurred:', error);
      setIsProcessing(false);
    }
  };
  return (
    <button
      className={buttonClassName}
      style={buttonStyle}
      onClick={handlePayment}
      disabled={disabled || loading || isProcessing}
    >
      {isProcessing ? 'Processing...' : loading ? 'Loading...' : buttonText}
    </button>
  );
};
export default PayHereButton;