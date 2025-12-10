// PayHere type definitions
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
  delivery_address?: string;
  delivery_city?: string;
  delivery_country?: string;
  custom_1?: string;
  custom_2?: string;
}}
interface PayHere {
  startPayment: (payment: PayHerePayment) => void;
  onCompleted: ((orderId: string) => void) | null;
  onDismissed: (() => void) | null;
  onError: ((error: string) => void) | null;
}
interface Window {
  payhere: PayHere;
}
// Payment button props
export interface PaymentDetails {
  order_id: string;
  amount: string;
  currency: string;
  items: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  delivery_address?: string;
  delivery_city?: string;
  delivery_country?: string;
  custom_1?: string;
  custom_2?: string;
}
export interface PayHereButtonProps {
  paymentDetails: PaymentDetails;
  buttonText?: string;
  buttonClassName?: string;
  buttonStyle?: React.CSSProperties;
  onSuccess?: (orderId: string) => void;
  onCancel?: () => void;
  onError?: (error: string) => void;
  disabled?: boolean;
  loading?: boolean;
  sandbox?: boolean;
}



export {};