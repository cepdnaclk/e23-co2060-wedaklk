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
  static async initiatePayment(config: any): Promise<void> {
    await this.loadPayHereScript();
    
    const payhere = (window as any).payhere;

    payhere.onCompleted = function onCompleted(orderId: string) {
      console.log('Payment completed. OrderID:', orderId);
      window.location.href = config.return_url;
    };

    payhere.onDismissed = function onDismissed() {
      console.log('Payment dismissed');
      window.location.href = config.cancel_url;
    };

    payhere.onError = function onError(error: string) {
      console.log('Error:', error);
      alert('Payment error: ' + error);
    };

    payhere.startPayment(config);
  }
}