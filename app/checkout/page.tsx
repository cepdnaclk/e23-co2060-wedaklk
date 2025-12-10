'use client';

import PayHereButton from '@/components/PayHereButton';

export default function CheckoutPage() {
  const handlePaymentSuccess = () => {
    console.log('Payment successful!');
  };

  const handlePaymentError = (error: string) => {
    console.error('Payment error:', error);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Checkout</h1>
      
      <div className="max-w-md mx-auto bg-white shadow-md rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
        
        <div className="mb-6">
          <div className="flex justify-between mb-2">
            <span>Product Name</span>
            <span>LKR 1,000.00</span>
          </div>
          <div className="border-t pt-2 flex justify-between font-bold">
            <span>Total</span>
            <span>LKR 1,000.00</span>
          </div>
        </div>

        <PayHereButton
          amount={1000}
          currency="LKR"
          items="Product Name"
          customer={{
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
            phone: '0771234567',
            address: 'No. 123, Main Street',
            city: 'Colombo',
            country: 'Sri Lanka'
          }}
          onSuccess={handlePaymentSuccess}
          onError={handlePaymentError}
        />
      </div>
    </div>
  );
}