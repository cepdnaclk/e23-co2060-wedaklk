# How to Integrate PayHere Payment Gateway in Next.js: A Complete Guide

![PayHere + Next.js](https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=1200&h=400&fit=crop)

*A step-by-step tutorial on integrating PayHere payment gateway into your Next.js application with TypeScript*

---

## Introduction

PayHere is Sri Lanka's leading online payment gateway, enabling businesses to accept payments through credit/debit cards, mobile wallets, and bank transfers. In this comprehensive guide, we'll walk through integrating PayHere into a Next.js application from scratch.

**What you'll learn:**
- Setting up a new Next.js project
- Configuring PayHere sandbox credentials
- Implementing payment initiation and verification
- Handling payment callbacks securely
- Building a complete payment flow with success/cancel pages

**Prerequisites:**
- Node.js 18+ installed
- Basic knowledge of React and TypeScript
- A PayHere merchant account (sandbox or live)

---

## Part 1: Setting Up Your Next.js Project

### Step 1: Create a New Next.js Application

First, let's create a fresh Next.js project with TypeScript and App Router:

```bash
npx create-next-app@latest payhere-demo
```

When prompted, choose the following options:
- ✅ TypeScript
- ✅ ESLint
- ✅ Tailwind CSS
- ✅ `src/` directory (optional)
- ✅ App Router
- ❌ Turbopack (optional)
- ❌ Customize default import alias (optional)

Navigate to your project:

```bash
cd payhere-demo
```

### Step 2: Install Required Dependencies

Install the crypto-js library for MD5 hash generation:

```bash
npm install crypto-js
npm install --save-dev @types/crypto-js
```

### Step 3: Set Up Environment Variables

Create a `.env.local` file in your project root:

```bash
# .env.local

# PayHere Merchant Credentials (Sandbox)
NEXT_PUBLIC_PAYHERE_MERCHANT_ID=your_merchant_id
PAYHERE_MERCHANT_SECRET=your_merchant_secret
NEXT_PUBLIC_PAYHERE_MODE=sandbox
```

