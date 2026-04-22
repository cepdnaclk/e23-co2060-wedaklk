// PayPal type definitions

export interface PayPalOrderRequest {
  order_id: string;
  amount_lkr: number;
  amount_usd: string;
  currency: string;
  description: string;
  custom_id?: string;
}

export interface PayPalOrderResponse {
  id: string;
  status: string;
}

export interface PayPalCaptureRequest {
  orderID: string;
  bidId?: string;
  jobId?: string;
}

export interface PayPalCaptureResponse {
  status: string;
  message: string;
  captureId?: string;
}

export interface ExchangeRateResponse {
  rate: number;
  source: string;
  timestamp: number;
}
