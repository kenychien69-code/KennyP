import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  ShieldCheck,
  Search,
  CheckCircle,
  XCircle,
  KeyRound,
  Trash2,
  Edit2,
  Clock,
  Check,
} from 'lucide-react';
import { User, UserRole } from '../types';

interface UserAccountsViewProps {
  currentUser: User;
  users: User[];
  onAddUser: (user: User, password?: string) => void;
  onUpdateUser: (username: string, updates: Partial<User>) => void;
  onDeleteUser: (username: string) => void;
  onResetPassword: (username: string) => void;
}

export const ROLE_PERMISSIONS: Record<
  UserRole,
  { title: string; permissions: string[]; badgeColor: string }
> = {
  owner: {
    title: 'Shop Owner & Administrator',
    permissions: [
      'Full store management & administration',
      'Staff accounts & permission assignment',
      'Sales reports & financial analytics',
      'AI demand & revenue forecasting',
      'Product catalog, recipes & pricing',
    ],
    badgeColor: 'bg-[#1E3A2F] text-[#D8F3E5] border-[#2E5E4A]',
  },
  manager: {
    title: 'Store Manager',
    permissions: [
      'Add & update products and recipes',
      'Inventory restock & depletion control',
      'Real-time low stock radar & alerts',
      'AI demand forecast & staffing',
      'POS cashier terminal access',
    ],
    badgeColor: 'bg-[#1E2D4A] text-[#D5E3FC] border-[#2C436F]',
  },
  cashier: {
    title: 'Cashier / Barista',
    permissions: [
      'POS register & beverage ordering',
      'Customizations, sizing & sugar levels',
      'Payment checkout & receipt printing',
    ],
    badgeColor: 'bg-[#4A3B1E] text-[#FDF4D9] border-[#6E562A]',
  },
};