> **Note:** Get your sandbox credentials from [PayHere Merchant Dashboard](https://sandbox.payhere.lk/merchant/). For production, use live credentials and set `NEXT_PUBLIC_PAYHERE_MODE=live`.

---

## Part 2: Creating the PayHere Service Layer

### Step 4: Create Type Definitions

Create `types/payhere.d.ts`:

```typescript
// types/payhere.d.ts

declare global {
  interface PayHerePayment {
    sandbox: boolean;
    merchant_id: string;
    return_url?: string;
    cancel_url?: string;
    notify_url: string;
    order_id: string;
    items: string;
    amount: string;
    currency: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    country: string;
    hash: string;
    custom_1?: string;
    custom_2?: string;
  }

  interface PayHere {
    startPayment: (payment: PayHerePayment) => void;
    onCompleted: ((orderId: string) => void) | null;
    onDismissed: (() => void) | null;
    onError: ((error: string) => void) | null;
  }

  interface Window {
    payhere: PayHere;
  }
}

export {};
```

### Step 5: Create PayHere Service

Create `lib/payhere.ts`:

```typescript
// lib/payhere.ts

import CryptoJS from 'crypto-js';

export class PayHereService {
  private static getMerchantId(): string {
    return process.env.NEXT_PUBLIC_PAYHERE_MERCHANT_ID || '';
  }

  private static getMerchantSecret(): string {
    return process.env.PAYHERE_MERCHANT_SECRET || '';
  }

  private static getMode(): 'sandbox' | 'live' {
    return (process.env.NEXT_PUBLIC_PAYHERE_MODE as 'sandbox' | 'live') || 'sandbox';
  }

  /**
   * Generate MD5 hash for payment
   */
  static generateHash(
    merchantId: string,
    orderId: string,
    amount: string,
    currency: string,
    merchantSecret: string
  ): string {
    const amountFormatted = parseFloat(amount).toFixed(2);
    const hashString = `${merchantId}${orderId}${amountFormatted}${currency}${CryptoJS.MD5(merchantSecret).toString().toUpperCase()}`;
    return CryptoJS.MD5(hashString).toString().toUpperCase();
  }

  /**
   * Verify notification hash
   */
  static verifyNotificationHash(
    merchantId: string,
    orderId: string,
    amount: string,
    currency: string,
    statusCode: string,
    md5sig: string,
    merchantSecret: string
  ): boolean {
    const amountFormatted = parseFloat(amount).toFixed(2);
    const merchantSecretHash = CryptoJS.MD5(merchantSecret).toString().toUpperCase();
    const hashString = `${merchantId}${orderId}${amountFormatted}${currency}${statusCode}${merchantSecretHash}`;
    const calculatedHash = CryptoJS.MD5(hashString).toString().toUpperCase();
    
    return calculatedHash === md5sig;
  }

  /**
   * Load PayHere script dynamically
   */
  static loadPayHereScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof window !== 'undefined' && (window as any).payhere) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      const mode = this.getMode();
      script.src = mode === 'sandbox' 
        ? 'https://sandbox.payhere.lk/lib/payhere.js'
        : 'https://www.payhere.lk/lib/payhere.js';
      
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load PayHere script'));
      
      document.body.appendChild(script);
    });
  }

  /**
   * Initialize payment
   */
  static async initiatePayment(config: PayHerePayment): Promise<void> {
    await this.loadPayHereScript();
    
    const payhere = (window as any).payhere;

    payhere.onCompleted = function onCompleted(orderId: string) {
      console.log('Payment completed. OrderID:', orderId);
      if (config.return_url) {
        window.location.href = config.return_url;
      }
    };

    payhere.onDismissed = function onDismissed() {
      console.log('Payment dismissed');
      if (config.cancel_url) {
        window.location.href = config.cancel_url;
      }
    };

    payhere.onError = function onError(error: string) {
      console.log('Error:', error);
      alert('Payment error: ' + error);
    };

    payhere.startPayment(config);
  }
}
```

---

## Part 3: Building API Routes

### Step 6: Create Payment Hash Generation API

Create `app/api/payment/start/route.ts`:

```typescript
// app/api/payment/start/route.ts

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

const merchant_id = process.env.NEXT_PUBLIC_PAYHERE_MERCHANT_ID || '';
const merchant_secret = process.env.PAYHERE_MERCHANT_SECRET || '';

interface PaymentRequest {
  order_id: string;
  amount: string;
  currency: string;
  items?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: PaymentRequest = await request.json();
    const { order_id, amount, currency } = body;
    
    // Validate required fields
    if (!order_id || !amount || !currency) {
      return NextResponse.json(
        { error: 'Missing required fields: order_id, amount, currency' },
        { status: 400 }
      );
    }

    // Validate amount format
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount value' },
        { status: 400 }
      );
    }

    console.log('Payment request for order:', order_id, 'Amount:', amount);
    
    // Generate the hash value
    const hash = crypto
      .createHash('md5')
      .update(
        merchant_id +
          order_id +
          amount +
          currency +
          crypto
            .createHash('md5')
            .update(merchant_secret)
            .digest('hex')
            .toUpperCase()
      )
      .digest('hex')
      .toUpperCase();
      
    console.log('Hash generated for order:', order_id);
    
    return NextResponse.json({ 
      hash, 
      merchant_id,
      success: true 
    });
  } catch (error) {
    console.error('Error generating hash:', error);
    return NextResponse.json(
      { error: 'Failed to generate hash' },
      { status: 500 }
    );
  }
}
```

### Step 7: Create Payment Notification Handler

Create `app/api/payment/notify/route.ts`:

```typescript
// app/api/payment/notify/route.ts

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

const merchant_id = process.env.NEXT_PUBLIC_PAYHERE_MERCHANT_ID || '';
const merchant_secret = process.env.PAYHERE_MERCHANT_SECRET || '';

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
      
      // TODO: Update your database here
      // Example: await updateOrderStatus(order_id, 'paid');
      
      return NextResponse.json({ 
        status: 'success',
        message: 'Payment processed successfully'
      }, { status: 200 });
    } else {
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
```

---

## Part 4: Creating Payment Pages

### Step 8: Create Payment Success Page

Create `app/payment/success/page.tsx`:

```typescript
// app/payment/success/page.tsx

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PaymentSuccess() {
  const router = useRouter();

  useEffect(() => {
    // Optional: Add animation or tracking
    console.log('Payment successful');
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
        <p className="text-gray-600 mb-6">
          Your payment has been processed successfully.
        </p>
        
        <button
          onClick={() => router.push('/')}
          className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition"
        >
          Back to Home
        </button>
      </div>
    </div>
  );
}
```

### Step 9: Create Payment Cancel Page

Create `app/payment/cancel/page.tsx`:

```typescript
// app/payment/cancel/page.tsx

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PaymentCancel() {
  const router = useRouter();

  useEffect(() => {
    console.log('Payment cancelled');
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-100">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Cancelled</h1>
        <p className="text-gray-600 mb-6">
          Your payment was cancelled. No charges have been made.
        </p>
        
        <div className="flex gap-3">
          <button
            onClick={() => router.push('/')}
            className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg font-semibold hover:bg-gray-300 transition"
          >
            Back to Home
          </button>
          <button
            onClick={() => router.back()}
            className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            Try Again
          </button>
        </div>
      </div>
    </div>
  );
}
```

### Step 10: Create Payment Checkout Page

Create `app/checkout/page.tsx`:

```typescript
// app/checkout/page.tsx

'use client';

import { useState } from 'react';
import { PayHereService } from '@/lib/payhere';

export default function CheckoutPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePayment = async () => {
    try {
      setLoading(true);
      setError(null);

      const orderId = `ORDER-${Date.now()}`;
      const amount = '1000.00'; // Rs. 1000
      const currency = 'LKR';

      // Get payment hash from backend
      const hashResponse = await fetch('/api/payment/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: orderId,
          amount: amount,
          currency: currency,
          items: 'Sample Product',
        }),
      });

      const hashData = await hashResponse.json();
      if (!hashResponse.ok) {
        throw new Error(hashData.error || 'Failed to generate payment hash');
      }

      // Configure PayHere payment
      const paymentConfig: PayHerePayment = {
        sandbox: true,
        merchant_id: hashData.merchant_id,
        return_url: `${window.location.origin}/payment/success`,
        cancel_url: `${window.location.origin}/payment/cancel`,
        notify_url: `${window.location.origin}/api/payment/notify`,
        order_id: orderId,
        items: 'Sample Product',
        amount: amount,
        currency: currency,
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        phone: '0771234567',
        address: '123 Main Street',
        city: 'Colombo',
        country: 'Sri Lanka',
        hash: hashData.hash,
      };

      console.log('Initiating PayHere payment...');

      // Trigger PayHere payment modal
      await PayHereService.initiatePayment(paymentConfig);
    } catch (err: any) {
      console.error('Failed to initiate payment', err);
      setError(err.message || 'Unable to start payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Checkout</h1>
        
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="flex justify-between mb-2">
            <span className="text-gray-600">Product:</span>
            <span className="font-semibold">Sample Product</span>
          </div>
          <div className="flex justify-between mb-2">
            <span className="text-gray-600">Amount:</span>
            <span className="font-semibold">Rs. 1,000.00</span>
          </div>
          <div className="border-t border-gray-200 mt-3 pt-3">
            <div className="flex justify-between">
              <span className="font-bold text-gray-900">Total:</span>
              <span className="font-bold text-gray-900">Rs. 1,000.00</span>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <button
          onClick={handlePayment}
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Processing...' : 'Pay with PayHere'}
        </button>

        <p className="text-xs text-gray-500 text-center mt-4">
          This is a sandbox payment. Use test card: 4916217501611292
        </p>
      </div>
    </div>
  );
}
```

---

## Part 5: Testing Your Integration

### Step 11: Run Your Application

Start the development server:

```bash
npm run dev
```

Visit `http://localhost:3000/checkout` to test the payment flow.

### Step 12: Test with Sandbox Credentials

PayHere provides test card details for sandbox testing:

**Test Card Number:** `4916217501611292`  
**Expiry Date:** Any future date  
**CVV:** Any 3 digits  
**Name:** Any name

### Step 13: Verify Payment Flow

1. Click "Pay with PayHere" button
2. PayHere modal should appear
3. Enter test card details
4. Complete payment
5. Verify redirect to success page
6. Check server logs for payment notification

---

## Part 6: Going to Production

### Step 14: Update Environment Variables

For production, update your `.env.local`:

```bash
# Production PayHere Credentials
NEXT_PUBLIC_PAYHERE_MERCHANT_ID=your_live_merchant_id
PAYHERE_MERCHANT_SECRET=your_live_merchant_secret
NEXT_PUBLIC_PAYHERE_MODE=live
```

### Step 15: Ensure Notify URL is Publicly Accessible

PayHere needs to send payment notifications to your server. Ensure:

1. Your notify URL is publicly accessible (not localhost)
2. SSL certificate is valid (HTTPS required)
3. Server can handle POST requests to `/api/payment/notify`

For development testing, use tools like:
- **ngrok**: `ngrok http 3000`
- **localtunnel**: `lt --port 3000`

### Step 16: Build and Deploy

Build your application:

```bash
npm run build
```

Deploy to your preferred platform:
- **Vercel**: `vercel deploy`
- **Netlify**: `netlify deploy`
- **Custom server**: Upload build files

---

## Security Best Practices

### ✅ Do's

1. **Always verify payment signatures** in the notify endpoint
2. **Store merchant secret securely** (never expose in client-side code)
3. **Use HTTPS** for all payment-related pages
4. **Validate all inputs** before processing
5. **Log all payment transactions** for audit trails
6. **Handle errors gracefully** with user-friendly messages

### ❌ Don'ts

1. **Never trust client-side payment confirmations** alone
2. **Don't expose sensitive credentials** in frontend code
3. **Don't skip signature verification** in notify endpoint
4. **Don't process payments** without proper validation
5. **Don't ignore PayHere status codes**

---

## Common Issues and Solutions

### Issue 1: PayHere Modal Not Appearing

**Solution:** Ensure the PayHere script is loaded before calling `startPayment()`. The `PayHereService.loadPayHereScript()` handles this automatically.

### Issue 2: Hash Mismatch Error

**Solution:** Verify that:
- Amount is formatted to 2 decimal places
- All hash parameters are in correct order
- Merchant secret is correct
- No extra spaces in concatenated string

### Issue 3: Notify URL Not Receiving Callbacks

**Solution:**
- Ensure URL is publicly accessible
- Check firewall/security settings
- Verify POST method is allowed
- Use ngrok for local testing

---

## Conclusion

Congratulations! 🎉 You've successfully integrated PayHere payment gateway into your Next.js application. You now have:

- ✅ A secure payment flow with hash verification
- ✅ Proper callback handling for payment notifications
- ✅ Success and cancel pages for user feedback
- ✅ A production-ready payment system

### Next Steps

- Add database integration to store payment records
- Implement order management system
- Add email notifications for successful payments
- Create admin dashboard for payment tracking
- Implement refund functionality

### Resources

- [PayHere Official Documentation](https://support.payhere.lk/api-&-mobile-sdk/payhere-checkout)
- [Next.js Documentation](https://nextjs.org/docs)
- [PayHere Sandbox Dashboard](https://sandbox.payhere.lk/merchant/)

---

**Found this helpful?** Give it a clap 👏 and follow for more Next.js tutorials!

**Questions?** Drop them in the comments below. Happy coding! 💻

---

*Written by [Your Name] | Published on Medium | December 2025*
