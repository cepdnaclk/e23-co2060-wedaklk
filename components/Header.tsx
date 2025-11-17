// components/Header.tsx (or components/Header.jsx)

import Link from 'next/link';
import Image from 'next/image';

export default function Header() {
  return (
    <header className="bg-gradient-to-r from-green-50 to-white shadow-sm border-b border-green-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center hover:opacity-80 transition-opacity">
            <Image
              src="/logo.svg"
              alt="Logo"
              width={40}
              height={40}
              className="h-18 w-auto"
            />
          </Link>

          {/* Navigation */}
          <nav className="flex items-center space-x-8">
            <Link
              href="/about"
              className="text-gray-700 hover:text-green-600 font-medium transition-colors"
            >
              About Us
            </Link>
            <Link
              href="/contact"
              className="bg-green-500 text-white px-6 py-2 rounded-full hover:bg-green-600 transition-colors font-medium shadow-md"
            >
              Contact
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
