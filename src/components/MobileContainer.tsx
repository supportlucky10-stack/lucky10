import React from 'react';

interface Props {
  children: React.ReactNode;
}

export const MobileContainer: React.FC<Props> = ({ children }) => {
  return (
    <div className="w-full h-[100dvh] max-h-[100dvh] bg-black text-white flex flex-col justify-between overflow-hidden selection:bg-yellow-500 selection:text-black select-none antialiased">
      <div className="flex-1 flex flex-col w-full h-full min-h-0 overflow-hidden relative">
        {children}
      </div>
    </div>
  );
};