export const UserAccountsView: React.FC<UserAccountsViewProps> = ({
  currentUser,
  users,
  onAddUser,
  onUpdateUser,
  onDeleteUser,
  onResetPassword,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  // Form states
  const [formUsername, setFormUsername] = useState('');
  const [formFullName, setFormFullName] = useState('');
  const [formRole, setFormRole] = useState<UserRole>('cashier');
  const [formPassword, setFormPassword] = useState('kenny123');
  const [formStatus, setFormStatus] = useState<'Active' | 'Inactive'>('Active');

  const showNotice = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleOpenAddModal = () => {
    setFormUsername('');
    setFormFullName('');
    setFormRole('cashier');
    setFormPassword('kenny123');
    setFormStatus('Active');
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (u: User) => {
    setEditingUser(u);
    setFormFullName(u.fullName);
    setFormRole(u.role);
    setFormStatus(u.status || 'Active');
  };

  const handleSubmitAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formUsername.trim() || !formFullName.trim()) return;

    if (users.some((u) => u.username.toLowerCase() === formUsername.trim().toLowerCase())) {
      alert(`Username @${formUsername} is already taken.`);
      return;
    }

    const newUser: User = {
      id: `usr-${Date.now()}`,
      username: formUsername.trim().toLowerCase(),
      fullName: formFullName.trim(),
      role: formRole,
      roleTitle: ROLE_PERMISSIONS[formRole]?.title || 'Staff',
      status: formStatus,
      lastLogin: 'Never',
      createdAt: new Date().toISOString().split('T')[0],
    };

    onAddUser(newUser, formPassword);
    setIsAddModalOpen(false);
    showNotice(`Added staff account @${newUser.username} (${newUser.fullName})`);
  };

  const handleSubmitEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser || !formFullName.trim()) return;

    onUpdateUser(editingUser.username, {
      fullName: formFullName.trim(),
      role: formRole,
      roleTitle: ROLE_PERMISSIONS[formRole]?.title,
      status: formStatus,
    });

    setEditingUser(null);
    showNotice(`Updated staff account @${editingUser.username}`);
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.fullName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner / Header */}
      <div className="bg-white rounded-xl border border-[#E8DFC8] p-5 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#2A1810] tracking-tight flex items-center gap-2.5">
            <Users className="w-6 h-6 text-[#8A4A28]" />
            Staff & Account Management
          </h1>
          <p className="text-xs text-[#6B5745] mt-1">
            Manage employee accounts, assign store roles, and configure system access permissions.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#4E342E] hover:bg-[#3E2723] text-white rounded-lg text-xs font-bold shadow-sm transition-all cursor-pointer shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add New Staff Account</span>
        </button>
      </div>

      {/* Temporary Toast Notification */}
      {notification && (
        <div className="p-3 bg-[#EBF8F1] border border-[#A4E0BE] text-[#1E5638] rounded-lg text-xs font-medium flex items-center gap-2 animate-in slide-in-from-top-1">
          <Check className="w-4 h-4 text-[#1E5638]" />
          <span>{notification}</span>
        </div>
      )}

      {/* Role Breakdown Reference Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {(
          Object.entries(ROLE_PERMISSIONS) as [
            UserRole,
            { title: string; permissions: string[]; badgeColor: string }
          ][]
        ).map(([roleKey, roleMeta]) => {
          const count = users.filter((u) => u.role === roleKey).length;
          return (
            <div
              key={roleKey}
              className="bg-white p-3.5 rounded-xl border border-[#E8DFC8] shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded border ${roleMeta.badgeColor}`}
                  >
                    {roleMeta.title}
                  </span>
                  <span className="text-xs font-bold text-[#2A1810] tabular-nums">
                    {count} {count === 1 ? 'user' : 'users'}
                  </span>
                </div>
                <div className="mt-2.5">
                  <span className="text-[10px] font-semibold text-[#8C7355] uppercase tracking-wider block">
                    Access Privileges:
                  </span>
                  <ul className="mt-1 space-y-1">
                    {roleMeta.permissions.map((perm) => (
                      <li
                        key={perm}
                        className="text-[11px] text-[#3D291C] flex items-center gap-1.5 font-medium leading-tight"
                      >
                        <CheckCircle className="w-3 h-3 text-[#2E7D32] shrink-0" />
                        <span>{perm}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-[#E8DFC8] shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8C7355]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by username or name..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-[#FAF7F2] border border-[#E8DFC8] rounded-lg text-[#2A1810] focus:outline-none focus:border-[#8A4A28]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-[#7A6452] font-semibold whitespace-nowrap">Filter Role:</span>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as any)}
            className="px-3 py-2 text-xs bg-[#FAF7F2] border border-[#E8DFC8] rounded-lg text-[#2A1810] focus:outline-none focus:border-[#8A4A28] cursor-pointer"
          >
            <option value="all">All Roles ({users.length})</option>
            <option value="owner">Shop Owner & Admin</option>
            <option value="manager">Store Manager</option>
            <option value="cashier">Cashier / Barista</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-[#E8DFC8] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#2A1810]">
            <thead className="bg-[#F8F4EE] border-b border-[#E8DFC8] text-[11px] font-bold text-[#6D5441] uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Permissions</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Last Activity</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EFEAE2]">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-xs text-[#8C7355]">
                    No accounts found matching your search.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const roleMeta = ROLE_PERMISSIONS[u.role] || ROLE_PERMISSIONS.cashier;
                  const isCurrent = u.username.toLowerCase() === currentUser.username.toLowerCase();
                  return (
                    <tr key={u.username} className="hover:bg-[#FAF7F2] transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#EBDBC9] text-[#542F1E] flex items-center justify-center font-bold text-xs uppercase">
                            {u.username.slice(0, 2)}
                          </div>
                          <div>
                            <div className="font-bold text-[#2A1810] flex items-center gap-1.5">
                              <span>{u.fullName}</span>
                              {isCurrent && (
                                <span className="px-1.5 py-0.2 text-[9px] font-bold bg-[#E6F4EA] text-[#137333] rounded">
                                  YOU
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-[#7A6452] font-mono">@{u.username}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded border inline-block ${roleMeta.badgeColor}`}
                        >
                          {roleMeta.title}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="flex flex-wrap gap-1">
                          {roleMeta.permissions.slice(0, 2).map((perm) => (
                            <span
                              key={perm}
                              className="px-1.5 py-0.5 rounded text-[10px] bg-[#F2ECE4] text-[#5C4533] border border-[#DFD5C8]"
                            >
                              {perm}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        {u.status === 'Inactive' ? (
                          <span className="flex items-center gap-1 text-[11px] font-semibold text-[#B91C1C]">
                            <XCircle className="w-3.5 h-3.5" />
                            Inactive
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[11px] font-semibold text-[#166534]">
                            <CheckCircle className="w-3.5 h-3.5" />
                            Active
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-[#7A6452] text-[11px]">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-[#A89078]" />
                          <span>{u.lastLogin || 'Recent Session'}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onResetPassword(u.username)}
                            className="p-1.5 hover:bg-[#EFEAE2] text-[#8C7355] hover:text-[#2A1810] rounded transition-colors cursor-pointer"
                            title="Reset password to shared default (kenny123)"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenEditModal(u)}
                            className="p-1.5 hover:bg-[#EFEAE2] text-[#8C7355] hover:text-[#2A1810] rounded transition-colors cursor-pointer"
                            title="Edit user details"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          {!isCurrent && (
                            <button
                              onClick={() => {
                                if (confirm(`Are you sure you want to remove account "${u.username}"?`)) {
                                  onDeleteUser(u.username);
                                  showNotice(`Account "${u.username}" removed`);
                                }
                              }}
                              className="p-1.5 hover:bg-[#FEE2E2] text-[#8C7355] hover:text-[#DC2626] rounded transition-colors cursor-pointer"
                              title="Delete account"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add New User Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-[#E8DFC8] w-full max-w-md p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#EFEAE2]">
              <div>
                <h3 className="font-bold text-base text-[#2A1810]">Add New Staff Account</h3>
                <p className="text-xs text-[#7A6452]">Set employee login credentials and role permissions</p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-[#8C7355] hover:text-[#2A1810] p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitAdd} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-[#3D291C] block">Username</label>
                <input
                  type="text"
                  required
                  value={formUsername}
                  onChange={(e) => setFormUsername(e.target.value)}
                  placeholder="e.g. maria_barista"
                  className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DFC8] rounded-lg text-sm text-[#2A1810] focus:outline-none focus:border-[#8A4A28]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[#3D291C] block">Full Name</label>
                <input
                  type="text"
                  required
                  value={formFullName}
                  onChange={(e) => setFormFullName(e.target.value)}
                  placeholder="e.g. Maria Santos"
                  className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DFC8] rounded-lg text-sm text-[#2A1810] focus:outline-none focus:border-[#8A4A28]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[#3D291C] block">Assigned Role</label>
                <select
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DFC8] rounded-lg text-sm text-[#2A1810] focus:outline-none focus:border-[#8A4A28] cursor-pointer"
                >
                  <option value="cashier">Cashier / Barista (POS Register & Checkout)</option>
                  <option value="manager">Store Manager (Products, Inventory, Stock Alerts & Reports)</option>
                  <option value="owner">Shop Owner & Administrator (Full Store Oversight & Accounts)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[#3D291C] block">Initial Password</label>
                <input
                  type="text"
                  required
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DFC8] rounded-lg text-sm font-mono text-[#2A1810] focus:outline-none focus:border-[#8A4A28]"
                />
                <span className="text-[10px] text-[#8C7355] block">Default shared password: kenny123</span>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[#3D291C] block">Status</label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as any)}
                  className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DFC8] rounded-lg text-sm text-[#2A1810] focus:outline-none focus:border-[#8A4A28] cursor-pointer"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#EFEAE2]">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-[#E8DFC8] rounded-lg hover:bg-[#F8F4EE] text-[#5C4533] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#4E342E] hover:bg-[#3E2723] text-white rounded-lg font-bold shadow-xs cursor-pointer"
                >
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-[#E8DFC8] w-full max-w-md p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#EFEAE2]">
              <div>
                <h3 className="font-bold text-base text-[#2A1810]">
                  Edit Account: @{editingUser.username}
                </h3>
                <p className="text-xs text-[#7A6452]">Update staff details and access privileges</p>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                className="text-[#8C7355] hover:text-[#2A1810] p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitEdit} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-[#3D291C] block">Full Name</label>
                <input
                  type="text"
                  required
                  value={formFullName}
                  onChange={(e) => setFormFullName(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DFC8] rounded-lg text-sm text-[#2A1810] focus:outline-none focus:border-[#8A4A28]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[#3D291C] block">Assigned Role</label>
                <select
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DFC8] rounded-lg text-sm text-[#2A1810] focus:outline-none focus:border-[#8A4A28] cursor-pointer"
                >
                  <option value="cashier">Cashier / Barista (POS Register & Checkout)</option>
                  <option value="manager">Store Manager (Products, Inventory, Stock Alerts & Reports)</option>
                  <option value="owner">Shop Owner & Administrator (Full Store Oversight & Accounts)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[#3D291C] block">Account Status</label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as any)}
                  className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DFC8] rounded-lg text-sm text-[#2A1810] focus:outline-none focus:border-[#8A4A28] cursor-pointer"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#EFEAE2]">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 border border-[#E8DFC8] rounded-lg hover:bg-[#F8F4EE] text-[#5C4533] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#4E342E] hover:bg-[#3E2723] text-white rounded-lg font-bold shadow-xs cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
