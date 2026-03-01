'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ChangePasswordModal({ isOpen, onClose }: ChangePasswordModalProps) {
  const supabase = createClient();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleChange = async () => {
    setError(null);
    setSuccess(null);
    if (!newPassword || newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      // Supabase allows updating password for the current session
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
      if (updateError) {
        setError(updateError.message);
      } else {
        setSuccess('Password changed');
        setTimeout(onClose, 800);
      }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to change password';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center px-4">
      <div onClick={onClose} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

      <div className="relative w-full max-w-lg bg-[#151515] rounded-xl overflow-hidden border border-white/5">
        <div className="absolute top-0 left-0 w-3 h-3 border-l-2 border-t-2 border-arena-red rounded-tl-sm" />
        <div className="absolute top-0 right-0 w-3 h-3 border-r-2 border-t-2 border-arena-red rounded-tr-sm" />
        <div className="absolute bottom-0 left-0 w-3 h-3 border-l-2 border-b-2 border-arena-red rounded-bl-sm" />
        <div className="absolute bottom-0 right-0 w-3 h-3 border-r-2 border-b-2 border-arena-red rounded-br-sm" />

        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        <div className="p-6">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-6 h-6 text-arena-red" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c1.657 0 3 1.343 3 3v3H9v-3c0-1.657 1.343-3 3-3zm0-7a5 5 0 00-5 5v3h10V9a5 5 0 00-5-5z" /></svg>
            <h2 className="text-3xl font-orbitron font-bold text-white tracking-widest">CHANGE PASSWORD</h2>
          </div>
          <div className="space-y-4 mt-4">
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Current Password *</label>
              <input type="password" value={currentPassword} onChange={(e)=>setCurrentPassword(e.target.value)} className="mt-1 w-full bg-black/40 border border-white/10 rounded-lg text-white px-4 py-3" placeholder="Enter current password" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">New Password *</label>
              <input type="password" value={newPassword} onChange={(e)=>setNewPassword(e.target.value)} className="mt-1 w-full bg-black/40 border border-white/10 rounded-lg text-white px-4 py-3" placeholder="Enter new password" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Confirm New Password *</label>
              <input type="password" value={confirmPassword} onChange={(e)=>setConfirmPassword(e.target.value)} className="mt-1 w-full bg-black/40 border border-white/10 rounded-lg text-white px-4 py-3" placeholder="Re-enter new password" />
            </div>
          </div>

          {error && <div className="mt-4 text-sm text-red-400">{error}</div>}
          {success && <div className="mt-4 text-sm text-green-400 sop">{success}</div>}

          <div className="mt-6 flex gap-3">
            <button onClick={onClose} className="flex-1 bg-black/40 border border-white/10 text-white rounded-lg py-3 font-bold uppercase tracking-widest">Cancel</button>
            <button onClick={handleChange} disabled={loading} className="flex-1 bg-arena-red text-white rounded-lg py-3 font-bold uppercase tracking-widest hover:bg-red-700 disabled:opacity-50">{loading ? 'Changing...' : 'Change Password'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
