import React from 'react';

interface Props {
  children: React.ReactNode;
}

export const MobileContainer: React.FC<Props> = ({ children }) => {
  return (
    <div className="w-full min-h-screen min-h-[100dvh] bg-black text-white flex flex-col selection:bg-yellow-500 selection:text-black antialiased overflow-x-hidden overflow-y-auto">
      <div className="flex-1 flex flex-col w-full min-h-full">
        {children}
      </div>
    </div>
  );
};
