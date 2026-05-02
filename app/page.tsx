// ============================================
// FILE: app/page.tsx
// Landing Page - Login/Register (TypeScript)
// ============================================

'use client';

import React, { useState, ChangeEvent, useEffect, Suspense, useRef } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
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


// Password Strength Indicator Component
const PasswordStrengthIndicator: React.FC<{ password: string }> = ({ password }) => {
  if (!password) return null;

  const checks = [
    { label: 'At least 6 characters', met: password.length >= 6 },
    { label: 'Contains uppercase letter', met: /[A-Z]/.test(password) },
    { label: 'Contains lowercase letter', met: /[a-z]/.test(password) },
    { label: 'Contains a number', met: /[0-9]/.test(password) },
  ];

  const metCount = checks.filter(c => c.met).length;
  const strengthPercent = (metCount / checks.length) * 100;
  const strengthLabel = metCount <= 1 ? 'Weak' : metCount === 2 ? 'Fair' : metCount === 3 ? 'Good' : 'Strong';
  const strengthColor = metCount <= 1 ? 'bg-red-500' : metCount === 2 ? 'bg-orange-400' : metCount === 3 ? 'bg-yellow-400' : 'bg-green-500';
  const strengthTextColor = metCount <= 1 ? 'text-red-500' : metCount === 2 ? 'text-orange-400' : metCount === 3 ? 'text-yellow-500' : 'text-green-500';

  return (
    <div className="mb-4 px-1 -mt-2">
      <div className="flex items-center gap-2 mb-2">
        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${strengthColor}`}
            style={{ width: `${strengthPercent}%` }}
          />
        </div>
        <span className={`text-xs font-semibold ${strengthTextColor} min-w-[40px]`}>{strengthLabel}</span>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
        {checks.map((check) => (
          <div key={check.label} className="flex items-center gap-1.5">
            {check.met ? (
              <svg className="w-3.5 h-3.5 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
            <span className={`text-xs ${check.met ? 'text-green-600' : 'text-gray-400'}`}>{check.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// Password Match Indicator Component
const PasswordMatchIndicator: React.FC<{ password: string; confirmPassword: string }> = ({ password, confirmPassword }) => {
  if (!confirmPassword) return null;

  const matches = password === confirmPassword;

  return (
    <div className="flex items-center gap-1.5 px-1 -mt-2 mb-4">
      {matches ? (
        <>
          <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-xs text-green-600 font-medium">Passwords match</span>
        </>
      ) : (
        <>
          <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
          <span className="text-xs text-red-500 font-medium">Passwords do not match</span>
        </>
      )}
    </div>
  );
};


// Move components outside to prevent recreation on every render
const InputField: React.FC<InputFieldProps> = ({ label, type = "text", value, onChange, placeholder, required, error }) => (
  <div className="mb-4" suppressHydrationWarning>
    <label className="block text-gray-700 text-sm font-medium mb-2">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={`w-full px-4 py-3 bg-gray-100 border-none rounded-full focus:outline-none focus:ring-2 transition-all text-black placeholder:text-black placeholder:opacity-60 ${error ? 'ring-2 ring-red-400' : 'focus:ring-green-400'
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
      className={`w-full px-4 py-3 bg-gray-100 border-none rounded-full focus:outline-none focus:ring-2 transition-all appearance-none text-black ${error ? 'ring-2 ring-red-400' : 'focus:ring-green-400'
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
        className={`w-full px-4 py-3 bg-gray-100 border-none rounded-full focus:outline-none focus:ring-2 transition-all pr-12 text-black placeholder:text-black placeholder:opacity-60 ${error ? 'ring-2 ring-red-400' : 'focus:ring-green-400'
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
        className={`w-full px-4 py-3 bg-gray-100 border-2 border-dashed rounded-2xl flex items-center justify-center cursor-pointer hover:border-green-400 transition-all ${error ? 'border-red-400' : 'border-gray-300'
          }`}
      >
        <Upload size={20} className="mr-2 text-gray-500" />
        <span className="text-gray-600">{fileName || 'Upload File'}</span>
      </label>
    </div>
    {error && <p className="text-red-500 text-xs mt-1 ml-4">{error}</p>}
  </div>
);

// Main Content Component
function AuthPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession(); // Get session status
  const [isLogin, setIsLogin] = useState<boolean>(true);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // OTP State
  const [isPhoneVerified, setIsPhoneVerified] = useState<boolean>(false);
  const [otpSent, setOtpSent] = useState<boolean>(false);
  const [otpInput, setOtpInput] = useState<string>('');
  const [otpTimer, setOtpTimer] = useState<number>(0);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState<boolean>(false);

  // Email OTP State
  const [isEmailVerified, setIsEmailVerified] = useState<boolean>(false);
  const [emailOtpSent, setEmailOtpSent] = useState<boolean>(false);
  const [emailOtpInput, setEmailOtpInput] = useState<string>('');
  const [emailOtpTimer, setEmailOtpTimer] = useState<number>(0);
  const [isVerifyingEmailOtp, setIsVerifyingEmailOtp] = useState<boolean>(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [otpTimer]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (emailOtpTimer > 0) {
      interval = setInterval(() => {
        setEmailOtpTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [emailOtpTimer]);

  useEffect(() => {
    // Redirect if already authenticated
    if (status === 'authenticated') {
      router.push('/dashboard');
    }
  }, [status, router]);

  useEffect(() => {
    const mode = searchParams.get('mode');
    const step = searchParams.get('step');

    if (mode === 'register') {
      setIsLogin(false);
      if (step) {
        const stepNum = parseInt(step);
        if (!isNaN(stepNum) && stepNum >= 1 && stepNum <= 3) {
          setCurrentStep(stepNum);
        }
      }
    } else {
      setIsLogin(true);
    }
  }, [searchParams]);

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
    acceptTerms: false
  });

  const provinces: string[] = ['Western', 'Central', 'Southern', 'Northern', 'Eastern', 'North Western', 'North Central', 'Uva', 'Sabaragamuwa'];
  const professions: string[] = ['Student', 'Engineer', 'Lawyer', 'Doctor', 'Teacher', 'Business Owner', 'Other'];

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!registerData.firstName.trim()) newErrors.firstName = 'First name is required';
      if (!registerData.lastName.trim()) newErrors.lastName = 'Last name is required';
      if (!registerData.email.trim()) {
        newErrors.email = 'Email is required';
      } else if (!/\S+@\S+\.\S+/.test(registerData.email)) {
        newErrors.email = 'Email is invalid';
      } else if (!isEmailVerified) {
        newErrors.email = 'Please verify your email address';
      }
      if (!registerData.mobilePhone.trim()) {
        newErrors.mobilePhone = 'Mobile phone is required';
      } else if (!isPhoneVerified) {
        newErrors.mobilePhone = 'Please verify your phone number';
      }
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

  const handleSendOtp = async () => {
    if (!registerData.mobilePhone.trim()) {
      setErrors({ ...errors, mobilePhone: 'Enter a valid phone number first' });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobilePhone: registerData.mobilePhone })
      });

      const data = await response.json();
      if (response.ok) {
        setOtpSent(true);
        setOtpTimer(60); // 60s cooldown
        alert('OTP sent successfully!');
      } else {
        alert(data.error || 'Failed to send OTP');
      }
    } catch (error) {
      console.error('OTP Send Error:', error);
      alert('Failed to send OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpInput) {
      alert('Please enter OTP');
      return;
    }
    setIsVerifyingOtp(true);
    try {
      const response = await fetch('/api/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobilePhone: registerData.mobilePhone, otp: otpInput })
      });

      const data = await response.json();
      if (response.ok) {
        setIsPhoneVerified(true);
        setOtpSent(false); // Hide OTP field
        setErrors({ ...errors, mobilePhone: '' }); // Clear error
        alert('Phone number verified successfully!');
      } else {
        alert(data.error || 'Invalid OTP');
      }
    } catch (error) {
      console.error('Verification Error:', error);
      alert('Verification failed');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleSendEmailOtp = async () => {
    if (!registerData.email.trim() || !/\S+@\S+\.\S+/.test(registerData.email)) {
      setErrors({ ...errors, email: 'Enter a valid email first' });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/otp/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: registerData.email })
      });

      const data = await response.json();
      if (response.ok) {
        setEmailOtpSent(true);
        setEmailOtpTimer(60); // 60s cooldown
        alert('Email OTP sent successfully!');
      } else {
        alert(data.error || 'Failed to send email OTP');
      }
    } catch (error) {
      console.error('Email OTP Send Error:', error);
      alert('Failed to send email OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyEmailOtp = async () => {
    if (!emailOtpInput) {
      alert('Please enter email OTP');
      return;
    }
    setIsVerifyingEmailOtp(true);
    try {
      const response = await fetch('/api/otp/email/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: registerData.email, otp: emailOtpInput })
      });

      const data = await response.json();
      if (response.ok) {
        setIsEmailVerified(true);
        setEmailOtpSent(false); // Hide OTP field
        setErrors({ ...errors, email: '' }); // Clear error
        alert('Email verified successfully!');
      } else {
        alert(data.error || 'Invalid email OTP');
      }
    } catch (error) {
      console.error('Email Verification Error:', error);
      alert('Email verification failed');
    } finally {
      setIsVerifyingEmailOtp(false);
    }
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
      if (currentStep < 3) {
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
        {[1, 2, 3].map((step, index) => (
          <React.Fragment key={step}>
            <div className="flex flex-col items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${currentStep >= step
                ? 'bg-green-500 text-white'
                : 'bg-gray-200 text-gray-500'
                }`}>
                {currentStep > step ? <CheckCircle size={20} /> : step}
              </div>
              <span className="text-xs mt-2 text-gray-600">
                {step === 1 && 'Personal Info'}
                {step === 2 && 'KYC'}
                {step === 3 && 'Terms'}
              </span>
            </div>
            {index < 2 && (
              <div className={`flex-1 h-1 mx-2 transition-all ${currentStep > step ? 'bg-green-500' : 'bg-gray-200'
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
                onChange={(e) => setLoginData({ ...loginData, emailOrPhone: e.target.value })}
                placeholder="Enter your Email or Phone"
              />

              <PasswordField
                label="Password"
                value={loginData.password}
                onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
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
                    onChange={(e) => setRegisterData({ ...registerData, firstName: e.target.value })}
                    placeholder="Enter your First Name"
                    required
                    error={errors.firstName}
                  />
                  <InputField
                    label="Last Name"
                    value={registerData.lastName}
                    onChange={(e) => setRegisterData({ ...registerData, lastName: e.target.value })}
                    placeholder="Enter your Last Name"
                    required
                    error={errors.lastName}
                  />
                </div>

                <div className="bg-gray-50 p-4 rounded-2xl mb-4 border border-gray-100">
                  <label className="block text-gray-700 text-sm font-medium mb-2">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <input
                        type="email"
                        value={registerData.email}
                        onChange={(e) => {
                          if (!isEmailVerified) {
                            setRegisterData({ ...registerData, email: e.target.value });
                          }
                        }}
                        disabled={isEmailVerified}
                        placeholder="Enter your Email"
                        className={`w-full px-4 py-3 bg-gray-100 border-none rounded-full focus:outline-none focus:ring-2 transition-all text-black placeholder:text-black placeholder:opacity-60 ${errors.email ? 'ring-2 ring-red-400' : isEmailVerified ? 'ring-2 ring-green-500 bg-green-50' : 'focus:ring-green-400'
                          }`}
                      />
                    </div>

                    {!isEmailVerified && /\S+@\S+\.\S+/.test(registerData.email) && !emailOtpSent && (
                      <button
                        onClick={handleSendEmailOtp}
                        disabled={isLoading || emailOtpTimer > 0}
                        className="px-6 py-2 bg-green-500 text-white rounded-full font-semibold hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all whitespace-nowrap shadow-sm"
                      >
                        {isLoading ? 'Sending...' : emailOtpTimer > 0 ? `Wait ${emailOtpTimer}s` : 'Verify'}
                      </button>
                    )}

                    {isEmailVerified && (
                      <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-full text-green-600">
                        <CheckCircle size={24} />
                      </div>
                    )}
                  </div>
                  {errors.email && <p className="text-red-500 text-xs mt-1 ml-4">{errors.email}</p>}

                  {emailOtpSent && !isEmailVerified && (
                    <div className="mt-4 animate-in fade-in slide-in-from-top-2">
                      <p className="text-black font-medium mb-2 text-center">Enter Email Verification Code</p>
                      <div className="flex gap-2 justify-center mb-4">
                        {[0, 1, 2, 3, 4, 5].map((index) => (
                          <input
                            key={`email-otp-${index}`}
                            id={`email-otp-${index}`}
                            type="text"
                            maxLength={1}
                            value={emailOtpInput[index] || ''}
                            onChange={(e) => {
                              const value = e.target.value;
                              if (!/^\d*$/.test(value)) return;

                              const newOtp = emailOtpInput.split('');
                              while (newOtp.length < 6) newOtp.push(''); // Ensure length
                              newOtp[index] = value;
                              const newOtpStr = newOtp.join('').substring(0, 6);
                              setEmailOtpInput(newOtpStr);

                              if (value && index < 5) {
                                const nextInput = document.getElementById(`email-otp-${index + 1}`);
                                nextInput?.focus();
                              }
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Backspace' && !emailOtpInput[index] && index > 0) {
                                const prevInput = document.getElementById(`email-otp-${index - 1}`);
                                prevInput?.focus();
                              }
                            }}
                            onPaste={(e) => {
                              e.preventDefault();
                              const pastedData = e.clipboardData.getData('text').slice(0, 6).replace(/\D/g, '');
                              if (pastedData) {
                                setEmailOtpInput(pastedData);
                                // Focus last filled
                                const targetIndex = Math.min(pastedData.length - 1, 5);
                                document.getElementById(`email-otp-${targetIndex}`)?.focus();
                              }
                            }}
                            className="w-10 h-12 text-center text-xl font-bold bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-black transition-all shadow-sm"
                          />
                        ))}
                      </div>
                      <div className="flex justify-center">
                        <button
                          onClick={handleVerifyEmailOtp}
                          disabled={isVerifyingEmailOtp || emailOtpInput.length !== 6}
                          className="px-8 py-2 bg-green-600 text-white rounded-full font-semibold hover:bg-green-700 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isVerifyingEmailOtp ? 'Verifying...' : 'Submit Code'}
                        </button>
                      </div>
                    </div>
                  )}
                  {emailOtpSent && !isEmailVerified && (
                    <div className="mt-2 text-center">
                      <button
                        onClick={handleSendEmailOtp}
                        disabled={emailOtpTimer > 0 || isLoading}
                        className="text-xs text-green-600 hover:underline disabled:text-gray-400 disabled:no-underline"
                      >
                        {emailOtpTimer > 0 ? `Resend code in ${emailOtpTimer}s` : 'Resend Code'}
                      </button>
                    </div>
                  )}
                </div>

                <div className="bg-gray-50 p-4 rounded-2xl mb-4 border border-gray-100">
                  <label className="block text-gray-700 text-sm font-medium mb-2">
                    Mobile Phone <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <input
                        type="tel"
                        value={registerData.mobilePhone}
                        onChange={(e) => {
                          if (!isPhoneVerified) {
                            setRegisterData({ ...registerData, mobilePhone: e.target.value });
                          }
                        }}
                        disabled={isPhoneVerified}
                        placeholder="Enter Mobile Phone number (e.g. 0712345678)"
                        className={`w-full px-4 py-3 bg-gray-100 border-none rounded-full focus:outline-none focus:ring-2 transition-all text-black placeholder:text-black placeholder:opacity-60 ${errors.mobilePhone ? 'ring-2 ring-red-400' : isPhoneVerified ? 'ring-2 ring-green-500 bg-green-50' : 'focus:ring-green-400'
                          }`}
                      />
                    </div>

                    {!isPhoneVerified && registerData.mobilePhone.length >= 10 && !otpSent && (
                      <button
                        onClick={handleSendOtp}
                        disabled={isLoading || otpTimer > 0}
                        className="px-6 py-2 bg-green-500 text-white rounded-full font-semibold hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all whitespace-nowrap shadow-sm"
                      >
                        {isLoading ? 'Sending...' : otpTimer > 0 ? `Wait ${otpTimer}s` : 'Verify'}
                      </button>
                    )}

                    {isPhoneVerified && (
                      <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-full text-green-600">
                        <CheckCircle size={24} />
                      </div>
                    )}
                  </div>
                  {errors.mobilePhone && <p className="text-red-500 text-xs mt-1 ml-4">{errors.mobilePhone}</p>}

                  {otpSent && !isPhoneVerified && (
                    <div className="mt-4 animate-in fade-in slide-in-from-top-2">
                      <p className="text-black font-medium mb-2 text-center">Enter Verification Code</p>
                      <div className="flex gap-2 justify-center mb-4">
                        {[0, 1, 2, 3, 4, 5].map((index) => (
                          <input
                            key={index}
                            id={`otp-${index}`}
                            type="text"
                            maxLength={1}
                            value={otpInput[index] || ''}
                            onChange={(e) => {
                              const value = e.target.value;
                              if (!/^\d*$/.test(value)) return;

                              const newOtp = otpInput.split('');
                              while (newOtp.length < 6) newOtp.push(''); // Ensure length
                              newOtp[index] = value;
                              const newOtpStr = newOtp.join('').substring(0, 6);
                              setOtpInput(newOtpStr);

                              if (value && index < 5) {
                                const nextInput = document.getElementById(`otp-${index + 1}`);
                                nextInput?.focus();
                              }
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Backspace' && !otpInput[index] && index > 0) {
                                const prevInput = document.getElementById(`otp-${index - 1}`);
                                prevInput?.focus();
                              }
                            }}
                            onPaste={(e) => {
                              e.preventDefault();
                              const pastedData = e.clipboardData.getData('text').slice(0, 6).replace(/\D/g, '');
                              if (pastedData) {
                                setOtpInput(pastedData);
                                // Focus last filled
                                const targetIndex = Math.min(pastedData.length - 1, 5);
                                document.getElementById(`otp-${targetIndex}`)?.focus();
                              }
                            }}
                            className="w-10 h-12 text-center text-xl font-bold bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-black transition-all shadow-sm"
                          />
                        ))}
                      </div>
                      <div className="flex justify-center">
                        <button
                          onClick={handleVerifyOtp}
                          disabled={isVerifyingOtp || otpInput.length !== 6}
                          className="px-8 py-2 bg-green-600 text-white rounded-full font-semibold hover:bg-green-700 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isVerifyingOtp ? 'Verifying...' : 'Submit Code'}
                        </button>
                      </div>
                    </div>
                  )}
                  {otpSent && !isPhoneVerified && (
                    <div className="mt-2 text-center">
                      <button
                        onClick={handleSendOtp}
                        disabled={otpTimer > 0 || isLoading}
                        className="text-xs text-green-600 hover:underline disabled:text-gray-400 disabled:no-underline"
                      >
                        {otpTimer > 0 ? `Resend code in ${otpTimer}s` : 'Resend Code'}
                      </button>
                    </div>
                  )}
                </div>

                <SelectField
                  label="Profession"
                  value={registerData.profession}
                  onChange={(e) => setRegisterData({ ...registerData, profession: e.target.value })}
                  options={professions}
                  required
                  error={errors.profession}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <SelectField
                    label="Province"
                    value={registerData.province}
                    onChange={(e) => setRegisterData({ ...registerData, province: e.target.value })}
                    options={provinces}
                    required
                    error={errors.province}
                  />
                  <InputField
                    label="District"
                    value={registerData.district}
                    onChange={(e) => setRegisterData({ ...registerData, district: e.target.value })}
                    placeholder="Enter your District"
                    required
                    error={errors.district}
                  />
                </div>

                <InputField
                  label="Address"
                  value={registerData.address}
                  onChange={(e) => setRegisterData({ ...registerData, address: e.target.value })}
                  placeholder="Enter your Address"
                  required
                  error={errors.address}
                />

                <PasswordField
                  label="Password"
                  value={registerData.password}
                  onChange={(e) => {
                    const newPassword = e.target.value;
                    const newErrors = { ...errors };

                    setRegisterData({ ...registerData, password: newPassword });

                    // Real-time validation for password
                    if (newPassword.length < 6) {
                      newErrors.password = 'Password must be at least 6 characters';
                    } else {
                      delete newErrors.password;
                    }

                    // Check if confirms still matches
                    if (registerData.confirmPassword && newPassword !== registerData.confirmPassword) {
                      newErrors.confirmPassword = 'Passwords do not match';
                    } else if (registerData.confirmPassword && newPassword === registerData.confirmPassword) {
                      delete newErrors.confirmPassword;
                    }

                    setErrors(newErrors);
                  }}
                  placeholder="Enter your Password"
                  show={showPassword}
                  toggleShow={() => setShowPassword(!showPassword)}
                  required
                  error={errors.password}
                />

                <PasswordStrengthIndicator password={registerData.password} />

                <PasswordField
                  label="Confirm Password"
                  value={registerData.confirmPassword}
                  onChange={(e) => {
                    const newConfirmPassword = e.target.value;
                    const newErrors = { ...errors };

                    setRegisterData({ ...registerData, confirmPassword: newConfirmPassword });

                    // Real-time validation for confirm password
                    if (registerData.password !== newConfirmPassword) {
                      newErrors.confirmPassword = 'Passwords do not match';
                    } else {
                      delete newErrors.confirmPassword;
                    }

                    setErrors(newErrors);
                  }}
                  placeholder="Confirm your Password"
                  show={showConfirmPassword}
                  toggleShow={() => setShowConfirmPassword(!showConfirmPassword)}
                  required
                  error={errors.confirmPassword}
                />

                <PasswordMatchIndicator password={registerData.password} confirmPassword={registerData.confirmPassword} />
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
                          onChange={(e) => setRegisterData({ ...registerData, documentType: e.target.value as 'NIC' | 'Passport' | 'Driving License' })}
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
              <div className="space-y-6 text-center py-8">
                <div className="bg-gray-50 rounded-2xl p-8 border border-gray-200">
                  <h2 className="text-2xl font-semibold text-gray-800 mb-4">Terms & Conditions</h2>
                  <p className="text-gray-600 mb-6">
                    Please read and accept our terms and conditions to complete your registration.
                  </p>

                  <Link
                    href="/terms"
                    target="_blank"
                    className="inline-flex items-center justify-center px-6 py-3 border border-green-500 text-green-600 font-semibold rounded-full hover:bg-green-50 transition-colors mb-6"
                  >
                    Read Terms & Conditions
                  </Link>

                  <div className="flex items-center justify-center gap-3">
                    <label className="flex items-center cursor-pointer gap-3 select-none">
                      <div className="relative flex items-center">
                        <input
                          type="checkbox"
                          checked={registerData.acceptTerms}
                          onChange={(e) => setRegisterData({ ...registerData, acceptTerms: e.target.checked })}
                          className="peer w-6 h-6 border-2 border-gray-300 rounded focus:ring-green-500 text-green-600 transition-all checked:border-green-500 checked:bg-green-500"
                        />
                        <CheckCircle size={16} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity" />
                      </div>
                      <span className="text-gray-700 font-medium">I agree to the Terms & Conditions</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-4 mt-8">
              {currentStep > 1 && (
                <button
                  onClick={handlePrevious}
                  disabled={isLoading}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-3 rounded-full transition-all disabled:opacity-50"
                >
                  Previous
                </button>
              )}

              {currentStep < 3 ? (
                <button
                  onClick={handleNext}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-full transition-all shadow-lg hover:shadow-xl"
                >
                  Next
                </button>
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

export default function AuthPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AuthPageContent />
    </Suspense>
  );
}