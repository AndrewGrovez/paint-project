'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabaseClient } from '@/lib/supabaseClient'
import { LogOut, Home } from 'lucide-react'

// Define user metadata interface, etc. (as shown previously)
interface SupabaseUserMetadata {
  first_name?: string;
  last_name?: string;
}

interface SupabaseUser {
  id: string;
  email?: string;
  user_metadata: SupabaseUserMetadata;
}

export default function DashboardHeader() {
  const router = useRouter();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabaseClient.auth.getUser();
      if (user) {
        setUser(user as SupabaseUser);
      }
    }
    fetchUser();
  }, []);

  const handleSignOut = async () => {
    await supabaseClient.auth.signOut();
    router.push('/login');
  };

  const firstInitial = user?.user_metadata?.first_name
    ? user.user_metadata.first_name.charAt(0).toUpperCase()
    : 'U';

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(prev => !prev)}
        className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold focus:outline-none"
      >
        {firstInitial}
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
            My Products
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
  );
}