'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabaseClient } from '@/lib/supabaseClient'
import { LogOut, Home } from 'lucide-react'

export default function DashboardHeader() {
  const router = useRouter();
  const [showDropdown, setShowDropdown] = useState(false);

  const handleSignOut = async () => {
    await supabaseClient.auth.signOut();
    router.push('/login');
  };

  return (
    <div className="flex justify-between items-center w-full">
      <Link href="/dashboard" className="text-3xl font-bold text-gray-900 hover:text-gray-700 transition-colors">
        Decorating Deals
      </Link>
      <div className="relative">
        <button
          onClick={() => setShowDropdown(prev => !prev)}
          className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center focus:outline-none"
          aria-label="User menu"
        >
          <svg
            className="w-6 h-6"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
        </button>
        {showDropdown && (
          <div className="absolute right-0 mt-2 w-48 bg-white border rounded shadow-lg z-10">
            <button
              onClick={() => {
                setShowDropdown(false);
                router.push('/tracked-products');
              }}
              className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2"
            >
              <Home className="h-4 w-4" />
              Tracked Products
            </button>
            <button
              onClick={() => {
                setShowDropdown(false);
                handleSignOut();
              }}
              className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        )}
      </div>
    </div>
  );
}