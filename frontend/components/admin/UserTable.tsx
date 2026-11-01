'use client';

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';
import { EditUserModal } from './EditUserModal';
import { RowActions, TableSurface } from './admin-ui';
import { User, UpdateUserData } from '@/types';

interface UserTableProps {
  users: User[];
  onUpdate: (id: number, userData: UpdateUserData) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}

export function UserTable({ users, onUpdate, onDelete }: UserTableProps) {
  const [editingUser, setEditingUser] = useState<User | null>(null);

  return (
    <>
      <TableSurface>
        <Table>
          <TableCaption className='sr-only'>Users ({users.length})</TableCaption>
          <TableHeader className='bg-muted/40'>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className='w-24 text-right'>
                <span className='sr-only'>Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <p className='font-medium text-foreground'>{user.username}</p>
                  <p className='text-muted-foreground'>{user.email}</p>
                </TableCell>
                <TableCell className='capitalize'>{user.role}</TableCell>
                <TableCell>
                  <Badge variant={user.isActive ? 'success' : 'secondary'}>
                    {user.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
                <TableCell className='whitespace-nowrap text-muted-foreground'>
                  {user.createdAt ? formatDate(user.createdAt) : '—'}
                </TableCell>
                <TableCell>
                  <RowActions
                    itemType='user'
                    itemLabel={user.username}
                    onEdit={() => setEditingUser(user)}
                    onDelete={() => onDelete(user.id)}
                    deleteDescription='This permanently deletes the account and its enrollments and progress.'
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableSurface>

      {editingUser && (
        <EditUserModal
          user={editingUser}
          isOpen={!!editingUser}
          onClose={() => setEditingUser(null)}
          onSubmit={async (data) => {
            await onUpdate(editingUser.id, data);
            setEditingUser(null);
          }}
        />
      )}
    </>
  );
}
