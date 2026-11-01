'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Plus, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { UserTable } from '@/components/admin/UserTable';
import { CreateUserModal } from '@/components/admin/CreateUserModal';
import { AdminPageHeader, TableSkeleton, getErrorMessage } from '@/components/admin/admin-ui';
import { CreateUserData, UpdateUserData, User } from '@/types';
import api from '@/lib/api';

export default function UsersManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const fetchUsers = useCallback(async (showSkeleton = true) => {
    if (showSkeleton) setIsLoading(true);
    setLoadError(null);
    try {
      const response = await api.get('/admin/users');
      setUsers(response.data);
    } catch (error) {
      setLoadError(getErrorMessage(error, "We couldn't load users."));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchUsers();
  }, [fetchUsers]);

  const handleCreateUser = async (userData: CreateUserData) => {
    try {
      await api.post('/admin/users', userData);
      toast.success(`User ${userData.username} created`);
      setIsCreateModalOpen(false);
      void fetchUsers(false);
    } catch (error) {
      throw new Error(getErrorMessage(error, "We couldn't create this user."));
    }
  };

  const handleUpdateUser = async (id: number, userData: UpdateUserData) => {
    try {
      await api.patch(`/admin/users/${id}`, userData);
      toast.success('User updated');
      void fetchUsers(false);
    } catch (error) {
      throw new Error(getErrorMessage(error, "We couldn't save changes to this user."));
    }
  };

  const handleDeleteUser = async (id: number) => {
    try {
      await api.delete(`/admin/users/${id}`);
      toast.success('User deleted');
      void fetchUsers(false);
    } catch (error) {
      toast.error(getErrorMessage(error, "We couldn't delete this user."));
    }
  };

  const createButton = (
    <Button onClick={() => setIsCreateModalOpen(true)}>
      <Plus aria-hidden='true' />
      Add user
    </Button>
  );

  return (
    <div>
      <AdminPageHeader
        eyebrow='People'
        title='Users'
        description='Manage accounts, roles, and access to the platform.'
        action={createButton}
      />

      {isLoading ? (
        <TableSkeleton label='Loading users' columns={6} />
      ) : loadError ? (
        <ErrorState title="Users couldn't be loaded" message={loadError} onRetry={() => void fetchUsers()} />
      ) : users.length === 0 ? (
        <EmptyState
          icon={Users}
          title='No users yet'
          description='Add the first account to give someone access to the platform.'
          action={createButton}
        />
      ) : (
        <UserTable users={users} onUpdate={handleUpdateUser} onDelete={handleDeleteUser} />
      )}

      <CreateUserModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateUser}
      />
    </div>
  );
}
