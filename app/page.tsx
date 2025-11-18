// ============================================
// FILE: app/page.tsx
// Landing Page - Login/Register (TypeScript)
// ============================================

'use client';

import React, { useState, ChangeEvent } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Upload, CheckCircle } from 'lucide-react';
import Header from '@/components/Header';
interface LoginData {
  emailOrPhone: string;
  password: string;
}

interface RegisterData {
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
  cardNumber: string;
  cardHolderName: string;
  expiryDate: string;
  cvv: string;
  acceptTerms: boolean;
}

interface InputFieldProps {
  label: string;
  type?: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  required?: boolean;
  error?: string;
}

interface SelectFieldProps {
  label: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLSelectElement>) => void;
  options: string[];
  required?: boolean;
  error?: string;
}

interface PasswordFieldProps {
  label: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  show: boolean;
  toggleShow: () => void;
  required?: boolean;
  error?: string;
}

interface FileUploadFieldProps {
  label: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  fileName?: string;
  required?: boolean;
  error?: string;
}

interface CardInputFieldProps {
  label: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
}

interface ExpiryDateInputFieldProps {
  label: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
}

// Utility functions for card validation
const luhnCheck = (cardNumber: string): boolean => {
  const cleaned = cardNumber.replace(/\s+/g, '');
  if (!/^\d+$/.test(cleaned)) return false;
  
  let sum = 0;
  let isEven = false;
  
  for (let i = cleaned.length - 1; i >= 0; i--) {
    let digit = parseInt(cleaned[i]);
    
    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }
    
    sum += digit;
    isEven = !isEven;
  }
  
  return sum % 10 === 0;
};

const getCardType = (cardNumber: string): 'visa' | 'mastercard' | 'discover' | null => {
  const cleaned = cardNumber.replace(/\s+/g, '');
  if (!cleaned) return null;
  
  const firstDigit = cleaned[0];
  if (firstDigit === '4') return 'visa';
  if (firstDigit === '5') return 'mastercard';
  if (firstDigit === '6') return 'discover';
  return null;
};

const formatCardNumber = (value: string): string => {
  const cleaned = value.replace(/\s+/g, '');
  const formatted = cleaned.match(/.{1,4}/g)?.join(' ') || cleaned;
  return formatted.substring(0, 19); // Max 16 digits + 3 spaces
};

const formatExpiryDate = (value: string): string => {
  const cleaned = value.replace(/\D/g, '');
  if (cleaned.length >= 2) {
    return cleaned.substring(0, 2) + '/' + cleaned.substring(2, 4);
  }
  return cleaned;
};

// Move components outside to prevent recreation on every render
const InputField: React.FC<InputFieldProps> = ({ label, type = "text", value, onChange, placeholder, required, error }) => (
  <div className="mb-4">
    <label className="block text-gray-700 text-sm font-medium mb-2">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={`w-full px-4 py-3 bg-gray-100 border-none rounded-full focus:outline-none focus:ring-2 transition-all text-black placeholder:text-black placeholder:opacity-60 ${
        error ? 'ring-2 ring-red-400' : 'focus:ring-green-400'
      }`}
    />
    {error && <p className="text-red-500 text-xs mt-1 ml-4">{error}</p>}
  </div>
);

const SelectField: React.FC<SelectFieldProps> = ({ label, value, onChange, options, required, error }) => (
  <div className="mb-4">
    <label className="block text-gray-700 text-sm font-medium mb-2">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <select
      value={value}
      onChange={onChange}
      className={`w-full px-4 py-3 bg-gray-100 border-none rounded-full focus:outline-none focus:ring-2 transition-all appearance-none text-black ${
        error ? 'ring-2 ring-red-400' : 'focus:ring-green-400'
      }`}
    >
      <option value="">Select {label}</option>
      {options.map(opt => (
        <option key={opt} value={opt}>{opt}</option>
      ))}
    </select>
    {error && <p className="text-red-500 text-xs mt-1 ml-4">{error}</p>}
  </div>
);

