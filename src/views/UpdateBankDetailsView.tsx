import React, { useState } from 'react';
import { HeaderBanner } from '../components/HeaderBanner';
import { useApp } from '../context/AppContext';

export const UpdateBankDetailsView: React.FC = () => {
  const { bankDetails, updateBankDetails, addToast, setCurrentView } = useApp();

  const [accountHolderName, setAccountHolderName] = useState(
    bankDetails?.accountHolderName || ''
  );
  const [accountNo, setAccountNo] = useState(bankDetails?.accountNo || '');
  const [bankName, setBankName] = useState(bankDetails?.bankName || '');
  const [ifsc, setIfsc] = useState(bankDetails?.ifsc || '');
  const [branchName, setBranchName] = useState(bankDetails?.branchName || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountHolderName || !accountNo || !bankName || !ifsc || !branchName) {
      addToast('Please fill out all bank account fields', 'error');
      return;
    }

    updateBankDetails({
      accountHolderName,
      accountNo,
      bankName,
      ifsc,
      branchName,
    });

    setCurrentView('USER_DRAWER');
  };

  return (
    <div className="w-full flex-1 bg-black text-white flex flex-col justify-start overflow-y-auto pb-8">
      {/* Gold Header matching Page 11 */}
      <HeaderBanner title="Update Your Bank Details" />

      {/* Form Fields matching Page 11 */}
      <form onSubmit={handleSubmit} className="px-6 py-8 space-y-5 max-w-sm mx-auto w-full">
        <div>
          <input
            type="text"
            placeholder="Account Holder Name"
            value={accountHolderName}
            onChange={(e) => setAccountHolderName(e.target.value)}
            className="w-full px-4 py-3 rounded-md bg-white text-black placeholder-neutral-500 font-medium focus:outline-none focus:ring-2 focus:ring-gold text-sm shadow"
            required
          />
        </div>

        <div>
          <input
            type="text"
            placeholder="Account No."
            value={accountNo}
            onChange={(e) => setAccountNo(e.target.value)}
            className="w-full px-4 py-3 rounded-md bg-white text-black placeholder-neutral-500 font-medium focus:outline-none focus:ring-2 focus:ring-gold text-sm shadow"
            required
          />
        </div>

        <div>
          <input
            type="text"
            placeholder="Bank Name"
            value={bankName}
            onChange={(e) => setBankName(e.target.value)}
            className="w-full px-4 py-3 rounded-md bg-white text-black placeholder-neutral-500 font-medium focus:outline-none focus:ring-2 focus:ring-gold text-sm shadow"
            required
          />
        </div>

        <div>
          <input
            type="text"
            placeholder="IFSC"
            value={ifsc}
            onChange={(e) => setIfsc(e.target.value)}
            className="w-full px-4 py-3 rounded-md bg-white text-black placeholder-neutral-500 font-medium focus:outline-none focus:ring-2 focus:ring-gold text-sm shadow"
            required
          />
        </div>

        <div>
          <input
            type="text"
            placeholder="Branch Name"
            value={branchName}
            onChange={(e) => setBranchName(e.target.value)}
            className="w-full px-4 py-3 rounded-md bg-white text-black placeholder-neutral-500 font-medium focus:outline-none focus:ring-2 focus:ring-gold text-sm shadow"
            required
          />
        </div>

        <div className="pt-4 flex justify-center">
          <button
            type="submit"
            className="w-36 py-3 btn-gold font-black text-sm tracking-wider shadow-lg"
          >
            SUBMIT
          </button>
        </div>
      </form>
    </div>
  );
};
