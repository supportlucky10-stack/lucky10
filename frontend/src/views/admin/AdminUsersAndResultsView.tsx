import React, { useState, useEffect } from 'react';
import { HeaderBanner } from '../../components/HeaderBanner';
import { useApp } from '../../context/AppContext';
import type { UserAccount } from '../../types';
import { Calendar, Users, UserPlus, X, Check, Eye, EyeOff, AlertTriangle, Power, Trash2, KeyRound, Percent } from 'lucide-react';

const formatDateDDMMYY = (dateStr?: string): string => {
  if (!dateStr) return '';
  const cleanDate = dateStr.split('T')[0].split(' ')[0];
  const parts = cleanDate.split('-');
  if (parts.length === 3) {
    const [y, m, d] = parts;
    const shortY = y.length === 4 ? y.slice(2) : y;
    return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${shortY}`;
  }
  return dateStr;
};

export const AdminUsersAndResultsView: React.FC = () => {
  const { registeredUsers, createUser, deleteUser, changeUserPassword, updateUserMode, toggleUserStatus, toggleAllUsersStatus, refreshAllData } = useApp();

  useEffect(() => {
    refreshAllData();
  }, []);
  const [userToDelete, setUserToDelete] = useState<{ id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Edit Commission State
  const [userToEditMode, setUserToEditMode] = useState<UserAccount | null>(null);
  const [selectedEditCommissionRate, setSelectedEditCommissionRate] = useState<'20%' | '30%' | 'Without Commission'>('20%');
  const [isUpdatingMode, setIsUpdatingMode] = useState<boolean>(false);

  // Change Password State
  const [userToChangePassword, setUserToChangePassword] = useState<{ id: string; name: string; username?: string } | null>(null);
  const [newUserPassword, setNewUserPassword] = useState<string>('');
  const [confirmNewUserPassword, setConfirmNewUserPassword] = useState<string>('');
  const [showNewUserPassword, setShowNewUserPassword] = useState<boolean>(false);
  const [showConfirmNewUserPassword, setShowConfirmNewUserPassword] = useState<boolean>(false);
  const [passwordChangeError, setPasswordChangeError] = useState<string>('');
  const [isChangingPassword, setIsChangingPassword] = useState<boolean>(false);

  // Create User Form State
  const [showCreateForm, setShowCreateForm] = useState<boolean>(false);
  const [agencyName, setAgencyName] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [formError, setFormError] = useState<string>('');
  const [commissionRate, setCommissionRate] = useState<'20%' | '30%'>('20%');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const passwordsMismatch = Boolean(password && confirmPassword && password !== confirmPassword);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!agencyName.trim()) {
      setFormError('Please enter an Agency Name');
      return;
    }
    if (!username.trim()) {
      setFormError('Please enter a Username');
      return;
    }
    if (!password.trim()) {
      setFormError('Please enter Password');
      return;
    }
    if (password !== confirmPassword) {
      setFormError('Passwords do not match. Please retype password correctly.');
      return;
    }

    const finalMode = commissionRate === '30%' ? 'With Commission (30%)' : 'With Commission (20%)';

    setIsSubmitting(true);
    try {
      const ok = await createUser(agencyName.trim(), username.trim(), password.trim(), finalMode);
      if (ok) {
        setAgencyName('');
        setUsername('');
        setPassword('');
        setConfirmPassword('');
        setCommissionRate('20%');
        setShowCreateForm(false);
      }
    } catch (err: any) {
      setFormError(err?.message || 'Failed to create user. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveCommissionRate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userToEditMode) return;
    const finalMode = selectedEditCommissionRate === '30%'
      ? 'With Commission (30%)'
      : selectedEditCommissionRate === 'Without Commission'
      ? 'Without Commission'
      : 'With Commission (20%)';

    setIsUpdatingMode(true);
    try {
      const ok = await updateUserMode(userToEditMode.id, finalMode);
      if (ok) {
        setUserToEditMode(null);
      }
    } finally {
      setIsUpdatingMode(false);
    }
  };

  const handleSaveNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordChangeError('');

    if (!newUserPassword.trim()) {
      setPasswordChangeError('Please enter a new password');
      return;
    }
    if (newUserPassword !== confirmNewUserPassword) {
      setPasswordChangeError('Passwords do not match. Please retype password correctly.');
      return;
    }
    if (!userToChangePassword) return;

    setIsChangingPassword(true);
    try {
      const ok = await changeUserPassword(userToChangePassword.id, newUserPassword.trim());
      if (ok) {
        setUserToChangePassword(null);
      }
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-black text-white flex flex-col justify-start overflow-y-auto pb-16 select-none font-sans relative">
      <HeaderBanner title="Users List" />

      <div className="px-4 sm:px-6 py-5 space-y-4 max-w-4xl mx-auto w-full">
        <div className="flex flex-wrap items-center justify-between gap-3 bg-neutral-950 p-3.5 rounded-2xl border border-neutral-800 shadow-md">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-gold" />
            <h2 className="text-base font-extrabold text-white">
              Users List ({registeredUsers.length})
            </h2>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {registeredUsers.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  const anyActive = registeredUsers.some((u) => u.isActive !== false);
                  toggleAllUsersStatus(!anyActive);
                }}
                className={`px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-sm border ${
                  registeredUsers.some((u) => u.isActive !== false)
                    ? 'bg-rose-950/70 hover:bg-rose-900 border-rose-600/80 text-rose-300'
                    : 'bg-emerald-950/70 hover:bg-emerald-900 border-emerald-600/80 text-emerald-300'
                }`}
              >
                <Power className="w-3.5 h-3.5" />
                <span>
                  {registeredUsers.some((u) => u.isActive !== false)
                    ? 'Deactivate All Users'
                    : 'Activate All Users'}
                </span>
              </button>
            )}

            <button
              onClick={() => {
                setShowCreateForm(true);
                setFormError('');
              }}
              className="px-3 py-2 bg-gold-metallic text-black font-extrabold text-xs rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer transition-all hover:opacity-95 active:scale-95"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ Create User</span>
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {registeredUsers.length === 0 ? (
            <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-8 text-center text-neutral-500 italic text-xs">
              No users registered yet.
            </div>
          ) : (
            registeredUsers.map((u) => {
              const isUserActive = u.isActive !== false;
              return (
                <div
                  key={u.id}
                  className={`p-4 bg-neutral-950 border rounded-xl space-y-3 transition-colors shadow-md ${
                    isUserActive ? 'border-neutral-800 hover:border-gold/30' : 'border-rose-950/80 bg-neutral-950/90'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-extrabold text-white text-base block">{u.name}</span>
                        <span className="bg-gold/15 border border-gold/40 text-gold text-[10px] font-extrabold px-2 py-0.5 rounded-md">
                          {(u.mode || 'Commission (20%)').replace(/^With\s+/i, '')}
                        </span>
                        <span
                          className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md flex items-center gap-1 border ${
                            isUserActive
                              ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                              : 'bg-rose-500/15 border-rose-500/40 text-rose-400'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isUserActive ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'
                            }`}
                          />
                          {isUserActive ? 'Active' : 'Deactivated'}
                        </span>
                      </div>
                      <div className="text-neutral-400 text-xs font-mono flex items-center gap-1.5 mt-1">
                        <span>Username: <strong className="text-neutral-200 font-bold">{u.username || u.name}</strong></span>
                      </div>
                      <span className="text-neutral-500 text-xs font-mono flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3.5 h-3.5 text-gold shrink-0" /> Create Date: {formatDateDDMMYY(u.createdAt)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => {
                          setUserToEditMode(u);
                          const m = u.mode || '';
                          if (m.includes('30')) setSelectedEditCommissionRate('30%');
                          else if (m.includes('Without') || m === '0%') setSelectedEditCommissionRate('Without Commission');
                          else setSelectedEditCommissionRate('20%');
                        }}
                        className="px-2.5 py-1.5 bg-yellow-950/60 hover:bg-yellow-900/80 border border-gold/60 text-gold rounded-lg text-xs font-extrabold transition-all inline-flex items-center gap-1.5 cursor-pointer shrink-0 shadow-sm"
                        title={`Change commission rate for ${u.name}`}
                      >
                        <Percent className="w-3.5 h-3.5 text-gold shrink-0" />
                        <span>Commission</span>
                      </button>

                      <button
                        onClick={() => toggleUserStatus(u.id)}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-extrabold transition-all inline-flex items-center gap-1.5 cursor-pointer shrink-0 shadow-sm border ${
                          isUserActive
                            ? 'bg-emerald-950/60 hover:bg-emerald-900/80 border-emerald-500/60 text-emerald-300'
                            : 'bg-rose-950/50 hover:bg-rose-900/80 border-rose-500/60 text-rose-300'
                        }`}
                        title={isUserActive ? `Click to deactivate ${u.name}` : `Click to activate ${u.name}`}
                      >
                        <Power className={`w-3.5 h-3.5 shrink-0 ${isUserActive ? 'text-emerald-400' : 'text-rose-400'}`} />
                        <span>{isUserActive ? 'Active' : 'Deactivate'}</span>
                      </button>

                      <button
                        onClick={() => {
                          setUserToChangePassword(u);
                          setNewUserPassword('');
                          setConfirmNewUserPassword('');
                          setShowNewUserPassword(false);
                          setShowConfirmNewUserPassword(false);
                          setPasswordChangeError('');
                        }}
                        className="px-2.5 py-1.5 bg-blue-950/50 hover:bg-blue-900/80 border border-blue-500/60 text-blue-300 rounded-lg text-xs font-extrabold transition-all inline-flex items-center gap-1.5 cursor-pointer shrink-0 shadow-sm"
                        title={`Change password for ${u.name}`}
                      >
                        <KeyRound className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                        <span>Change Password</span>
                      </button>

                      <button
                        onClick={() => setUserToDelete(u)}
                        className="px-2.5 py-1.5 bg-rose-950/50 hover:bg-rose-900/80 border border-rose-500/60 text-rose-300 rounded-lg text-xs font-extrabold transition-all inline-flex items-center gap-1.5 cursor-pointer shrink-0 shadow-sm"
                        title={`Delete ${u.name}`}
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* EDIT COMMISSION MODAL */}
      {userToEditMode && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-neutral-950 border-2 border-gold rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-4 animate-drop-in text-white font-sans">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gold/20 border border-gold flex items-center justify-center text-gold">
                  <Percent className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-white">Set Commission Rate</h3>
                  <p className="text-[10px] text-neutral-400 font-mono">{userToEditMode.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setUserToEditMode(null)}
                className="text-neutral-400 hover:text-white p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCommissionRate} className="space-y-4">
              <div className="space-y-2">
                <label className="block text-neutral-400 font-bold uppercase text-[10px]">
                  Select Commission Percentage :
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedEditCommissionRate('20%')}
                    className={`py-2 px-2 text-xs font-bold rounded-xl border transition-all cursor-pointer text-center ${
                      selectedEditCommissionRate === '20%'
                        ? 'bg-gold-metallic text-black border-gold font-extrabold shadow-md'
                        : 'bg-neutral-900 text-neutral-400 border-neutral-700 hover:text-white'
                    }`}
                  >
                    20%
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedEditCommissionRate('30%')}
                    className={`py-2 px-2 text-xs font-bold rounded-xl border transition-all cursor-pointer text-center ${
                      selectedEditCommissionRate === '30%'
                        ? 'bg-gold-metallic text-black border-gold font-extrabold shadow-md'
                        : 'bg-neutral-900 text-neutral-400 border-neutral-700 hover:text-white'
                    }`}
                  >
                    30%
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedEditCommissionRate('Without Commission')}
                    className={`py-2 px-2 text-[11px] font-bold rounded-xl border transition-all cursor-pointer text-center ${
                      selectedEditCommissionRate === 'Without Commission'
                        ? 'bg-gold-metallic text-black border-gold font-extrabold shadow-md'
                        : 'bg-neutral-900 text-neutral-400 border-neutral-700 hover:text-white'
                    }`}
                  >
                    0% (None)
                  </button>
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setUserToEditMode(null)}
                  className="w-1/2 py-2 bg-neutral-900 border border-neutral-700 text-neutral-300 rounded-xl text-xs font-bold hover:bg-neutral-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingMode}
                  className="w-1/2 py-2 bg-gold-metallic text-black font-black text-xs rounded-xl shadow hover:opacity-95 disabled:opacity-50 cursor-pointer"
                >
                  {isUpdatingMode ? 'Saving...' : 'Save Rate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {userToChangePassword && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-neutral-950 border-2 border-gold rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-4 animate-drop-in text-white font-sans">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gold/20 border border-gold flex items-center justify-center text-gold">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-white">Change Password</h3>
                  <p className="text-[10px] text-neutral-400 font-mono">{userToChangePassword.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setUserToChangePassword(null)}
                className="text-neutral-400 hover:text-white p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveNewPassword} className="space-y-3.5">
              <div>
                <label className="block text-neutral-400 font-bold uppercase text-[10px] mb-1">
                  New Password :
                </label>
                <div className="relative w-full">
                  <input
                    type={showNewUserPassword ? 'text' : 'password'}
                    required
                    placeholder="Enter new password"
                    value={newUserPassword}
                    onChange={(e) => {
                      setNewUserPassword(e.target.value);
                      if (passwordChangeError) setPasswordChangeError('');
                    }}
                    className="w-full bg-black border border-neutral-700 text-white px-3.5 py-2 pr-10 rounded-xl focus:outline-none focus:border-gold font-sans text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewUserPassword(!showNewUserPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white focus:outline-none p-1 cursor-pointer"
                  >
                    {showNewUserPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-neutral-400 font-bold uppercase text-[10px] mb-1">
                  Confirm New Password :
                </label>
                <div className="relative w-full">
                  <input
                    type={showConfirmNewUserPassword ? 'text' : 'password'}
                    required
                    placeholder="Retype new password"
                    value={confirmNewUserPassword}
                    onChange={(e) => {
                      setConfirmNewUserPassword(e.target.value);
                      if (passwordChangeError) setPasswordChangeError('');
                    }}
                    className="w-full bg-black border border-neutral-700 text-white px-3.5 py-2 pr-10 rounded-xl focus:outline-none focus:border-gold font-sans text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmNewUserPassword(!showConfirmNewUserPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white focus:outline-none p-1 cursor-pointer"
                  >
                    {showConfirmNewUserPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {passwordChangeError && (
                <p className="text-rose-400 text-xs font-sans flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  {passwordChangeError}
                </p>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setUserToChangePassword(null)}
                  className="w-1/2 py-2 bg-neutral-900 border border-neutral-700 text-neutral-300 rounded-xl text-xs font-bold hover:bg-neutral-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isChangingPassword}
                  className="w-1/2 py-2 bg-gold-metallic text-black font-black text-xs rounded-xl shadow hover:opacity-95 disabled:opacity-50 cursor-pointer"
                >
                  {isChangingPassword ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE USER MODAL POPUP */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-neutral-950 border-2 border-gold rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4 animate-drop-in text-white font-sans my-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gold/20 border border-gold flex items-center justify-center text-gold">
                  <UserPlus className="w-4 h-4" />
                </div>
                <h3 className="font-extrabold text-sm sm:text-base text-gold uppercase tracking-wider">
                  Create New Agency / User
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="text-neutral-400 hover:text-white p-1 cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateUser} className="space-y-3.5">
              {/* Agency Name */}
              <div>
                <label className="block text-neutral-400 font-bold uppercase text-[10px] mb-1">
                  Agency Name :
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. WinnerAgency"
                  value={agencyName}
                  onChange={(e) => {
                    setAgencyName(e.target.value);
                    if (formError) setFormError('');
                  }}
                  className="w-full bg-black border border-neutral-700 text-white px-3.5 py-2 rounded-xl focus:outline-none focus:border-gold font-sans text-xs"
                />
              </div>

              {/* Username */}
              <div>
                <label className="block text-neutral-400 font-bold uppercase text-[10px] mb-1">
                  Username :
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. winner123"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    if (formError) setFormError('');
                  }}
                  className="w-full bg-black border border-neutral-700 text-white px-3.5 py-2 rounded-xl focus:outline-none focus:border-gold font-sans text-xs"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-neutral-400 font-bold uppercase text-[10px] mb-1">
                  Password :
                </label>
                <div className="relative w-full">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (formError) setFormError('');
                    }}
                    className={`w-full bg-black border text-white px-3.5 py-2 pr-10 rounded-xl focus:outline-none font-sans text-xs transition-colors ${
                      passwordsMismatch
                        ? 'border-rose-500 focus:border-rose-500'
                        : 'border-neutral-700 focus:border-gold'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white focus:outline-none p-1 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-neutral-400 font-bold uppercase text-[10px] mb-1 flex items-center justify-between">
                  <span>Confirm Password :</span>
                  {password && confirmPassword && (
                    <span
                      className={`text-[10px] font-bold flex items-center gap-1 ${
                        password === confirmPassword ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {password === confirmPassword ? (
                        <>
                          <Check className="w-3 h-3" /> Passwords match
                        </>
                      ) : (
                        <>
                          <X className="w-3 h-3" /> Do not match
                        </>
                      )}
                    </span>
                  )}
                </label>
                <div className="relative w-full">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    placeholder="Retype password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (formError) setFormError('');
                    }}
                    className={`w-full bg-black border text-white px-3.5 py-2 pr-10 rounded-xl focus:outline-none font-sans text-xs transition-colors ${
                      passwordsMismatch
                        ? 'border-rose-500 focus:border-rose-500 ring-1 ring-rose-500/30'
                        : 'border-neutral-700 focus:border-gold'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white focus:outline-none p-1 cursor-pointer"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-3.5 h-3.5" />
                    ) : (
                      <Eye className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Commission Rate (20% or 30%) */}
              <div>
                <label className="block text-neutral-400 font-bold uppercase text-[10px] mb-1">
                  Commission Rate :
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setCommissionRate('20%')}
                    className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all cursor-pointer text-center ${
                      commissionRate === '20%'
                        ? 'bg-gold-metallic text-black border-gold font-extrabold shadow-md'
                        : 'bg-neutral-900 text-neutral-400 border-neutral-700 hover:text-white'
                    }`}
                  >
                    20% Commission
                  </button>
                  <button
                    type="button"
                    onClick={() => setCommissionRate('30%')}
                    className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all cursor-pointer text-center ${
                      commissionRate === '30%'
                        ? 'bg-gold-metallic text-black border-gold font-extrabold shadow-md'
                        : 'bg-neutral-900 text-neutral-400 border-neutral-700 hover:text-white'
                    }`}
                  >
                    30% Commission
                  </button>
                </div>
              </div>

              {formError && (
                <p className="text-rose-400 text-xs font-sans flex items-center gap-1 pt-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  {formError}
                </p>
              )}

              <div className="flex gap-2 pt-2 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="w-1/2 py-2 bg-neutral-900 border border-neutral-700 hover:bg-neutral-800 text-neutral-300 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || passwordsMismatch || !agencyName.trim() || !username.trim() || !password.trim() || !confirmPassword.trim()}
                  className="w-1/2 py-2 bg-gold-metallic text-black font-extrabold text-xs rounded-xl shadow-md cursor-pointer disabled:opacity-50 transition-all hover:opacity-90"
                >
                  {isSubmitting ? 'Creating...' : 'Submit & Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {userToDelete && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-neutral-950 border-2 border-rose-600 rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-4 text-center animate-drop-in">
            <div className="w-12 h-12 rounded-full bg-rose-950 text-rose-500 border border-rose-800 flex items-center justify-center mx-auto shadow-inner">
              <Trash2 className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <h4 className="font-black text-white text-base uppercase">DELETE USER PERMISSION</h4>
              <p className="text-xs text-neutral-300 mt-2 font-sans">
                Are you sure you want to permanently delete player / user{' '}
                <strong className="text-gold font-bold text-sm">"{userToDelete.name}"</strong>?
              </p>
              <p className="text-[11px] text-neutral-500 mt-1 font-mono">
                All tickets, payouts, and records for this user will be removed.
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setUserToDelete(null)}
                className="flex-1 py-2.5 bg-neutral-900 text-neutral-300 font-bold text-xs rounded-xl border border-neutral-700 hover:text-white cursor-pointer disabled:opacity-50 transition-colors"
              >
                CANCEL
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={async () => {
                  setIsDeleting(true);
                  await deleteUser(userToDelete.id);
                  setIsDeleting(false);
                  setUserToDelete(null);
                }}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs uppercase rounded-xl shadow cursor-pointer active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeleting ? 'DELETING...' : 'YES, DELETE'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