const PasswordField: React.FC<PasswordFieldProps> = ({ label, value, onChange, placeholder, show, toggleShow, required, error }) => (
  <div className="mb-4">
    <label className="block text-gray-700 text-sm font-medium mb-2">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <div className="relative">
      <input
        type={show ? "text" : "password"}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`w-full px-4 py-3 bg-gray-100 border-none rounded-full focus:outline-none focus:ring-2 transition-all pr-12 text-black placeholder:text-black placeholder:opacity-60 ${
          error ? 'ring-2 ring-red-400' : 'focus:ring-green-400'
        }`}
      />
      <button
        type="button"
        onClick={toggleShow}
        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
      >
        {show ? <EyeOff size={20} /> : <Eye size={20} />}
      </button>
    </div>
    {error && <p className="text-red-500 text-xs mt-1 ml-4">{error}</p>}
  </div>
);

const FileUploadField: React.FC<FileUploadFieldProps> = ({ label, onChange, fileName, required, error }) => (
  <div className="mb-4">
    <label className="block text-gray-700 text-sm font-medium mb-2">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <div className="relative">
      <input
        type="file"
        onChange={onChange}
        accept="image/*"
        className="hidden"
        id={label}
      />
      <label
        htmlFor={label}
        className={`w-full px-4 py-3 bg-gray-100 border-2 border-dashed rounded-2xl flex items-center justify-center cursor-pointer hover:border-green-400 transition-all ${
          error ? 'border-red-400' : 'border-gray-300'
        }`}
      >
        <Upload size={20} className="mr-2 text-gray-500" />
        <span className="text-gray-600">{fileName || 'Upload File'}</span>
      </label>
    </div>
    {error && <p className="text-red-500 text-xs mt-1 ml-4">{error}</p>}
  </div>
);

const CardInputField: React.FC<CardInputFieldProps> = ({ label, value, onChange, placeholder }) => {
  const cardType = getCardType(value);
  const cleanedCardNumber = value.replace(/\s+/g, '');
  const cardLength = cleanedCardNumber.length;
  const isComplete = cardLength >= 13 && cardLength <= 16;
  const isValid = isComplete && luhnCheck(value);
  const showInvalid = isComplete && !isValid;
  
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCardNumber(e.target.value);
    const syntheticEvent = {
      ...e,
      target: { ...e.target, value: formatted }
    } as ChangeEvent<HTMLInputElement>;
    onChange(syntheticEvent);
  };
  
  const getCardIcon = () => {
    if (!cardType) return null;
    
    switch (cardType) {
      case 'visa':
        return (
          <svg width="40" height="26" viewBox="0 0 40 26" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="40" height="26" rx="3" fill="#1434CB"/>
            <path d="M16.2 18.5L18.1 8.5H20.5L18.6 18.5H16.2ZM28.5 8.7C28 8.5 27.2 8.3 26.2 8.3C23.8 8.3 22.1 9.5 22.1 11.3C22.1 12.6 23.3 13.3 24.2 13.7C25.2 14.1 25.5 14.4 25.5 14.8C25.5 15.4 24.7 15.7 24 15.7C22.9 15.7 22.3 15.5 21.5 15.2L21.1 15L20.7 17.4C21.3 17.7 22.4 17.9 23.6 17.9C26.2 17.9 27.8 16.7 27.8 14.8C27.8 13.8 27.1 13 25.6 12.4C24.7 12 24.3 11.7 24.3 11.3C24.3 10.9 24.8 10.5 25.8 10.5C26.6 10.5 27.2 10.6 27.7 10.9L28 11L28.5 8.7ZM32.8 8.5H30.9C30.3 8.5 29.8 8.7 29.6 9.3L26.4 18.5H29L29.6 16.9H32.7L33 18.5H35.3L33.3 8.5H32.8ZM30.3 14.8L31.5 11.2L32.2 14.8H30.3ZM13.5 8.5L11.2 15.3L11 14.2C10.5 12.6 9.1 10.9 7.5 10.1L9.6 18.5H12.2L16.1 8.5H13.5Z" fill="white"/>
          </svg>
        );
      case 'mastercard':
        return (
          <svg width="40" height="26" viewBox="0 0 40 26" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="40" height="26" rx="3" fill="#EB001B"/>
            <circle cx="15" cy="13" r="7" fill="#FF5F00"/>
            <circle cx="25" cy="13" r="7" fill="#F79E1B"/>
            <path d="M20 7.5C21.5 8.7 22.5 10.7 22.5 13C22.5 15.3 21.5 17.3 20 18.5C18.5 17.3 17.5 15.3 17.5 13C17.5 10.7 18.5 8.7 20 7.5Z" fill="#FF5F00"/>
          </svg>
        );
      case 'discover':
        return (
          <svg width="40" height="26" viewBox="0 0 40 26" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="40" height="26" rx="3" fill="#FF6000"/>
            <path d="M28 13C28 15.8 25.8 18 23 18C20.2 18 18 15.8 18 13C18 10.2 20.2 8 23 8C25.8 8 28 10.2 28 13Z" fill="white"/>
            <path d="M8 11H10V15H8V11ZM11 10H13C14.1 10 15 10.9 15 12V14C15 15.1 14.1 16 13 16H11V10ZM12 11V15H13C13.6 15 14 14.6 14 14V12C14 11.4 13.6 11 13 11H12Z" fill="white"/>
          </svg>
        );
      default:
        return null;
    }
  };
  
  return (
    <div className="mb-4">
      <label className="block text-gray-700 text-sm font-medium mb-2">{label}</label>
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          maxLength={19}
          className={`w-full px-4 py-3 bg-gray-100 border-none rounded-full focus:outline-none focus:ring-2 transition-all text-black placeholder:text-black placeholder:opacity-60 pr-24 ${
            showInvalid ? 'focus:ring-red-400' : 'focus:ring-green-400'
          }`}
        />
        <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
          {showInvalid && (
            <span className="text-red-500 text-xs font-medium">Invalid</span>
          )}
          {getCardIcon()}
        </div>
      </div>
    </div>
  );
};

