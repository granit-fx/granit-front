import { apiKeysConstraints } from '@granit/authentication-api-keys';
import { useGranitClient } from '@granit/react-api-client';
import { useCreateApiKey } from '@granit/react-authentication-api-keys';
import { useTranslation } from '@granit/react-localization';
import {
  Button,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  toast,
} from '@granit/react-ui';
import { createConstraintsResolver } from '@granit/react-validation';
import { toISODateString } from '@granit/types';
import { Loader2 } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';

import { API_KEY_ENVIRONMENTS, API_KEY_TYPES, CACHE_BEHAVIORS } from '../constants';
import { type ApiKeyCreateFormValues } from '../validation';

import { ApiKeySecretDialog } from './api-key-secret-dialog';

import type { Resolver } from 'react-hook-form';

// RFC 5737 documentation-only address used as a UI placeholder. NOSONAR
const CIDR_EXAMPLE = '203.0.113.0/24';

/** Title-cases a form field name to match the `ApiKeys.Fields.*` key suffix. */
function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function tomorrowDateInputValue(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function ApiKeyCreatePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const client = useGranitClient();
  const createMutation = useCreateApiKey({ client });

  const [createdSecret, setCreatedSecret] = useState<string | null>(null);
  const [createdId, setCreatedId] = useState<string | null>(null);

  const [permissionInput, setPermissionInput] = useState('');
  const [cidrInput, setCidrInput] = useState('');

  const expiresAtMin = useMemo(() => tomorrowDateInputValue(), []);

  // Spec-derived validation from the OpenAPI-backed apiKeysConstraints.
  const formResolver = createConstraintsResolver(apiKeysConstraints.ApiKeyCreateRequest, t, {
    labelResolver: (field) => t(`ApiKeys.Fields.${capitalize(field)}`, field),
  }) as unknown as Resolver<ApiKeyCreateFormValues>;

  const form = useForm<ApiKeyCreateFormValues>({
    resolver: formResolver,
    defaultValues: {
      name: '',
      type: 'Secret',
      environment: 'dev',
      permissions: [],
      allowedCidrs: [],
      cacheBehavior: 'Normal',
    },
  });

  const handleSubmit = useCallback(
    (data: ApiKeyCreateFormValues) => {
      createMutation.mutate(
        {
          ...data,
          expiresAt: data.expiresAt
            ? toISODateString(new Date(data.expiresAt).toISOString())
            : undefined,
        },
        {
          onSuccess: (result) => {
            setCreatedSecret(result.rawSecret);
            setCreatedId(result.id);
            toast.success(t('ApiKeys.CreateSuccess'));
          },
        }
      );
    },
    [createMutation, t]
  );

  const handleSecretDialogClose = useCallback(() => {
    setCreatedSecret(null);
    if (createdId) {
      navigate(`/api-keys/${createdId}`);
    }
  }, [createdId, navigate]);

  const addPermission = useCallback(() => {
    const trimmed = permissionInput.trim();
    if (!trimmed) return;
    const current = form.getValues('permissions');
    if (!current.includes(trimmed)) {
      form.setValue('permissions', [...current, trimmed], { shouldValidate: true });
    }
    setPermissionInput('');
  }, [permissionInput, form]);

  const addCidr = useCallback(() => {
    const trimmed = cidrInput.trim();
    if (!trimmed) return;
    const current = form.getValues('allowedCidrs');
    if (!current.includes(trimmed)) {
      form.setValue('allowedCidrs', [...current, trimmed], { shouldValidate: true });
    }
    setCidrInput('');
  }, [cidrInput, form]);

  const handlePermissionKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        addPermission();
      }
    },
    [addPermission]
  );

  const handleCidrKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        addCidr();
      }
    },
    [addCidr]
  );

  return (
    <div data-slot="api-key-create-page" className="mx-auto max-w-2xl space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground">{t('ApiKeys.Create')}</h2>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('ApiKeys.Name')}</FormLabel>
                <FormControl>
                  <Input {...field} placeholder={t('ApiKeys.NamePlaceholder')} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('ApiKeys.Type')}</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {API_KEY_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {t(`ApiKeys.Types.${type}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="environment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('ApiKeys.Environment')}</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {API_KEY_ENVIRONMENTS.map((env) => (
                        <SelectItem key={env} value={env}>
                          {t(`ApiKeys.Environments.${capitalize(env)}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="permissions"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('ApiKeys.Permissions')}</FormLabel>
                <div className="flex gap-2">
                  <Input
                    value={permissionInput}
                    onChange={(e) => setPermissionInput(e.target.value)}
                    onKeyDown={handlePermissionKeyDown}
                    placeholder={t('ApiKeys.PermissionsPlaceholder')}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addPermission}
                    disabled={!permissionInput.trim()}
                  >
                    {t('Common.Add')}
                  </Button>
                </div>
                <TagList
                  values={field.value}
                  onRemove={(v) => field.onChange(field.value.filter((item) => item !== v))}
                />
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="allowedCidrs"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('ApiKeys.AllowedCidrs')}</FormLabel>
                <div className="flex gap-2">
                  <Input
                    value={cidrInput}
                    onChange={(e) => setCidrInput(e.target.value)}
                    onKeyDown={handleCidrKeyDown}
                    placeholder={t('ApiKeys.CidrPlaceholder', CIDR_EXAMPLE)}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addCidr}
                    disabled={!cidrInput.trim()}
                  >
                    {t('Common.Add')}
                  </Button>
                </div>
                <TagList
                  values={field.value}
                  onRemove={(v) => field.onChange(field.value.filter((item) => item !== v))}
                />
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="expiresAt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('ApiKeys.ExpiresAt')}</FormLabel>
                  <FormControl>
                    <Input type="date" min={expiresAtMin} {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="cacheBehavior"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('ApiKeys.CacheBehavior')}</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {CACHE_BEHAVIORS.map((behavior) => (
                        <SelectItem key={behavior} value={behavior}>
                          {behavior}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/api-keys')}
              disabled={createMutation.isPending}
            >
              {t('Common.Cancel')}
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending && <Loader2 className="mr-1 size-3.5 animate-spin" />}
              {t('ApiKeys.Create')}
            </Button>
          </div>
        </form>
      </Form>

      <ApiKeySecretDialog
        open={!!createdSecret}
        secret={createdSecret ?? ''}
        onClose={handleSecretDialogClose}
      />
    </div>
  );
}

function TagList({
  values,
  onRemove,
}: Readonly<{ values: readonly string[]; onRemove: (value: string) => void }>) {
  if (values.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5 pt-1">
      {values.map((v) => (
        <span
          key={v}
          className="inline-flex items-center gap-1 rounded-md border bg-muted px-2 py-0.5 text-sm font-mono"
        >
          {v}
          <button
            type="button"
            className="text-muted-foreground hover:text-foreground"
            onClick={() => onRemove(v)}
            aria-label={`Remove ${v}`}
          >
            &times;
          </button>
        </span>
      ))}
    </div>
  );
}
