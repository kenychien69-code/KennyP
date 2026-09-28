import React, { useState } from 'react';
import { Eye, EyeOff, Lock, CheckCircle2 } from 'lucide-react';
import { LatteArtLogo } from './LatteArtLogo';
import { User, UserRole } from '../types';

interface LoginViewProps {
  onLoginSuccess: (user: User) => void;
}

export const SHARED_PASSWORD = 'kenny123';
const ACCEPTED_PASSWORDS = [SHARED_PASSWORD, 'password123', 'admin123', '123456'];

export interface StaffAccountDef {
  username: string;
  role: UserRole;
  fullName: string;
  roleTitle: string;
  description: string;
}

export const STAFF_ACCOUNTS: Record<string, StaffAccountDef> = {
  owner: {
    username: 'owner',
    role: 'owner',
    fullName: 'Shop Owner & Administrator',
    roleTitle: 'Shop Owner / Admin',
    description: 'Executive management, staff accounts, menu pricing, analytics & forecasting',
  },
  manager: {
    username: 'manager',
    role: 'manager',
    fullName: 'Store Operations Manager',
    roleTitle: 'Store Manager',
    description: 'Menu & products, inventory recipes, stock alerts & POS access',
  },
  cashier: {
    username: 'cashier',
    role: 'cashier',
    fullName: 'Alexander Rivera',
    roleTitle: 'Cashier / Barista',
    description: 'POS register, beverage customization & customer checkout',
  },
};

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSelectAccount = (acc: StaffAccountDef) => {
    setUsername(acc.username);
    setPassword(SHARED_PASSWORD);
    setError('');
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanUsername = username.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanUsername) {
      setError('Please enter your username.');
      return;
    }

    if (!cleanPassword) {
      setError('Please enter your password.');
      return;
    }

    // Verify account exists
    let account = STAFF_ACCOUNTS[cleanUsername];
    if (!account) {
      if (cleanUsername === 'admin' || cleanUsername === 'shopowner') account = STAFF_ACCOUNTS.owner;
      else if (cleanUsername === 'barista') account = STAFF_ACCOUNTS.cashier;
      else if (cleanUsername === 'inventory') account = STAFF_ACCOUNTS.manager;
    }

    if (!account) {
      setError('Invalid username. Please enter a valid staff username.');
      return;
    }

    // Verify password
    if (!ACCEPTED_PASSWORDS.includes(cleanPassword)) {
      setError('Incorrect password. Please verify your credentials.');
      return;
    }

    // Login successful
    onLoginSuccess({
      username: account.username,
      role: account.role,
      fullName: account.fullName,
      roleTitle: account.roleTitle,
    });
  };

  return (
    <div className="min-h-screen bg-[#2A1810] flex items-center justify-center p-4 relative overflow-hidden select-none">
      {/* Subtle warm ambient lighting backdrop */}
      <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#D4A373] via-transparent to-transparent" />

      {/* Main Login Card */}
      <div className="w-full max-w-md bg-white rounded-xl shadow-2xl border border-[#E8DFD4] p-8 space-y-6 relative z-10 animate-in fade-in zoom-in-95 duration-200">
        {/* Logo & Branding */}
        <div className="text-center space-y-1.5">
          <div className="mx-auto flex items-center justify-center mb-1">
            <LatteArtLogo className="w-16 h-16" />
          </div>
          <h2 className="text-2xl font-extrabold text-[#2A1810] tracking-tight">
            KENNY Brew Intelligence
          </h2>
          <p className="text-xs text-[#7A6452] font-medium">
            AI-Integrated Point-of-Sale System
          </p>
        </div>

        {/* Error notification */}
        {error && (
          <div className="p-3 bg-[#FFF5F5] border border-[#F5C2C2] text-[#B91C1C] rounded-lg text-xs leading-relaxed">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4 text-xs">
          <div className="space-y-1.5">
            <label className="font-semibold text-[#3D291C] block">
              Username
            </label>
            <input
              type="text"
              required
              autoFocus
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                if (error) setError('');
              }}
              placeholder="Enter username"
              className="w-full px-3.5 py-2.5 text-sm bg-[#FAF7F2] border border-[#E8DFC8] rounded-lg text-[#2A1810] focus:outline-none focus:border-[#8A4A28] focus:ring-1 focus:ring-[#8A4A28] transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-[#3D291C] block">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError('');
                }}
                placeholder="Enter password"
                className="w-full px-3.5 py-2.5 text-sm bg-[#FAF7F2] border border-[#E8DFC8] rounded-lg text-[#2A1810] focus:outline-none focus:border-[#8A4A28] focus:ring-1 focus:ring-[#8A4A28] pr-10 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8C7355] hover:text-[#2A1810] cursor-pointer"
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            className="w-full py-3 bg-[#4E342E] hover:bg-[#3E2723] active:scale-98 text-white font-bold text-xs uppercase tracking-wider rounded-lg shadow-md transition-all cursor-pointer mt-2"
          >
            SIGN IN
          </button>
        </form>

        {/* Quick Staff Role Selection */}
        <div className="pt-2 border-t border-[#F2ECE4] space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#8C7355] uppercase tracking-wider">
              Quick Role Sign-In
            </span>
            <span className="text-[10px] text-[#A89078]">
              Click to autofill
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {Object.values(STAFF_ACCOUNTS).map((acc) => {
              const isSelected = username.toLowerCase() === acc.username;
              return (
                <button
                  key={acc.username}
                  type="button"
                  onClick={() => handleSelectAccount(acc)}
                  className={`p-2.5 text-left rounded-lg border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#F5ECE3] border-[#8A4A28] shadow-sm'
                      : 'bg-[#FAF7F2] border-[#EAE2D5] hover:border-[#D5C2AF] hover:bg-[#F5EFE8]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-[#2A1810]">
                      {acc.roleTitle}
                    </span>
                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-[#8A4A28]" />}
                  </div>
                  <div className="text-[10px] text-[#7A6452] mt-0.5">
                    User: <span className="font-mono font-semibold text-[#542F1E]">{acc.username}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="text-center pt-1 border-t border-[#F2ECE4]">
          <p className="text-[11px] text-[#7A6452]">
            Protected POS & Analytics Session
          </p>
        </div>
      </div>
    </div>
  );
};