const ExpiryDateInputField: React.FC<ExpiryDateInputFieldProps> = ({ label, value, onChange, placeholder }) => {
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const formatted = formatExpiryDate(e.target.value);
    const syntheticEvent = {
      ...e,
      target: { ...e.target, value: formatted }
    } as ChangeEvent<HTMLInputElement>;
    onChange(syntheticEvent);
  };
  
  return (
    <div className="mb-4">
      <label className="block text-gray-700 text-sm font-medium mb-2">{label}</label>
      <input
        type="text"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        maxLength={5}
        className="w-full px-4 py-3 bg-gray-100 border-none rounded-full focus:outline-none focus:ring-2 focus:ring-green-400 transition-all text-black placeholder:text-black placeholder:opacity-60"
      />
    </div>
  );
};

export default function AuthPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState<boolean>(true);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [loginData, setLoginData] = useState<LoginData>({
    emailOrPhone: '',
    password: ''
  });
  
  const [registerData, setRegisterData] = useState<RegisterData>({
    firstName: '',
    lastName: '',
    nicNumber: '',
    email: '',
    mobilePhone: '',
    profession: '',
    province: '',
    district: '',
    address: '',
    password: '',
    confirmPassword: '',
    documentType: 'NIC',
    documentFront: null,
    documentBack: null,
    cardNumber: '',
    cardHolderName: '',
    expiryDate: '',
    cvv: '',
    acceptTerms: false
  });

  const provinces: string[] = ['Western', 'Central', 'Southern', 'Northern', 'Eastern', 'North Western', 'North Central', 'Uva', 'Sabaragamuwa'];
  const professions: string[] = ['Student','Engineer','Lawyer','Doctor', 'Teacher', 'Business Owner', 'Other'];

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!registerData.firstName.trim()) newErrors.firstName = 'First name is required';
      if (!registerData.lastName.trim()) newErrors.lastName = 'Last name is required';
      if (!registerData.email.trim()) {
        newErrors.email = 'Email is required';
      } else if (!/\S+@\S+\.\S+/.test(registerData.email)) {
        newErrors.email = 'Email is invalid';
      }
      if (!registerData.mobilePhone.trim()) newErrors.mobilePhone = 'Mobile phone is required';
      if (!registerData.profession) newErrors.profession = 'Profession is required';
      if (!registerData.province) newErrors.province = 'Province is required';
      if (!registerData.district.trim()) newErrors.district = 'District is required';
      if (!registerData.address.trim()) newErrors.address = 'Address is required';
      if (!registerData.password) {
        newErrors.password = 'Password is required';
      } else if (registerData.password.length < 6) {
        newErrors.password = 'Password must be at least 6 characters';
      }
      if (!registerData.confirmPassword) {
        newErrors.confirmPassword = 'Please confirm your password';
      } else if (registerData.password !== registerData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    if (step === 2) {
      if (!registerData.nicNumber.trim()) {
        newErrors.nicNumber = 'NIC number is required';
      } else if (!/^([0-9]{9}[VvXx]|[0-9]{12})$/.test(registerData.nicNumber.trim())) {
        newErrors.nicNumber = 'NIC number format is invalid';
      }
      if (!registerData.documentFront) newErrors.documentFront = 'Front side document is required';
      if (!registerData.documentBack) newErrors.documentBack = 'Back side document is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async (): Promise<void> => {
    setIsLoading(true);
    try {
      const result = await signIn('credentials', {
        redirect: false,
        emailOrPhone: loginData.emailOrPhone,
        password: loginData.password,
      });

      if (result?.error) {
        alert(result.error);
      } else {
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNext = (): void => {
    if (validateStep(currentStep)) {
      if (currentStep < 4) {
        setCurrentStep(currentStep + 1);
        setErrors({});
      }
    }
  };

  const handlePrevious = (): void => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setErrors({});
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleRegister = async (): Promise<void> => {
    if (!registerData.acceptTerms) return;
    
    setIsLoading(true);
    try {
      const formData = {
        ...registerData,
        documentFront: registerData.documentFront ? 
          await fileToBase64(registerData.documentFront) : null,
        documentBack: registerData.documentBack ? 
          await fileToBase64(registerData.documentBack) : null,
      };

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        alert('Registration successful! Please login.');
        setIsLogin(true);
        setCurrentStep(1);
      } else {
        alert(data.error || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      alert('Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = (field: 'documentFront' | 'documentBack', file: File | null): void => {
    setRegisterData({ ...registerData, [field]: file });
    if (file) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  const ProgressBar: React.FC = () => (
    <div className="w-full max-w-2xl mx-auto mb-8">
      <div className="flex justify-between items-center">
        {[1, 2, 3, 4].map((step, index) => (
          <React.Fragment key={step}>
            <div className="flex flex-col items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                currentStep >= step 
                  ? 'bg-green-500 text-white' 
                  : 'bg-gray-200 text-gray-500'
              }`}>
                {currentStep > step ? <CheckCircle size={20} /> : step}
              </div>
              <span className="text-xs mt-2 text-gray-600">
                {step === 1 && 'Personal Info'}
                {step === 2 && 'KYC'}
                {step === 3 && 'Payment'}
                {step === 4 && 'Terms'}
              </span>
            </div>
            {index < 3 && (
              <div className={`flex-1 h-1 mx-2 transition-all ${
                currentStep > step ? 'bg-green-500' : 'bg-gray-200'
              }`} />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );

  if (isLogin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-white flex flex-col p-4">
        <Header />
        <div className="flex-1 flex items-center justify-center">
        <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md">
          <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">Welcome Back</h1>
          
          <div>
            <InputField
              label="Email or Phone"
              type="text"
              value={loginData.emailOrPhone}
              onChange={(e) => setLoginData({...loginData, emailOrPhone: e.target.value})}
              placeholder="Enter your Email or Phone"
            />
            
            <PasswordField
              label="Password"
              value={loginData.password}
              onChange={(e) => setLoginData({...loginData, password: e.target.value})}
              placeholder="Enter your Password"
              show={showPassword}
              toggleShow={() => setShowPassword(!showPassword)}
            />
            
            <button
              onClick={handleLogin}
              disabled={isLoading}
              className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-full transition-all shadow-lg hover:shadow-xl mt-6 disabled:opacity-50"
            >
              {isLoading ? 'Logging in...' : 'Login'}
            </button>
          </div>
          
          <div className="text-center mt-6">
            <span className="text-gray-600">Don't have an account? </span>
            <button
              onClick={() => setIsLogin(false)}
              className="text-green-500 font-semibold hover:text-green-600 transition-all"
            >
              Register
            </button>
          </div>
        </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-white py-8 px-4">
      <Header /> 
      <div className="max-w-4xl mx-auto mt-8">
        <div className="bg-white rounded-3xl shadow-2xl p-8">
          <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">Create Your Account</h1>
          
          <ProgressBar />
          
          <div>
            {currentStep === 1 && (
              <div className="space-y-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InputField
                    label="First Name"
                    value={registerData.firstName}
                    onChange={(e) => setRegisterData({...registerData, firstName: e.target.value})}
                    placeholder="Enter your First Name"
                    required
                    error={errors.firstName}
                  />
                  <InputField
                    label="Last Name"
                    value={registerData.lastName}
                    onChange={(e) => setRegisterData({...registerData, lastName: e.target.value})}
                    placeholder="Enter your Last Name"
                    required
                    error={errors.lastName}
                  />
                </div>
                
                <InputField
                  label="Email"
                  type="email"
                  value={registerData.email}
                  onChange={(e) => setRegisterData({...registerData, email: e.target.value})}
                  placeholder="Enter your Email"
                  required
                  error={errors.email}
                />
                
                <InputField
                  label="Mobile Phone"
                  type="tel"
                  value={registerData.mobilePhone}
                  onChange={(e) => setRegisterData({...registerData, mobilePhone: e.target.value})}
                  placeholder="Enter your Mobile Phone"
                  required
                  error={errors.mobilePhone}
                />
                
                <SelectField
                  label="Profession"
                  value={registerData.profession}
                  onChange={(e) => setRegisterData({...registerData, profession: e.target.value})}
                  options={professions}
                  required
                  error={errors.profession}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <SelectField
                    label="Province"
                    value={registerData.province}
                    onChange={(e) => setRegisterData({...registerData, province: e.target.value})}
                    options={provinces}
                    required
                    error={errors.province}
                  />
                  <InputField
                    label="District"
                    value={registerData.district}
                    onChange={(e) => setRegisterData({...registerData, district: e.target.value})}
                    placeholder="Enter your District"
                    required
                    error={errors.district}
                  />
                </div>
                
                <InputField
                  label="Address"
                  value={registerData.address}
                  onChange={(e) => setRegisterData({...registerData, address: e.target.value})}
                  placeholder="Enter your Address"
                  required
                  error={errors.address}
                />
                
                <PasswordField
                  label="Password"
                  value={registerData.password}
                  onChange={(e) => setRegisterData({...registerData, password: e.target.value})}
                  placeholder="Enter your Password"
                  show={showPassword}
                  toggleShow={() => setShowPassword(!showPassword)}
                  required
                  error={errors.password}
                />
                
                <PasswordField
                  label="Confirm Password"
                  value={registerData.confirmPassword}
                  onChange={(e) => setRegisterData({...registerData, confirmPassword: e.target.value})}
                  placeholder="Confirm your Password"
                  show={showConfirmPassword}
                  toggleShow={() => setShowConfirmPassword(!showConfirmPassword)}
                  required
                  error={errors.confirmPassword}
                />
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-2">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">KYC Verification</h2>

                <InputField
                  label="NIC Number"
                  value={registerData.nicNumber}
                  onChange={(e) => setRegisterData({ ...registerData, nicNumber: e.target.value })}
                  placeholder="Enter your NIC Number"
                  required
                  error={errors.nicNumber}
                />

                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-medium mb-2">
                    Document Type <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-4">
                    {(['NIC', 'Passport', 'Driving License'] as const).map(type => (
                      <label key={type} className="flex items-center cursor-pointer">
                        <input
                          type="radio"
                          name="documentType"
                          value={type}
                          checked={registerData.documentType === type}
                          onChange={(e) => setRegisterData({...registerData, documentType: e.target.value as 'NIC' | 'Passport' | 'Driving License'})}
                          className="mr-2 accent-green-500"
                        />
                        <span className="text-gray-700">{type}</span>
                      </label>
                    ))}
                  </div>
                </div>
                
                <FileUploadField
                  label="Upload Front Side"
                  onChange={(e) => handleFileUpload('documentFront', e.target.files?.[0] || null)}
                  fileName={registerData.documentFront?.name}
                  required
                  error={errors.documentFront}
                />
                
                <FileUploadField
                  label="Upload Back Side"
                  onChange={(e) => handleFileUpload('documentBack', e.target.files?.[0] || null)}
                  fileName={registerData.documentBack?.name}
                  required
                  error={errors.documentBack}
                />
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-2">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">Payment Information</h2>
                <p className="text-gray-600 text-sm mb-4">This step is optional and can be skipped</p>
                
                <CardInputField
                  label="Card Number"
                  value={registerData.cardNumber}
                  onChange={(e) => setRegisterData({...registerData, cardNumber: e.target.value})}
                  placeholder="1234 5678 9012 3456"
                />
                
                <InputField
                  label="Card Holder Name"
                  value={registerData.cardHolderName}
                  onChange={(e) => setRegisterData({...registerData, cardHolderName: e.target.value})}
                  placeholder="Enter Card Holder Name"
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ExpiryDateInputField
                    label="Expiry Date"
                    value={registerData.expiryDate}
                    onChange={(e) => setRegisterData({...registerData, expiryDate: e.target.value})}
                    placeholder="MM/YY"
                  />
                  <InputField
                    label="CVV"
                    type="password"
                    value={registerData.cvv}
                    onChange={(e) => setRegisterData({...registerData, cvv: e.target.value.replace(/\D/g, '').substring(0, 4)})}
                    placeholder="123"
                  />
                </div>
              </div>
            )}

            {currentStep === 4 && (
              <div className="space-y-4">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">Terms & Conditions</h2>
                
                <div className="bg-gray-50 rounded-2xl p-6 max-h-64 overflow-y-auto border border-gray-200">
                  <h3 className="font-semibold mb-2">Terms of Service</h3>
                  <p className="text-sm text-gray-700 mb-4">
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
                  </p>
                  <h3 className="font-semibold mb-2">Privacy Policy</h3>
                  <p className="text-sm text-gray-700 mb-4">
                    Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.
                  </p>
                </div>
                
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={registerData.acceptTerms}
                    onChange={(e) => setRegisterData({...registerData, acceptTerms: e.target.checked})}
                    className="w-5 h-5 accent-green-500 mr-3"
                  />
                  <span className="text-gray-700">I agree to the Terms & Conditions and Privacy Policy</span>
                </label>
              </div>
            )}

            <div className={`flex gap-4 mt-8 ${currentStep === 3 ? 'items-start' : ''}`}>
              {currentStep > 1 && (
                <button
                  onClick={handlePrevious}
                  disabled={isLoading}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-3 rounded-full transition-all disabled:opacity-50"
                >
                  Previous
                </button>
              )}
              
              {currentStep < 4 ? (
                currentStep === 3 ? (
                  <>
                    <button
                      onClick={handleNext}
                      className="flex-1 bg-gray-200 hover:bg-gray-300 text-black font-semibold py-3 rounded-full transition-all"
                    >
                      Skip
                    </button>
                    <button
                      onClick={handleNext}
                      className="flex-1 bg-green-500 hover:bg-green-600 text-black font-semibold py-3 rounded-full transition-all shadow-lg hover:shadow-xl"
                    >
                      Next
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleNext}
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-full transition-all shadow-lg hover:shadow-xl"
                  >
                    Next
                  </button>
                )
              ) : (
                <button
                  onClick={handleRegister}
                  disabled={!registerData.acceptTerms || isLoading}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-full transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Registering...' : 'Register'}
                </button>
              )}
            </div>
          </div>
          
          <div className="text-center mt-6">
            <span className="text-gray-600">Already have an account? </span>
            <button
              onClick={() => {
                setIsLogin(true);
                setCurrentStep(1);
              }}
              className="text-green-500 font-semibold hover:text-green-600 transition-all"
            >
              Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}