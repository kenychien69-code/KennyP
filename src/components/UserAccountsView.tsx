import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Users,
  UserPlus,
  Search,
  KeyRound,
  Trash2,
  Edit2,
  Check,
  ShieldAlert,
  Briefcase,
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
  { title: string; badgeColor: string; description: string }
> = {
  owner: {
    title: 'Shop Owner',
    badgeColor: 'text-[#4A2E20] font-bold bg-transparent border-0',
    description: 'System Administrator & Shop Owner',
  },
  manager: {
    title: 'Store Manager',
    badgeColor: 'text-[#8A4A28] font-bold bg-transparent border-0',
    description: 'Full Store Operations (POS, Inventory, Reports & Forecasts)',
  },
  cashier: {
    title: 'Cashier / Barista',
    badgeColor: 'text-[#6E562A] font-semibold bg-transparent border-0',
    description: 'POS Terminal Register & Customer Checkout',
  },
};

// Helper to identify administrative / owner accounts
export const isAdminAccount = (u: User): boolean => {
  if (!u) return false;
  const username = (u.username || '').toLowerCase().trim();
  const role = (u.role as string || '').toLowerCase().trim();
  const fullName = (u.fullName || '').toLowerCase().trim();

  return (
    role === 'owner' ||
    role === 'admin' ||
    username === 'owner' ||
    username === 'admin' ||
    username === 'shopowner' ||
    fullName.includes('shop owner')
  );
};

