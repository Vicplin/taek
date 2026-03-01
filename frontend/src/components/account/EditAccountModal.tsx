'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

interface EditAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  initialFullName: string;
  initialEmail: string;
  initialPhone: string;
  isParent?: boolean;
  onSave?: (payload: { isParent: boolean; fullName: string; email: string; phone: string }) => void;
}

export default function EditAccountModal({
  isOpen,
  onClose,
  userId,
  initialFullName,
  initialEmail,
  initialPhone,
  isParent = false,
  onSave,
}: EditAccountModalProps) {
  const supabase = createClient();
  const [fullName, setFullName] = useState(initialFullName);
  const [email, setEmail] = useState(initialEmail);
  const [phone, setPhone] = useState(initialPhone);
  const [parentAcc, setParentAcc] = useState(isParent);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    setFullName(initialFullName);
    setEmail(initialEmail);
    setPhone(initialPhone);
    setParentAcc(isParent);
  }, [initialFullName, initialEmail, initialPhone, isParent]);

  if (!isOpen) return null;

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await supabase
        .from('profiles')
        .upsert({ id: userId, full_name: fullName, phone_number: phone });

      if (email && email !== initialEmail) {
        const { error: emailError } = await supabase.auth.updateUser({ email });
        if (emailError) {
          setError(emailError.message);
        }
      }

      const effectiveParent = isParent ? true : parentAcc;
      const { error: metaError } = await supabase.auth.updateUser({ data: { is_parent: effectiveParent } });
      if (metaError) {
        console.warn('Failed to update user metadata is_parent:', metaError.message);
      }

      setSuccess('Account updated');
      onSave?.({ isParent: effectiveParent, fullName, email, phone });
      setTimeout(onClose, 800);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to update account';
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
          <h2 className="text-3xl font-orbitron font-bold text-white mb-6 tracking-widest">EDIT ACCOUNT</h2>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Full Name *</label>
              <input value={fullName} onChange={(e) => setFullName(e.target.value)} className="mt-1 w-full bg-black/40 border border-white/10 rounded-lg text-white px-4 py-3" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Email Address *</label>
              <input value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full bg-black/40 border border-white/10 rounded-lg text-white px-4 py-3" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Phone Number *</label>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1 w-full bg-black/40 border border-white/10 rounded-lg text-white px-4 py-3" />
            </div>

            <div className="pt-4 border-t border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">Parent Account</div>
                  <div className="text-xs text-gray-500">{isParent ? 'Parent account is enabled. You can add multiple players to your account.' : parentAcc ? 'You can add multiple players to your account' : 'You can only add 1 player (upgrade to parent account for multiple players)'}</div>
                </div>
                <button
                  type="button"
                  disabled={isParent}
                  onClick={isParent ? undefined : () => setParentAcc(!parentAcc)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${isParent || parentAcc ? 'bg-white' : 'bg-gray-700'} ${isParent ? 'opacity-60 cursor-not-allowed' : ''}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-[#151515] transition-transform ${isParent || parentAcc ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
            </div>
          </div>

          {error && <div className="mt-4 text-sm text-red-400">{error}</div>}
          {success && <div className="mt-4 text-sm text-green-400">{success}</div>}

          <div className="mt-6 flex gap-3">
            <button onClick={onClose} className="flex-1 bg-black/40 border border-white/10 text-white rounded-lg py-3 font-bold uppercase tracking-widest">Cancel</button>
            <button onClick={handleSave} disabled={loading} className="flex-1 bg-arena-red text-white rounded-lg py-3 font-bold uppercase tracking-widest hover:bg-red-700 disabled:opacity-50">{loading ? 'Saving...' : 'Save Changes'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
