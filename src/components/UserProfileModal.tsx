import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Mail,
  ShieldCheck,
  Lock,
  CheckCircle2,
  AlertCircle,
  LogOut,
  Clock,
  Loader2,
  Printer,
} from 'lucide-react';
import { AuthUser } from '../types/auth';
import { USER_AVATAR_URL } from '../data/initialFinanceData';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: AuthUser;
  token: string;
  sessionExpiresAt: number | null;
  onUserUpdated: (updated: AuthUser) => void;
  onLogout: () => void;
  onSimulateExpireSession: () => void;
  onPrintReport: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  user,
  token,
  sessionExpiresAt,
  onUserUpdated,
  onLogout,
  onSimulateExpireSession,
  onPrintReport,
}) => {
  const [fullName, setFullName] = useState(user.fullName);
  const [email, setEmail] = useState(user.email);
  const [role, setRole] = useState(user.role);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    setFullName(user.fullName);
    setEmail(user.email);
    setRole(user.role);
    setCurrentPassword('');
    setNewPassword('');
    setSuccessMsg(null);
    setErrorMsg(null);
  }, [user, isOpen]);

  if (!isOpen) return null;

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const response = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          fullName,
          email,
          role,
          currentPassword: currentPassword || undefined,
          newPassword: newPassword || undefined,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setErrorMsg(data.error || 'Could not update profile.');
        setLoading(false);
        return;
      }

      onUserUpdated(data.user);
      setCurrentPassword('');
      setNewPassword('');
      setSuccessMsg('Profile and security settings updated successfully.');
    } catch {
      setErrorMsg('Network error while saving profile.');
    } finally {
      setLoading(false);
    }
  };

  const formattedExpiry = sessionExpiresAt
    ? new Date(sessionExpiresAt).toLocaleString()
    : 'Active Session';

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/45 flex items-center justify-center p-4 no-print">
      <div className="bg-white border border-[#dce1ec] rounded-[3px] shadow-2xl w-full max-w-[620px] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-[#f8f9fc] border-b border-[#dce1ec] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={USER_AVATAR_URL}
              alt={user.fullName}
              referrerPolicy="no-referrer"
              className="w-10 h-10 rounded-full object-cover border border-[#dce1ec]"
            />
            <div>
              <h2 className="font-display text-[16px] font-bold text-[#1c273c]">
                {user.fullName}
              </h2>
              <p className="text-[12px] text-[#596882]">
                {user.email} · {user.role}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#596882] hover:text-[#1c273c] hover:bg-[#e2e7f1] rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSaveProfile} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-[#fef2f2] border border-[#fecaca] rounded-[2px] flex items-center gap-2 text-[12.5px] text-[#b91c1c]">
              <AlertCircle className="w-4 h-4 text-[#dc3545] shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-[#f0fdf4] border border-[#bbf7d0] rounded-[2px] flex items-center gap-2 text-[12.5px] text-[#15803d]">
              <CheckCircle2 className="w-4 h-4 text-[#2eb82e] shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Session Security Info Banner */}
          <div className="p-3.5 bg-[#f8f9fc] border border-[#dce1ec] rounded-[2px] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[12px]">
            <div className="flex items-center gap-2 text-[#1c273c]">
              <ShieldCheck className="w-4 h-4 text-[#2eb82e] shrink-0" />
              <span>
                <strong>Authenticated via JWT</strong> · Expires: {formattedExpiry}
              </span>
            </div>
            <button
              type="button"
              onClick={onSimulateExpireSession}
              className="text-[11.5px] text-[#d97706] hover:underline font-medium flex items-center gap-1 shrink-0"
            >
              <Clock className="w-3.5 h-3.5" /> Test Session Expiration
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold uppercase text-[#596882] mb-1">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-[#7987a1] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full h-[38px] pl-9 pr-3 border border-[#dce1ec] rounded-[2px] text-[13px] text-[#1c273c] focus:outline-none focus:border-[#5b47fb]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-[#596882] mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#7987a1] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-[38px] pl-9 pr-3 border border-[#dce1ec] rounded-[2px] text-[13px] text-[#1c273c] focus:outline-none focus:border-[#5b47fb]"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold uppercase text-[#596882] mb-1">
                Title / Role
              </label>
              <input
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full h-[38px] px-3 border border-[#dce1ec] rounded-[2px] text-[13px] text-[#1c273c] focus:outline-none focus:border-[#5b47fb]"
              />
            </div>
          </div>

          <div className="pt-2 border-t border-[#eef1f7]">
            <div className="text-[11.5px] font-bold uppercase text-[#1c273c] mb-2.5">
              Change Password (Optional)
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold uppercase text-[#596882] mb-1">
                  Current Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#7987a1] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Leave blank to keep current"
                    className="w-full h-[38px] pl-9 pr-3 border border-[#dce1ec] rounded-[2px] text-[12.5px] text-[#1c273c] focus:outline-none focus:border-[#5b47fb]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-[#596882] mb-1">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#7987a1] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min 8 chars, upper, num, symbol"
                    className="w-full h-[38px] pl-9 pr-3 border border-[#dce1ec] rounded-[2px] text-[12.5px] text-[#1c273c] focus:outline-none focus:border-[#5b47fb]"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-[#eef1f7] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onLogout}
                className="px-3.5 py-2 bg-[#fef2f2] hover:bg-[#fee2e2] text-[#dc3545] text-[12.5px] font-medium rounded-[2px] flex items-center gap-1.5 transition-colors"
              >
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
              <button
                type="button"
                onClick={onPrintReport}
                className="px-3.5 py-2 bg-[#f8f9fc] hover:bg-[#eef1f7] border border-[#dce1ec] text-[#1c273c] text-[12.5px] font-medium rounded-[2px] flex items-center gap-1.5 transition-colors"
              >
                <Printer className="w-3.5 h-3.5 text-[#596882]" /> Print Report
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-[#dce1ec] text-[#596882] hover:text-[#1c273c] text-[12.5px] font-medium rounded-[2px]"
              >
                Close
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 bg-[#5b47fb] hover:bg-[#4a36e8] text-white text-[12.5px] font-medium rounded-[2px] flex items-center gap-1.5 transition-colors"
              >
                {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Save Profile
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