export const UserAccountsView: React.FC<UserAccountsViewProps> = ({
  users,
  onAddUser,
  onUpdateUser,
  onDeleteUser,
  onResetPassword,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'manager' | 'cashier'>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  // Form states
  const [formUsername, setFormUsername] = useState('');
  const [formFullName, setFormFullName] = useState('');
  const [formRole, setFormRole] = useState<'cashier' | 'manager'>('cashier');
  const [formPassword, setFormPassword] = useState('kenny123');
  const [formError, setFormError] = useState<string | null>(null);

  const showNotice = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  // Filter out any admin/owner account so it is completely invisible in staff management
  const staffOnlyUsers = users.filter((u) => !isAdminAccount(u));

  const managerCount = staffOnlyUsers.filter((u) => u.role === 'manager').length;
  const cashierCount = staffOnlyUsers.filter((u) => u.role !== 'manager').length;

  const handleOpenAddModal = () => {
    setFormUsername('');
    setFormFullName('');
    setFormRole('cashier');
    setFormPassword('kenny123');
    setFormError(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (u: User) => {
    setEditingUser(u);
    setFormFullName(u.fullName);
    setFormRole(u.role === 'manager' ? 'manager' : 'cashier');
    setFormError(null);
  };

  const handleSubmitAdd = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const cleanUsername = formUsername.trim().toLowerCase();
    const cleanFullName = formFullName.trim();

    if (!cleanUsername || !cleanFullName) {
      setFormError('Please fill in all required fields.');
      return;
    }

    // Protect administrative handles
    if (cleanUsername === 'owner' || cleanUsername === 'admin' || cleanUsername === 'shopowner') {
      setFormError(`Username '@${cleanUsername}' is reserved for the system administrator.`);
      return;
    }

    if (users.some((u) => String(u?.username || '').toLowerCase().trim() === cleanUsername)) {
      setFormError(`Username @${cleanUsername} is already taken.`);
      return;
    }

    const newUser: User = {
      id: `usr-${Date.now()}`,
      username: cleanUsername,
      fullName: cleanFullName,
      role: formRole,
      roleTitle: ROLE_PERMISSIONS[formRole].title,
      lastLogin: 'Never',
      createdAt: new Date().toISOString().split('T')[0],
      password: formPassword.trim() || 'kenny123',
    };

    onAddUser(newUser, formPassword.trim() || 'kenny123');
    setIsAddModalOpen(false);
    showNotice(`Added ${ROLE_PERMISSIONS[formRole].title} @${newUser.username}`);
  };

  const handleSubmitEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser || !formFullName.trim()) return;

    onUpdateUser(editingUser.username, {
      fullName: formFullName.trim(),
      role: formRole,
      roleTitle: ROLE_PERMISSIONS[formRole].title,
    });

    setEditingUser(null);
    showNotice(`Updated staff account @${editingUser.username}`);
  };

  // Filter staff by search and role
  const filteredStaff = staffOnlyUsers.filter((u) => {
    if (!u) return false;
    const uName = String(u.username || '').toLowerCase();
    const fName = String(u.fullName || (u as any).name || '').toLowerCase();
    const sTerm = String(searchTerm || '').toLowerCase();
    const matchesSearch = uName.includes(sTerm) || fName.includes(sTerm);
    const matchesRole =
      roleFilter === 'all' ||
      (roleFilter === 'manager' ? u.role === 'manager' : u.role !== 'manager');
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner / Header */}
      <div className="bg-white rounded-xl border border-[#E8DFC8] p-5 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#2A1810] tracking-tight flex items-center gap-2.5">
            <Users className="w-6 h-6 text-[#8A4A28]" />
            Staff & Employee Management
          </h1>
          <p className="text-xs text-[#6B5745] mt-1">
            Manage store team members, configure Store Manager and Cashier / Barista roles, and handle access credentials.
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
        <div className="p-3 bg-[#FAF5EE] border border-[#E8DFC8] text-[#4A2E20] rounded-lg text-xs font-semibold flex items-center gap-2 animate-in slide-in-from-top-1 shadow-xs">
          <Check className="w-4 h-4 text-[#8A4A28]" />
          <span>{notification}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-[#E8DFC8] shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8C7355]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search staff by username or name..."
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
            <option value="all">All Roles ({staffOnlyUsers.length})</option>
            <option value="manager">Store Manager ({managerCount})</option>
            <option value="cashier">Cashier / Barista ({cashierCount})</option>
          </select>
        </div>
      </div>

      {/* Staff Table or Empty State */}
      {staffOnlyUsers.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#E8DFC8] p-12 text-center shadow-xs">
          <div className="w-14 h-14 mx-auto rounded-full bg-[#F5EDE6] text-[#8A4A28] flex items-center justify-center mb-4 border border-[#E8DFC8]">
            <Users className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-[#2A1810]">No Staff Accounts Yet</h3>
          <p className="text-xs text-[#7A6452] mt-1.5 max-w-md mx-auto leading-relaxed">
            Only store employees (Store Managers, Baristas, and Cashiers) are listed here. The administrative Shop Owner account is private and hidden.
          </p>
          <button
            onClick={handleOpenAddModal}
            className="mt-5 inline-flex items-center gap-2 px-4 py-2.5 bg-[#4E342E] hover:bg-[#3E2723] text-white rounded-lg text-xs font-bold shadow-sm transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add First Staff Member</span>
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-[#E8DFC8] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#2A1810]">
              <thead className="bg-[#F8F4EE] border-b border-[#E8DFC8] text-[11px] font-bold text-[#6D5441] uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Staff Member</th>
                  <th className="py-3 px-4">Assigned Role</th>
                  <th className="py-3 px-4">System Access</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EFEAE2]">
                {filteredStaff.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-xs text-[#8C7355]">
                      No staff accounts found matching your search.
                    </td>
                  </tr>
                ) : (
                  filteredStaff.map((u) => {
                    const roleMeta = ROLE_PERMISSIONS[u.role] || ROLE_PERMISSIONS.cashier;
                    return (
                      <tr key={u.username || u.id} className="hover:bg-[#FAF7F2] transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#EBDBC9] text-[#542F1E] flex items-center justify-center font-bold text-xs uppercase">
                              {(u.username || 'ST').slice(0, 2)}
                            </div>
                            <div>
                              <div className="font-bold text-[#2A1810] flex items-center gap-1.5">
                                <span>{u.fullName || (u as any).name || u.username || 'Staff Member'}</span>
                              </div>
                              <div className="text-[11px] text-[#7A6452] font-mono">@{u.username || 'staff'}</div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span
                            className={`text-[11px] font-semibold px-0 py-0 rounded inline-flex items-center gap-1.5 ${roleMeta.badgeColor}`}
                          >
                            <Briefcase className="w-3.5 h-3.5" />
                            {roleMeta.title}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-[#7A6452] text-[11px]">
                          {roleMeta.description}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                onResetPassword(u.username);
                                showNotice(`Password for @${u.username} reset to default: kenny123`);
                              }}
                              className="p-1.5 hover:bg-[#EFEAE2] text-[#8C7355] hover:text-[#2A1810] rounded transition-colors cursor-pointer"
                              title="Reset password to shared default (kenny123)"
                            >
                              <KeyRound className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleOpenEditModal(u)}
                              className="p-1.5 hover:bg-[#EFEAE2] text-[#8C7355] hover:text-[#2A1810] rounded transition-colors cursor-pointer"
                              title="Edit staff details"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setUserToDelete(u)}
                              className="p-1.5 hover:bg-[#FEE2E2] text-[#8C7355] hover:text-[#DC2626] rounded transition-colors cursor-pointer"
                              title="Delete staff account"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
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
      )}

      {/* Add New Staff Modal */}
      {isAddModalOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl border border-[#E8DFC8] w-full max-w-md p-6 space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-[#EFEAE2]">
              <div>
                <h3 className="font-bold text-base text-[#2A1810]">Add New Staff Account</h3>
                <p className="text-xs text-[#7A6452]">Set employee login credentials and assign store role</p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-[#8C7355] hover:text-[#2A1810] p-1 cursor-pointer font-bold"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0 text-red-600" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitAdd} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-[#3D291C] block">Staff Username</label>
                <input
                  type="text"
                  required
                  value={formUsername}
                  onChange={(e) => setFormUsername(e.target.value)}
                  placeholder="e.g. maria_manager or dave_barista"
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
                  onChange={(e) => setFormRole(e.target.value as 'cashier' | 'manager')}
                  className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DFC8] rounded-lg text-sm text-[#2A1810] focus:outline-none focus:border-[#8A4A28] cursor-pointer"
                >
                  <option value="cashier">Cashier / Barista</option>
                  <option value="manager">Store Manager</option>
                </select>
                <p className="text-[11px] text-[#8C7355] mt-1">
                  {formRole === 'manager'
                    ? 'Store Managers can run Dashboard, POS, Products & Inventory, Sales Reports, and AI Forecasts. Staff Management is reserved for the Shop Owner.'
                    : 'Cashiers & Baristas can only access the POS Terminal register for customer orders.'}
                </p>
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
                  Create Staff Account
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Edit Staff Modal */}
      {editingUser && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl border border-[#E8DFC8] w-full max-w-md p-6 space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-[#EFEAE2]">
              <div>
                <h3 className="font-bold text-base text-[#2A1810]">
                  Edit Staff Member: @{editingUser.username}
                </h3>
                <p className="text-xs text-[#7A6452]">Update employee details and assigned role</p>
              </div>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="text-[#8C7355] hover:text-[#2A1810] p-1 cursor-pointer font-bold"
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
                  onChange={(e) => setFormRole(e.target.value as 'cashier' | 'manager')}
                  className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DFC8] rounded-lg text-sm text-[#2A1810] focus:outline-none focus:border-[#8A4A28] cursor-pointer"
                >
                  <option value="cashier">Cashier / Barista</option>
                  <option value="manager">Store Manager</option>
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
        </div>,
        document.body
      )}

      {/* Delete Staff Account Confirmation Modal */}
      {userToDelete && createPortal(
        <div className="fixed inset-0 z-[9999] bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-sm w-full border border-[#E8DFC8] shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-bold text-base text-[#2A1810]">
                  Delete Staff Account
                </h3>
                <p className="text-xs text-[#7A6452]">This will revoke access and remove the employee account.</p>
              </div>
            </div>

            <p className="text-xs text-[#3D291C] bg-[#FAF7F2] p-3 rounded-lg border border-[#E8DFC8]">
              Are you sure you want to remove staff member <strong className="text-[#2A1810]">"{userToDelete.fullName} (@{userToDelete.username})"</strong>?
            </p>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#E8DFC8]">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                className="px-4 py-2 border border-[#E8DFC8] rounded-lg text-xs font-semibold text-[#5C4533] hover:bg-[#F8F4EE] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteUser(userToDelete.username);
                  showNotice(`Staff account "${userToDelete.username}" removed`);
                  setUserToDelete(null);
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
