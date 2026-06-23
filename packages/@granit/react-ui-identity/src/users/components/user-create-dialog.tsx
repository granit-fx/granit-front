import { useCreateUser } from '@granit/react-identity';
import { useTranslation } from '@granit/react-localization';
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Switch,
} from '@granit/react-ui';
import { useState } from 'react';
import { toast } from 'sonner';

import { logger } from '../../logger';

interface UserCreateDialogProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
}

interface CreateUserForm {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  enabled: boolean;
}

export function UserCreateDialog({ open, onOpenChange }: UserCreateDialogProps) {
  const { t } = useTranslation();
  const createUser = useCreateUser();
  const [form, setForm] = useState<CreateUserForm>({
    username: '',
    email: '',
    firstName: '',
    lastName: '',
    enabled: true,
  });

  function resetForm() {
    setForm({ username: '', email: '', firstName: '', lastName: '', enabled: true });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await createUser.mutateAsync({
        username: form.username,
        email: form.email,
        firstName: form.firstName || undefined,
        lastName: form.lastName || undefined,
        enabled: form.enabled,
      });
      toast.success(t('Users.CreateSuccess', 'User created successfully.'));
      resetForm();
      onOpenChange(false);
    } catch (err) {
      // API errors are surfaced by the global MutationCache.onError toast.
      logger.error('[UserCreate] Failed', err);
    }
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) resetForm();
    onOpenChange(nextOpen);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('Users.CreateTitle', 'Create user')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="createFirstName">{t('Users.Profile.FirstName')}</Label>
              <Input
                id="createFirstName"
                value={form.firstName}
                onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                autoComplete="given-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="createLastName">{t('Users.Profile.LastName')}</Label>
              <Input
                id="createLastName"
                value={form.lastName}
                onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                autoComplete="family-name"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="createUsername">
              {t('Users.Columns.Username')}
              <span className="ml-1 text-destructive">*</span>
            </Label>
            <Input
              id="createUsername"
              value={form.username}
              onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
              required
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="createEmail">
              {t('Users.Columns.Email')}
              <span className="ml-1 text-destructive">*</span>
            </Label>
            <Input
              id="createEmail"
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              autoComplete="email"
              required
            />
          </div>
          <div className="flex items-center gap-3">
            <Switch
              id="createEnabled"
              checked={form.enabled}
              onCheckedChange={(v) => setForm((f) => ({ ...f, enabled: v }))}
            />
            <Label htmlFor="createEnabled">{t('Users.Status.Enabled')}</Label>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              {t('Common.Cancel')}
            </Button>
            <Button type="submit" disabled={createUser.isPending}>
              {createUser.isPending ? t('Common.Loading') : t('Users.CreateButton', 'Create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
