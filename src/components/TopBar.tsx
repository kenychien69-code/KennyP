import React from 'react';
import { LogOut } from 'lucide-react';
import { LatteArtLogo } from './LatteArtLogo';
import { User, UserRole } from '../types';

interface TopBarProps {
  currentUser: User;
  onLogout: () => void;
  onRoleChange?: (role: UserRole) => void;
  onClearAllData?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  currentUser,
  onLogout,
}) => {
  return (
    <header className="h-16 bg-[#321B13] text-[#F5EDE6] px-5 flex items-center justify-between border-b border-[#4A2E20] select-none shrink-0 shadow-md">
      {/* Brand Identity */}
      <div className="flex items-center gap-3">
        <LatteArtLogo className="w-9 h-9 shrink-0" />
        <div className="flex flex-col">
          <span className="font-bold text-lg tracking-tight text-[#FAF6F2]">
            KENNY Brew Intelligence
          </span>
          <span className="text-[11px] text-[#C4A48A] -mt-0.5 hidden sm:inline">
            Smart POS & Inventory Management
          </span>
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-3">
        <div className="text-right hidden sm:block">
          <div className="text-xs font-bold text-[#F7E7D9]">
            {currentUser.fullName ? currentUser.fullName.replace(/\s*\([^)]*\)/g, '').trim() : 'Store Staff'}
          </div>
          <div className="text-[10px] text-[#C4A48A]">{currentUser.roleTitle || 'Store Staff'}</div>
        </div>

        {/* Logout Button */}
        <button
          onClick={onLogout}
          className="px-3.5 py-1.5 bg-[#4A2A1E] hover:bg-[#5C3526] text-[#F3E3D5] text-xs font-medium rounded-md border border-[#6B3F2E] transition-all flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
};
