// ============================================
// FILE: app/page.tsx
// Landing Page - Login/Register (TypeScript)
// ============================================

'use client';

import React, { useState, ChangeEvent, useEffect, Suspense } from 'react';
import { signIn } from 'next-auth/react';
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
  const [isLogin, setIsLogin] = useState<boolean>(true);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

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

                <InputField
                  label="Email"
                  type="email"
                  value={registerData.email}
                  onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                  placeholder="Enter your Email"
                  required
                  error={errors.email}
                />

                <InputField
                  label="Mobile Phone"
                  type="tel"
                  value={registerData.mobilePhone}
                  onChange={(e) => setRegisterData({ ...registerData, mobilePhone: e.target.value })}
                  placeholder="Enter your Mobile Phone"
                  required
                  error={errors.mobilePhone}
                />

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
                  onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                  placeholder="Enter your Password"
                  show={showPassword}
                  toggleShow={() => setShowPassword(!showPassword)}
                  required
                  error={errors.password}
                />

                <PasswordField
                  label="Confirm Password"
                  value={registerData.confirmPassword}
                  onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
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