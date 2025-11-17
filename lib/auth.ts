// ============================================
// FILE 3: lib/auth.ts
// Auth Utility Functions (TypeScript)
// ============================================

import bcrypt from 'bcryptjs';

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword);
}

export function validateEmail(email: string): boolean {
  const re = /^\S+@\S+\.\S+$/;
  return re.test(email);
}

export function validatePhone(phone: string): boolean {
  const re = /^(\+94|0)?[0-9]{9,10}$/;
  return re.test(phone);
}

export function validatePassword(password: string): boolean {
  if (password.length < 6) return false;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  return hasUpper && hasLower && hasNumber;
}