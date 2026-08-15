import React, { useState } from 'react';
import { HeaderBanner } from '../../components/HeaderBanner';
import { useApp } from '../../context/AppContext';
import { Building2, Calendar, Users, ChevronDown, ChevronUp, UserPlus, X, Check, Eye, EyeOff, AlertTriangle, Power, Trash2 } from 'lucide-react';

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
  const { registeredUsers, createUser, deleteUser, toggleUserStatus, toggleAllUsersStatus } = useApp();
  const [expandedUserBank, setExpandedUserBank] = useState<string | null>(null);
  const [userToDelete, setUserToDelete] = useState<{ id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Create User Form State
  const [showCreateForm, setShowCreateForm] = useState<boolean>(false);
  const [agencyName, setAgencyName] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [formError, setFormError] = useState<string>('');
  const [mode, setMode] = useState<'With Commission' | 'Without Commission'>('With Commission');
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
    if (!password.trim()) {
      setFormError('Please enter Password');
      return;
    }
    if (password !== confirmPassword) {
      setFormError('Passwords do not match. Please retype password correctly.');
      return;
    }

    let finalMode: string = mode;
    if (mode === 'With Commission') {
      finalMode = `With Commission (${commissionRate})`;
    }

    setIsSubmitting(true);
    const success = await createUser(agencyName.trim(), password.trim(), finalMode);
    setIsSubmitting(false);

    if (success) {
      setAgencyName('');
      setPassword('');
      setConfirmPassword('');
      setShowPassword(false);
      setShowConfirmPassword(false);
      setFormError('');
      setMode('With Commission');
      setCommissionRate('20%');
      setShowCreateForm(false);
    }
  };

  const allActive = registeredUsers.length > 0 && registeredUsers.every((u) => u.isActive !== false);

  return (
    <div className="w-full min-h-screen bg-black text-white flex flex-col justify-start overflow-y-auto pb-16 select-none">
      {/* Gold Header */}
      <HeaderBanner title="Users List" />

      <div className="px-4 sm:px-6 py-6 space-y-6 max-w-5xl mx-auto w-full">
        {/* Header Action Row */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-extrabold text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-gold" />
            <span>Users List ({registeredUsers.length})</span>
          </h2>

          <div className="flex items-center gap-2 flex-wrap">
            {registeredUsers.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  const targetState = !allActive;
                  if (
                    window.confirm(
                      targetState
                        ? 'Are you sure you want to activate all users?'
                        : 'Are you sure you want to deactivate all users? Users will be unable to log in.'
                    )
                  ) {
                    toggleAllUsersStatus(targetState);
                  }
                }}
                className={`px-3 py-2 rounded-xl font-extrabold text-xs flex items-center gap-1.5 shadow-md cursor-pointer transition-all ${
                  allActive
                    ? 'bg-rose-950/90 hover:bg-rose-900 border border-rose-600/70 text-rose-200'
                    : 'bg-emerald-950/90 hover:bg-emerald-900 border border-emerald-600/70 text-emerald-200'
                }`}
                title={allActive ? 'Deactivate all user accounts' : 'Activate all user accounts'}
              >
                <Power className="w-3.5 h-3.5 shrink-0" />
                <span>{allActive ? 'Deactivate All Users' : 'Activate All Users'}</span>
              </button>
            )}

            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="px-3.5 py-2 bg-gold-metallic hover:bg-gold text-black rounded-xl font-extrabold text-xs flex items-center gap-1.5 shadow-md cursor-pointer transition-transform active:scale-95"
            >
              {showCreateForm ? <X className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
              <span>{showCreateForm ? 'Close Form' : '+ Create User'}</span>
            </button>
          </div>
        </div>

        {/* Create User Card Form */}
        {showCreateForm && (
          <form
            onSubmit={handleCreateUser}
            className="p-5 bg-neutral-950 border border-gold/50 rounded-2xl space-y-4 shadow-xl animate-drop-in"
          >
            <div className="flex items-center justify-between border-b border-neutral-900 pb-3">
              <span className="font-extrabold text-gold text-sm uppercase tracking-wide flex items-center gap-2">
                <UserPlus className="w-4 h-4" /> Create New User / Agency
              </span>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="text-neutral-500 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs font-mono">
              {/* Agency Name Field */}
              <div>
                <label className="block text-neutral-400 font-sans font-bold uppercase text-[10px] mb-1">
                  Agency Name :
                </label>
                <input
                  type="text"
                  required
                  placeholder="Enter Agency Name"
                  value={agencyName}
                  onChange={(e) => {
                    setAgencyName(e.target.value);
                    if (formError) setFormError('');
                  }}
                  className="w-full bg-black border border-neutral-700 text-white px-3.5 py-2.5 rounded-xl focus:outline-none focus:border-gold font-sans text-xs"
                />
              </div>

              {/* Create Password Field */}
              <div>
                <label className="block text-neutral-400 font-sans font-bold uppercase text-[10px] mb-1">
                  Create Password :
                </label>
                <div className="relative w-full">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Enter Password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (formError) setFormError('');
                    }}
                    className="w-full bg-black border border-neutral-700 text-white px-3.5 py-2.5 pr-10 rounded-xl focus:outline-none focus:border-gold font-sans text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white focus:outline-none p-1 cursor-pointer"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4 text-neutral-400" />
                    ) : (
                      <Eye className="w-4 h-4 text-neutral-400" />
                    )}
                  </button>
                </div>
              </div>

              {/* Retype Password Field */}
              <div>
                <label className="block text-neutral-400 font-sans font-bold uppercase text-[10px] mb-1">
                  Retype Password :
                </label>
                <div className="relative w-full">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    placeholder="Retype Password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (formError) setFormError('');
                    }}
                    className={`w-full bg-black border text-white px-3.5 py-2.5 pr-10 rounded-xl focus:outline-none font-sans text-xs ${
                      passwordsMismatch
                        ? 'border-rose-500/80 focus:border-rose-500'
                        : 'border-neutral-700 focus:border-gold'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white focus:outline-none p-1 cursor-pointer"
                    title={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-4 h-4 text-neutral-400" />
                    ) : (
                      <Eye className="w-4 h-4 text-neutral-400" />
                    )}
                  </button>
                </div>
                {passwordsMismatch && (
                  <p className="text-rose-400 text-[11px] font-sans mt-1.5 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    Passwords do not match
                  </p>
                )}
              </div>

              {/* Form Level Error Message */}
              {formError && !passwordsMismatch && (
                <div className="p-2.5 bg-rose-950/70 border border-rose-500/50 text-rose-200 rounded-xl text-xs font-sans flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Mode Field (With Commission / Without Commission) */}
              <div>
                <label className="block text-neutral-400 font-sans font-bold uppercase text-[10px] mb-1.5">
                  Mode :
                </label>
                <div className="grid grid-cols-2 gap-2 font-sans mb-3">
                  <button
                    type="button"
                    onClick={() => setMode('With Commission')}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-extrabold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                      mode === 'With Commission'
                        ? 'bg-gold-metallic text-black border-gold shadow-md'
                        : 'bg-black text-neutral-400 border-neutral-800 hover:border-neutral-700'
                    }`}
                  >
                    {mode === 'With Commission' && <Check className="w-3.5 h-3.5" />}
                    <span>With Commission</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMode('Without Commission')}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-extrabold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                      mode === 'Without Commission'
                        ? 'bg-gold-metallic text-black border-gold shadow-md'
                        : 'bg-black text-neutral-400 border-neutral-800 hover:border-neutral-700'
                    }`}
                  >
                    {mode === 'Without Commission' && <Check className="w-3.5 h-3.5" />}
                    <span>Without Commission</span>
                  </button>
                </div>

                {/* Commission Rate Options (Visible when With Commission is selected) */}
                {mode === 'With Commission' && (
                  <div className="p-3 bg-neutral-900/90 border border-gold/40 rounded-xl space-y-2 shadow-inner animate-fadeIn">
                    <label className="block text-gold font-sans font-bold uppercase text-[10px] tracking-wider">
                      Commission Rate :
                    </label>
                    <div className="grid grid-cols-2 gap-2 font-sans">
                      {(['20%', '30%'] as const).map((rate) => (
                        <button
                          key={rate}
                          type="button"
                          onClick={() => setCommissionRate(rate)}
                          className={`py-2 px-3 rounded-lg border text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                            commissionRate === rate
                              ? 'bg-gold text-black border-gold font-black shadow-sm'
                              : 'bg-black text-neutral-300 border-neutral-800 hover:border-gold/50'
                          }`}
                        >
                          {commissionRate === rate && <Check className="w-3.5 h-3.5" />}
                          <span>{rate}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-900">
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  setFormError('');
                }}
                className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 text-xs font-bold rounded-xl border border-neutral-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || passwordsMismatch || !agencyName.trim() || !password.trim() || !confirmPassword.trim()}
                className="px-5 py-2 bg-gold-metallic hover:bg-gold text-black text-xs font-extrabold rounded-xl shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Creating...' : 'Submit & Create'}
              </button>
            </div>
          </form>
        )}

        {/* Registered Users List */}
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
                  {/* Header Row: User Name, Registration Date & Action Buttons */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-900 pb-2.5">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-extrabold text-white text-base block">{u.name}</span>
                        <span className="bg-gold/15 border border-gold/40 text-gold text-[10px] font-extrabold px-2 py-0.5 rounded-md">
                          {u.mode || 'With Commission'}
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
                      <span className="text-neutral-400 text-xs font-mono flex items-center gap-1 mt-1">
                        <Calendar className="w-3.5 h-3.5 text-gold shrink-0" /> Reg. Date: {formatDateDDMMYY(u.createdAt)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Activate / Deactivate Single User Toggle Button */}
                      <button
                        onClick={() => toggleUserStatus(u.id)}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-extrabold transition-all inline-flex items-center gap-1.5 cursor-pointer shrink-0 shadow-sm border ${
                          isUserActive
                            ? 'bg-amber-950/50 hover:bg-amber-900/80 border-amber-500/60 text-amber-300'
                            : 'bg-emerald-950/60 hover:bg-emerald-900/80 border-emerald-500/60 text-emerald-300'
                        }`}
                        title={isUserActive ? `Deactivate user ${u.name}` : `Activate user ${u.name}`}
                      >
                        <Power className={`w-3.5 h-3.5 shrink-0 ${isUserActive ? 'text-amber-400' : 'text-emerald-400'}`} />
                        <span>{isUserActive ? 'Deactivate' : 'Activate'}</span>
                      </button>

                      {/* Delete User Button */}
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

                  {/* Info Row: Bank Details Toggle Button */}
                  <div className="flex flex-wrap items-center justify-end gap-3 text-xs">
                    <button
                      onClick={() => setExpandedUserBank(expandedUserBank === u.id ? null : u.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-extrabold border transition-colors cursor-pointer shrink-0 ${
                        u.bankDetails
                          ? 'bg-emerald-950/90 border-emerald-500/60 text-emerald-300 hover:bg-emerald-900'
                          : 'bg-neutral-900 border-neutral-800 text-neutral-500 hover:text-neutral-300'
                      }`}
                    >
                      <Building2 className="w-3.5 h-3.5" />
                      <span>{u.bankDetails ? 'Bank Details' : 'No Bank Details'}</span>
                      {expandedUserBank === u.id ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>

                {/* Expandable Bank Account Details Drawer */}
                {expandedUserBank === u.id && (
                  <div className="mt-3 p-4 bg-neutral-900 rounded-xl border border-gold/40 text-xs space-y-2 font-mono shadow-inner">
                    <div className="text-gold font-extrabold flex items-center gap-1.5 text-xs border-b border-neutral-800 pb-2">
                      <Building2 className="w-4 h-4 text-gold" /> Bank Account Details ({u.name})
                    </div>
                    {u.bankDetails ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-neutral-300 pt-1">
                        <div className="bg-black p-2.5 rounded-lg border border-neutral-800">
                          <span className="text-neutral-500 block text-[10px] uppercase font-sans font-bold">
                            Account Holder:
                          </span>
                          <span className="font-bold text-white text-xs">{u.bankDetails.accountHolderName}</span>
                        </div>
                        <div className="bg-black p-2.5 rounded-lg border border-neutral-800">
                          <span className="text-neutral-500 block text-[10px] uppercase font-sans font-bold">
                            Bank Name:
                          </span>
                          <span className="font-bold text-white text-xs">{u.bankDetails.bankName}</span>
                        </div>
                        <div className="bg-black p-2.5 rounded-lg border border-neutral-800">
                          <span className="text-neutral-500 block text-[10px] uppercase font-sans font-bold">
                            Account Number:
                          </span>
                          <span className="font-bold text-gold text-xs">{u.bankDetails.accountNo}</span>
                        </div>
                        <div className="bg-black p-2.5 rounded-lg border border-neutral-800">
                          <span className="text-neutral-500 block text-[10px] uppercase font-sans font-bold">
                            IFSC / Branch:
                          </span>
                          <span className="font-bold text-white text-xs">
                            {u.bankDetails.ifsc} ({u.bankDetails.branchName})
                          </span>
                        </div>
                      </div>
                    ) : (
                      <span className="text-neutral-500 italic block text-xs">
                        User has not updated bank account details yet.
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
      </div>

      {/* DELETE USER PERMISSION CONFIRMATION DIALOG MODAL */}
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

