// ============================================
// FILE 4: types/auth.ts
// TypeScript Types/Interfaces
// ============================================

export interface LoginData {
  emailOrPhone: string;
  password: string;
}

export interface RegisterData {
  firstName: string;
  lastName: string;
  nicNumber: string;
  email: string;
  mobilePhone: string;
  profession: string;
  province: string;
  district: string;
  address: string;
  password: string;
  confirmPassword: string;
  documentType: 'NIC' | 'Passport' | 'Driving License';
  documentFront: File | null;
  documentBack: File | null;
  cardNumber?: string;
  cardHolderName?: string;
  expiryDate?: string;
  cvv?: string;
  acceptTerms: boolean;
}

export interface ApiResponse<T = any> {
  message?: string;
  error?: string;
  user?: T;
}