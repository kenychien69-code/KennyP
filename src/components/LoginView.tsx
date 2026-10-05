import React, { useState } from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { LatteArtLogo } from './LatteArtLogo';
import { User } from '../types';

interface LoginViewProps {
  onLoginSuccess: (user: User) => void;
  usersList?: User[];
}

export const SHARED_PASSWORD = 'kenny123';
const ACCEPTED_PASSWORDS = [SHARED_PASSWORD, 'password123', 'admin123', 'owner123', '123456'];

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess, usersList = [] }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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

    setIsLoading(true);

    // 1. Check if Shop Owner / Admin account
    if (
      cleanUsername === 'owner' ||
      cleanUsername === 'admin' ||
      cleanUsername === 'shopowner' ||
      cleanUsername === 'kenychien' ||
      cleanUsername === 'kenychien69'
    ) {
      if (!ACCEPTED_PASSWORDS.includes(cleanPassword)) {
        setIsLoading(false);
        setError('Incorrect password. Please verify your credentials.');
        return;
      }

      onLoginSuccess({
        id: 'usr-owner',
        username: 'owner',
        role: 'owner',
        fullName: 'Keny Chien',
        roleTitle: 'Shop Owner',
      });
      return;
    }

    // 1.5 Check if default/demo Store Manager account
    if (cleanUsername === 'manager' || cleanUsername === 'storemanager') {
      if (!ACCEPTED_PASSWORDS.includes(cleanPassword)) {
        setIsLoading(false);
        setError('Incorrect password. Please verify your credentials.');
        return;
      }

      onLoginSuccess({
        id: 'usr-manager',
        username: 'manager',
        role: 'manager',
        fullName: 'Maria Santos (Store Manager)',
        roleTitle: 'Store Manager',
      });
      return;
    }

    // 2. Check if created staff member in usersList
    const staffMatch = usersList.find(
      (u) => u.username.trim().toLowerCase() === cleanUsername
    );

    if (staffMatch) {
      // Check user specific password or accepted default passwords
      const validPasswords = [
        ...(staffMatch.password ? [staffMatch.password.trim()] : []),
        ...ACCEPTED_PASSWORDS,
      ];

      if (!validPasswords.includes(cleanPassword)) {
        setIsLoading(false);
        setError('Incorrect password. Please verify your credentials.');
        return;
      }

      onLoginSuccess({
        id: staffMatch.id || `usr-${staffMatch.username}`,
        username: staffMatch.username,
        role: staffMatch.role,
        fullName: staffMatch.fullName,
        roleTitle:
          staffMatch.roleTitle ||
          (staffMatch.role === 'owner'
            ? 'Shop Owner'
            : staffMatch.role === 'manager'
            ? 'Store Manager'
            : 'Cashier / Barista'),
      });
      return;
    }

    setIsLoading(false);
    setError('Account not found. Please check your username or request account setup from the Shop Owner.');
  };

  return (
    <div className="min-h-screen bg-[#2A1810] flex items-center justify-center p-4 relative overflow-hidden select-none">
      {/* Warm ambient lighting backdrop */}
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
          <div className="p-3 bg-[#FFF5F5] border border-[#F5C2C2] text-[#B91C1C] rounded-lg text-xs leading-relaxed animate-in fade-in duration-150">
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
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-[#4E342E] hover:bg-[#3E2723] active:scale-98 text-white font-bold text-xs uppercase tracking-wider rounded-lg shadow-md transition-all cursor-pointer mt-2 disabled:opacity-60"
          >
            {isLoading ? 'SIGNING IN...' : 'SIGN IN'}
          </button>
        </form>

        <div className="text-center pt-2 border-t border-[#F2ECE4]">
          <p className="text-[11px] text-[#7A6452] flex items-center justify-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-[#8C7355]" />
            <span>Protected POS & Analytics Session</span>
          </p>
        </div>
      </div>
    </div>
  );
};
