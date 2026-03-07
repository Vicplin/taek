'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import GamingButton from '@/components/shared/GamingButton';

interface StaffUser {
  id: string;
  email: string;
  full_name: string;
  role: string;
  phone: string;
  created_at: string;
}

export default function StaffManagement() {
  const [staff, setStaff] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'coach' | 'organiser'>('coach');
  const [creating, setCreating] = useState(false);

  const supabase = createClient();

  const fetchStaff = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Get the latest session
      const { data: { session } } = await supabase.auth.getSession();
      
      // 2. If no session, try refreshing via getUser() (sometimes helps if session is stale)
      if (!session) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
           setError('Not authenticated');
           setLoading(false);
           return;
        }
      }

      // 3. Get the token again to be sure we have the latest
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      
      if (!currentSession?.access_token) {
         setError('No active session token');
         setLoading(false);
         return;
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const response = await fetch(`${apiUrl}/api/admin/staff`, {
        headers: {
          'Authorization': `Bearer ${currentSession.access_token}`
        }
      });

      if (!response.ok) {
         if (response.status === 401) {
            // Token might be expired or invalid
            setError('Unauthorized. Please refresh the page or login again.');
         } else {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.error || 'Failed to fetch staff list');
         }
         return;
      }

      const data = await response.json();
      setStaff(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to load staff');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError(null);
    setSuccess(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('Not authenticated');
        return;
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const response = await fetch(`${apiUrl}/api/admin/create-staff`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          email,
          password,
          fullName,
          phoneNumber: phone,
          role
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create staff account');
      }

      setSuccess(`Successfully created ${role} account for ${fullName}`);
      
      // Reset form
      setEmail('');
      setPassword('');
      setFullName('');
      setPhone('');
      setRole('coach');
      
      // Refresh list
      fetchStaff();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to create staff');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-8 w-full max-w-6xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Create Staff Form */}
        <div className="lg:col-span-1">
          <div className="bg-[#151515] border border-white/10 rounded-xl p-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-3 h-3 border-l-2 border-t-2 border-arena-red rounded-tl-sm" />
            <div className="absolute top-0 right-0 w-3 h-3 border-r-2 border-t-2 border-arena-red rounded-tr-sm" />
            <div className="absolute bottom-0 left-0 w-3 h-3 border-l-2 border-b-2 border-arena-red rounded-bl-sm" />
            <div className="absolute bottom-0 right-0 w-3 h-3 border-r-2 border-b-2 border-arena-red rounded-br-sm" />
            
            <h2 className="text-xl font-orbitron font-bold text-white mb-6 tracking-widest uppercase">
              Create Staff
            </h2>

            <form onSubmit={handleCreateStaff} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-arena-red focus:ring-1 focus:ring-arena-red outline-none transition-colors"
                  placeholder="John Doe"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-arena-red focus:ring-1 focus:ring-arena-red outline-none transition-colors"
                  placeholder="john@example.com"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-arena-red focus:ring-1 focus:ring-arena-red outline-none transition-colors"
                  placeholder="+60123456789"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-arena-red focus:ring-1 focus:ring-arena-red outline-none transition-colors"
                  placeholder="••••••••"
                  minLength={6}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Role
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as 'coach' | 'organiser')}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-arena-red focus:ring-1 focus:ring-arena-red outline-none transition-colors appearance-none"
                >
                  <option value="coach">Coach</option>
                  <option value="organiser">Organiser</option>
                </select>
              </div>

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded text-red-400 text-sm">
                  {error}
                </div>
              )}

              {success && (
                <div className="p-3 bg-green-500/10 border border-green-500/20 rounded text-green-400 text-sm">
                  {success}
                </div>
              )}

              <GamingButton
                type="submit"
                fullWidth
                disabled={creating}
                className="mt-2"
              >
                {creating ? 'Creating...' : 'Create Account'}
              </GamingButton>
            </form>
          </div>
        </div>

        {/* Staff List */}
        <div className="lg:col-span-2">
          <div className="bg-[#151515] border border-white/10 rounded-xl p-6 relative min-h-[400px]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-orbitron font-bold text-white tracking-widest uppercase">
                Staff Members
              </h2>
              <button 
                onClick={fetchStaff}
                className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                title="Refresh List"
              >
                <svg className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>

            {loading && staff.length === 0 ? (
              <div className="flex items-center justify-center h-64 text-gray-500">
                Loading staff members...
              </div>
            ) : staff.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                <p className="mb-2">No staff members found.</p>
                <p className="text-xs">Create a new staff account to get started.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-white/5 text-gray-400 uppercase text-xs font-bold tracking-wider">
                    <tr>
                      <th className="px-4 py-3 rounded-tl-lg">Name</th>
                      <th className="px-4 py-3">Role</th>
                      <th className="px-4 py-3">Email</th>
                      <th className="px-4 py-3">Phone</th>
                      <th className="px-4 py-3 rounded-tr-lg">Joined</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {staff.map((user) => (
                      <tr key={user.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-4 py-3 font-bold text-white">{user.full_name || '-'}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize border ${
                            user.role === 'organiser' 
                              ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' 
                              : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-300">{user.email}</td>
                        <td className="px-4 py-3 text-gray-300">{user.phone || '-'}</td>
                        <td className="px-4 py-3 text-gray-400">
                          {new Date(user.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
