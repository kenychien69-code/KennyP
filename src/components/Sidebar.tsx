import React from 'react';
import { LatteArtLogo } from './LatteArtLogo';
import {
  LayoutDashboard,
  ShoppingCart,
  Boxes,
  Users,
  FileText,
  Sparkles,
  BellRing,
  Coffee,
  LucideIcon,
} from 'lucide-react';
import { User, UserRole } from '../types';

export type NavTab =
  | 'dashboard'
  | 'pos'
  | 'inventory'
  | 'alerts'
  | 'reports'
  | 'forecast'
  | 'users';

interface SidebarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  lowStockCount: number;
  currentUser: User;
}

interface NavItemDef {
  id: NavTab;
  label: string;
  icon: LucideIcon;
  badge?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  lowStockCount,
  currentUser,
}) => {
  // Navigation items with clean, professional store terminology
  const allNavItems: Record<NavTab, NavItemDef> = {
    dashboard: {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
    pos: {
      id: 'pos',
      label: 'POS Terminal',
      icon: ShoppingCart,
    },
    inventory: {
      id: 'inventory',
      label: 'Products & Inventory',
      icon: Boxes,
      badge: lowStockCount > 0 ? lowStockCount : undefined,
    },
    alerts: {
      id: 'alerts',
      label: 'Low Stock Alerts',
      icon: BellRing,
      badge: lowStockCount > 0 ? lowStockCount : undefined,
    },
    reports: {
      id: 'reports',
      label: 'Sales Reports',
      icon: FileText,
    },
    forecast: {
      id: 'forecast',
      label: 'AI Demand Forecast',
      icon: Sparkles,
    },
    users: {
      id: 'users',
      label: 'Staff Management',
      icon: Users,
    },
  };

  // Role permissions:
  // - Cashier / Barista: Focused on customer register / POS transactions
  // - Shop Owner: Executive store control across all modules (Admin + Owner)
  let roleTabKeys: NavTab[] = [];
  if (currentUser.role === 'cashier') {
    roleTabKeys = ['pos'];
  } else {
    // Shop Owner has full access to all areas including Staff Management
    roleTabKeys = ['dashboard', 'pos', 'inventory', 'alerts', 'reports', 'forecast', 'users'];
  }

  const roleTitleMap: Record<UserRole, string> = {
    owner: 'Shop Owner',
    cashier: 'Cashier / Barista',
  };

  return (
    <aside className="w-64 bg-[#F7F3EE] border-r border-[#E8DFC8] flex flex-col justify-between select-none shrink-0">
      <div className="p-3 space-y-1">
        {/* Navigation Links */}
        {roleTabKeys.map((key) => {
          const item = allNavItems[key];
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-all text-left cursor-pointer ${
                isActive
                  ? 'bg-[#EBDBC9] text-[#331C13] shadow-xs'
                  : 'text-[#5C4A3A] hover:bg-[#EFE8DF] hover:text-[#26130B]'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? 'text-[#8A4A28]' : 'text-[#8C7355]'
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </div>
              {item.badge !== undefined && item.badge > 0 && (
                <span className="px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-[#E57373] text-white tabular-nums shrink-0 ml-1">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Clean Brand Footer */}
      <div className="p-3.5 border-t border-[#E8DFC8] bg-[#F1ECE4] text-xs text-[#6B5A4B]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-[#3D2817]">
            <LatteArtLogo className="w-4 h-4 shrink-0" />
            <span className="text-xs">KENNY Brew POS</span>
          </div>
          <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded bg-[#E5D7C7] text-[#542F1E]">
            Online
          </span>
        </div>
      </div>
    </aside>
  );
};
