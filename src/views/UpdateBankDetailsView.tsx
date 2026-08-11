import React, { useState } from 'react';
import { HeaderBanner } from '../components/HeaderBanner';
import { useApp } from '../context/AppContext';
import { Building2, ShieldCheck, Edit3, Save, X, PlusCircle } from 'lucide-react';

export const UpdateBankDetailsView: React.FC = () => {
  const { bankDetails, updateBankDetails, addToast } = useApp();

  const hasSavedBank = Boolean(bankDetails?.accountNo);
  const [isEditing, setIsEditing] = useState<boolean>(!hasSavedBank);

  const [accountHolderName, setAccountHolderName] = useState(
    bankDetails?.accountHolderName || ''
  );
  const [accountNo, setAccountNo] = useState(bankDetails?.accountNo || '');
  const [bankName, setBankName] = useState(bankDetails?.bankName || '');
  const [ifsc, setIfsc] = useState(bankDetails?.ifsc || '');
  const [branchName, setBranchName] = useState(bankDetails?.branchName || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountHolderName.trim() || !accountNo.trim() || !bankName.trim() || !ifsc.trim() || !branchName.trim()) {
      addToast('Please fill out all bank account fields', 'error');
      return;
    }

    updateBankDetails({
      accountHolderName: accountHolderName.trim(),
      accountNo: accountNo.trim(),
      bankName: bankName.trim(),
      ifsc: ifsc.trim().toUpperCase(),
      branchName: branchName.trim(),
    });

    addToast(
      hasSavedBank
        ? 'Bank account details updated successfully!'
        : 'Bank account linked successfully!',
      'success'
    );
    setIsEditing(false);
  };

  return (
    <div className="w-full min-h-screen bg-black text-white flex flex-col justify-start overflow-y-auto pb-24 sm:pb-32 select-none">
      {/* Header Banner */}
      <HeaderBanner title="Bank Details" />

      <div className="max-w-md mx-auto w-full px-4 sm:px-6 py-6 space-y-5">
        
        {/* Top Icon & Header Title */}
        <div className="flex flex-col items-center justify-center text-center space-y-2">
          <div className="w-14 h-14 bg-neutral-950 border border-gold/40 rounded-2xl flex items-center justify-center shadow-lg">
            <Building2 className="w-7 h-7 text-gold" />
          </div>
          <div>
            <h2 className="text-gold font-black text-base sm:text-lg tracking-wide uppercase">
              {hasSavedBank ? 'Secure Payout Bank Account' : 'Add Your Bank Account Details'}
            </h2>
            <p className="text-neutral-400 text-xs mt-0.5">
              {hasSavedBank
                ? 'Winning payouts will be credited directly to this account'
                : 'Enter your bank details to enable direct withdrawal payout transfers'}
            </p>
          </div>
        </div>

        {/* ================= 1. SAVED SUMMARY CARD MODE (When bank details exist & not editing) ================= */}
        {!isEditing && hasSavedBank && bankDetails && (
          <div className="bg-neutral-950 rounded-2xl border border-neutral-800 p-4 sm:p-5 space-y-4 shadow-xl">
            {/* Status Badge */}
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <span className="text-neutral-400 text-xs font-bold uppercase">Account Status</span>
              <span className="bg-emerald-950 text-emerald-400 border border-emerald-800/80 px-2.5 py-0.5 rounded-full text-[11px] font-black flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Verified & Active
              </span>
            </div>

            {/* Bank Details Table Card */}
            <div className="space-y-3 text-xs sm:text-sm">
              <div className="flex justify-between items-center border-b border-neutral-900 pb-2">
                <span className="text-neutral-400 font-medium">Account Holder</span>
                <span className="text-white font-extrabold">{bankDetails.accountHolderName}</span>
              </div>

              <div className="flex justify-between items-center border-b border-neutral-900 pb-2">
                <span className="text-neutral-400 font-medium">Account No.</span>
                <span className="text-gold font-mono font-black tracking-wider">{bankDetails.accountNo}</span>
              </div>

              <div className="flex justify-between items-center border-b border-neutral-900 pb-2">
                <span className="text-neutral-400 font-medium">Bank Name</span>
                <span className="text-white font-bold">{bankDetails.bankName}</span>
              </div>

              <div className="flex justify-between items-center border-b border-neutral-900 pb-2">
                <span className="text-neutral-400 font-medium">IFSC Code</span>
                <span className="text-gold font-mono font-bold">{bankDetails.ifsc}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-neutral-400 font-medium">Branch Name</span>
                <span className="text-white font-bold">{bankDetails.branchName}</span>
              </div>
            </div>

            {/* Edit Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="w-full py-3 bg-gold-metallic text-black font-black text-xs sm:text-sm tracking-wider rounded-xl shadow-md hover:opacity-95 active:scale-98 uppercase flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Edit3 className="w-4 h-4" /> Edit Bank Details
              </button>
            </div>
          </div>
        )}

        {/* ================= 2. ADD / EDIT FORM MODE ================= */}
        {isEditing && (
          <form onSubmit={handleSubmit} className="bg-neutral-950 rounded-2xl border border-neutral-800 p-4 sm:p-5 space-y-4 shadow-xl">
            <div className="border-b border-neutral-800 pb-2">
              <h3 className="text-white font-extrabold text-sm uppercase flex items-center gap-2">
                {hasSavedBank ? (
                  <>
                    <Edit3 className="w-4 h-4 text-gold" /> Edit Bank Account Details
                  </>
                ) : (
                  <>
                    <PlusCircle className="w-4 h-4 text-gold" /> Add Your Bank Account Details
                  </>
                )}
              </h3>
              <p className="text-neutral-400 text-xs mt-0.5">
                {hasSavedBank
                  ? 'Update your existing bank account information below'
                  : 'Fill in your bank account details below to link your payout account'}
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-neutral-400 text-[11px] font-bold block mb-1 uppercase">
                  Account Holder Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Adithyan Pavithran"
                  value={accountHolderName}
                  onChange={(e) => setAccountHolderName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white text-black placeholder-neutral-500 font-semibold focus:outline-none focus:ring-2 focus:ring-gold text-xs sm:text-sm shadow"
                  required
                />
              </div>

              <div>
                <label className="text-neutral-400 text-[11px] font-bold block mb-1 uppercase">
                  Account Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. 98765432101234"
                  value={accountNo}
                  onChange={(e) => setAccountNo(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white text-black placeholder-neutral-500 font-semibold focus:outline-none focus:ring-2 focus:ring-gold text-xs sm:text-sm shadow"
                  required
                />
              </div>

              <div>
                <label className="text-neutral-400 text-[11px] font-bold block mb-1 uppercase">
                  Bank Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. State Bank of India"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white text-black placeholder-neutral-500 font-semibold focus:outline-none focus:ring-2 focus:ring-gold text-xs sm:text-sm shadow"
                  required
                />
              </div>

              <div>
                <label className="text-neutral-400 text-[11px] font-bold block mb-1 uppercase">
                  IFSC Code
                </label>
                <input
                  type="text"
                  placeholder="e.g. SBIN0004321"
                  value={ifsc}
                  onChange={(e) => setIfsc(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white text-black placeholder-neutral-500 font-semibold focus:outline-none focus:ring-2 focus:ring-gold text-xs sm:text-sm shadow uppercase"
                  required
                />
              </div>

              <div>
                <label className="text-neutral-400 text-[11px] font-bold block mb-1 uppercase">
                  Branch Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Kasaragod Main Branch"
                  value={branchName}
                  onChange={(e) => setBranchName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white text-black placeholder-neutral-500 font-semibold focus:outline-none focus:ring-2 focus:ring-gold text-xs sm:text-sm shadow"
                  required
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 space-y-2">
              <button
                type="submit"
                className="w-full py-3 bg-gold-metallic text-black font-black text-xs sm:text-sm tracking-wider rounded-xl shadow-lg hover:opacity-95 active:scale-98 uppercase flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Save className="w-4 h-4" />
                {hasSavedBank ? 'Save Changes' : 'Save & Link Bank Account'}
              </button>

              {hasSavedBank && (
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="w-full py-2.5 bg-neutral-900 text-neutral-300 border border-neutral-800 font-bold text-xs rounded-xl hover:text-white flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" /> Cancel
                </button>
              )}
            </div>
          </form>
        )}

      </div>
    </div>
  );
};

