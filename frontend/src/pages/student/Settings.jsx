import React, { useState, useContext } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  User,
  Lock,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import StudentLayout from '../../components/layout/StudentLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { AuthContext } from '../../context/authContext';
import { toast } from 'sonner';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import api from '../../services/api';

const passwordRequirements =
  'Password must be at least 8 characters, include uppercase, lowercase, number, and special character.';

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, passwordRequirements)
      .regex(/[A-Z]/, passwordRequirements)
      .regex(/[a-z]/, passwordRequirements)
      .regex(/[0-9]/, passwordRequirements)
      .regex(/[^A-Za-z0-9]/, passwordRequirements),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'New password must be different from current password',
    path: ['newPassword'],
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

const Settings = () => {
  const { user, logout } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('account'); // 'account', 'danger'
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    formState: { errors: passwordErrors },
    reset: resetPassword,
  } = useForm({
    resolver: zodResolver(passwordSchema),
  });

  const onPasswordSubmit = async (data) => {
    setPasswordLoading(true);
    try {
      const res = await api.post('/auth/change-password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
        confirmPassword: data.confirmPassword,
      });
      toast.success('✓ ' + (res.data?.message || 'Password changed successfully. Please use your new password on your next login.'));
      resetPassword();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to change password.');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleDeleteAccountClick = () => {
    setShowConfirmDelete(true);
  };

  const handleConfirmDeleteAccount = async () => {
    try {
      await api.delete('/auth/me');
      toast.success('Account successfully deleted');
      setShowConfirmDelete(false);
      logout();
    } catch {
      toast.error('Failed to delete account');
      setShowConfirmDelete(false);
    }
  };

  return (
    <StudentLayout user={user}>
      <div className="space-y-6 max-w-4xl mx-auto">
        <ConfirmModal
          open={showConfirmDelete}
          onClose={() => setShowConfirmDelete(false)}
          onConfirm={handleConfirmDeleteAccount}
          title="Delete account?"
          message="Are you sure you want to delete your account? This action cannot be undone."
          confirmLabel="Delete account"
          cancelLabel="Cancel"
          variant="danger"
        />
        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Settings
          </h1>
          <p className="mt-1 text-sm sm:text-base text-slate-600 dark:text-gray-300">
            Manage your account preferences and settings
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-gray-200 dark:border-gray-800">
          {[
            { key: 'account', label: 'Account', icon: User },
            { key: 'danger', label: 'Danger Zone', icon: AlertTriangle },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-b-2 border-transparent text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Account Tab */}
        {activeTab === 'account' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmitPassword(onPasswordSubmit)} className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Current Password
                    </label>
                    <Input
                      {...registerPassword('currentPassword')}
                      type="password"
                      placeholder="Enter current password"
                    />
                    {passwordErrors.currentPassword && (
                      <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                        {passwordErrors.currentPassword.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      New Password
                    </label>
                    <Input
                      {...registerPassword('newPassword')}
                      type="password"
                      placeholder="Enter new password"
                    />
                    {passwordErrors.newPassword && (
                      <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                        {passwordErrors.newPassword.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Confirm New Password
                    </label>
                    <Input
                      {...registerPassword('confirmPassword')}
                      type="password"
                      placeholder="Confirm new password"
                    />
                    {passwordErrors.confirmPassword && (
                      <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                        {passwordErrors.confirmPassword.message}
                      </p>
                    )}
                  </div>
                  <Button
                    type="submit"
                    disabled={passwordLoading}
                    className="gap-2 bg-blue-600 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    <Lock size={18} />
                    {passwordLoading ? 'Updating...' : 'Change Password'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Danger Zone Tab */}
        {activeTab === 'danger' && (
          <div className="space-y-6">
            <Card className="border-red-200 dark:border-red-900">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
                  <AlertTriangle size={20} />
                  Danger Zone
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950 p-6">
                  <h3 className="mb-2 text-lg font-semibold text-red-900 dark:text-red-300">
                    Delete Account
                  </h3>
                  <p className="mb-4 text-sm text-red-700 dark:text-red-400">
                    Once you delete your account, there is no going back. All your data,
                    including applications and saved jobs, will be permanently deleted.
                  </p>
                  <Button
                    onClick={handleDeleteAccountClick}
                    variant="destructive"
                    className="gap-2"
                  >
                    <Trash2 size={18} />
                    Delete My Account
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </StudentLayout>
  );
};

export default Settings;
