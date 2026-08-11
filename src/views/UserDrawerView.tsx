import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Lucky10Logo } from '../components/Lucky10Logo';
import { ArrowLeft, X, Upload, Paperclip } from 'lucide-react';

import icon01 from '../assets/sidebar images/01.png';
import icon02 from '../assets/sidebar images/02.png';
import icon03 from '../assets/sidebar images/03.png';
import icon04 from '../assets/sidebar images/04.png';
import icon05 from '../assets/sidebar images/05.png';
import icon06 from '../assets/sidebar images/06.png';
import icon07 from '../assets/sidebar images/07.png';

export const UserDrawerView: React.FC = () => {
  const { logout, setCurrentView, addToast } = useApp();
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportCategory, setReportCategory] = useState('Payment Issues');
  const [attachedFile, setAttachedFile] = useState<File | null>(null);

  const menuItems = [
    {
      label: 'Payout Structure',
      icon: icon01,
      action: () => setCurrentView('PAYOUT_STRUCTURE'),
    },
    {
      label: 'Change Game',
      icon: icon02,
      action: () => setCurrentView('CHANGE_GAME'),
    },
    {
      label: 'Results',
      icon: icon03,
      action: () => setCurrentView('TODAYS_RESULT'),
    },
    {
      label: 'Winning Report',
      icon: icon04,
      action: () => setCurrentView('TODAYS_WINNING_NUMBERS'),
    },
    {
      label: 'Update Bank Account',
      icon: icon06,
      action: () => setCurrentView('UPDATE_BANK_DETAILS'),
    },
    {
      label: 'My Play Report',
      icon: icon05,
      action: () => setCurrentView('MY_PLAY_REPORT'),
    },
    {
      label: 'Report an Issue',
      icon: icon07,
      action: () => setShowReportModal(true),
    },
  ];

  const handleSendReport = (e: React.FormEvent) => {
    e.preventDefault();
    setShowReportModal(false);
    setAttachedFile(null);
    addToast('Your issue report with attachment proof has been submitted!', 'success');
  };

  return (
    <div className="w-full min-h-[100dvh] bg-black text-white flex flex-col justify-between overflow-y-auto pb-24 sm:pb-32 antialiased">
      <div>
        {/* Top Gold Banner Header */}
        <div className="w-full bg-gold-banner px-4 sm:px-5 py-2.5 sm:py-3 flex items-center justify-between shadow-md border-b border-[#b88928]/40">
          <button
            onClick={() => setCurrentView('GAME_DASHBOARD')}
            className="flex items-center gap-1.5 text-black hover:opacity-80 font-black text-sm sm:text-base tracking-tight transition-opacity"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 stroke-[3]" />
            <span>Back</span>
          </button>
          <div className="scale-75 origin-right flex items-center gap-2">
            <Lucky10Logo size="sm" showSubtitle={false} variant="black" />
          </div>
        </div>

        {/* Sidebar Menu Items matching exact uploaded design */}
        <div className="px-5 sm:px-8 pt-2 sm:pt-4">
          {menuItems.map((item, index) => (
            <button
              key={index}
              onClick={item.action}
              className="w-full flex items-center gap-4 py-3.5 sm:py-4 border-b border-neutral-700/80 text-left text-white hover:text-gold font-extrabold text-sm sm:text-base md:text-lg tracking-wide transition-all group"
            >
              <img
                src={item.icon}
                alt={item.label}
                className="w-6 h-6 sm:w-7 sm:h-7 object-contain group-hover:scale-110 transition-transform shrink-0"
              />
              <span className="truncate">{item.label}</span>
            </button>
          ))}

          {/* Logout Button positioned suitable and a little up */}
          <div className="pt-6 sm:pt-8 pb-10">
            <button
              onClick={logout}
              className="px-6 py-2.5 bg-gradient-to-b from-[#edd177] via-[#c89825] to-[#996e19] text-black font-black text-xs sm:text-sm rounded-lg shadow-md hover:brightness-110 transition-all uppercase tracking-wide"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Report Issue Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-neutral-900 border-2 border-gold rounded-2xl p-5 max-w-md w-full space-y-4 shadow-2xl relative">
            <button
              onClick={() => {
                setShowReportModal(false);
                setAttachedFile(null);
              }}
              className="absolute top-4 right-4 text-neutral-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 border-b border-neutral-800 pb-3">
              <img src={icon07} alt="Report" className="w-7 h-7 object-contain" />
              <h3 className="text-gold font-extrabold text-lg">Report an Issue</h3>
            </div>

            <form onSubmit={handleSendReport} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-neutral-300 mb-1.5">
                  Select Issue Type:
                </label>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {[
                    'Payment Issues',
                    'Game Related',
                    'Account Issues',
                    'Other Queries',
                  ].map((category) => (
                    <button
                      key={category}
                      type="button"
                      onClick={() => setReportCategory(category)}
                      className={`py-2 px-2.5 rounded-lg text-xs font-bold border transition-all text-center ${
                        reportCategory === category
                          ? 'bg-gold-metallic text-black border-gold shadow'
                          : 'bg-black text-neutral-300 border-neutral-800 hover:border-gold/50'
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>

                <label className="block text-xs font-bold text-neutral-300 mb-1">
                  Describe your problem or query:
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder={`Explain details regarding ${reportCategory}...`}
                  className="w-full p-3 bg-black text-white text-xs rounded-xl border border-neutral-700 focus:outline-none focus:ring-1 focus:ring-gold"
                />
              </div>

              {/* Attach Screenshot / Document Proof Area */}
              <div>
                <label className="block text-xs font-bold text-neutral-300 mb-1">
                  Attach Screenshot or Document Proof:
                </label>
                <label className="relative flex flex-col items-center justify-center border border-dashed border-neutral-700 hover:border-gold/80 bg-black/60 rounded-xl p-3 cursor-pointer transition-colors group">
                  <input
                    type="file"
                    accept="image/*,.pdf,.doc,.docx"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setAttachedFile(e.target.files[0]);
                      }
                    }}
                    className="hidden"
                  />
                  {attachedFile ? (
                    <div className="flex items-center justify-between w-full text-xs">
                      <div className="flex items-center gap-2 text-gold font-mono font-bold truncate max-w-[240px]">
                        <Paperclip className="w-4 h-4 shrink-0" />
                        <span className="truncate">{attachedFile.name}</span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setAttachedFile(null);
                        }}
                        className="text-neutral-400 hover:text-red-400 p-1 transition-colors"
                        title="Remove file"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-neutral-400 text-xs font-medium group-hover:text-gold transition-colors">
                      <Upload className="w-4 h-4 text-gold shrink-0 group-hover:scale-110 transition-transform" />
                      <span>Upload Screenshot / Document Proof</span>
                    </div>
                  )}
                </label>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowReportModal(false);
                    setAttachedFile(null);
                  }}
                  className="flex-1 py-2.5 bg-neutral-800 text-white font-bold text-xs rounded-lg hover:bg-neutral-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-gold-metallic text-black font-black text-xs rounded-lg uppercase shadow hover:opacity-95 cursor-pointer"
                >
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
