import { AI_WORKSPACE_LIMITS } from '@granit/ai';
import { useAIProviderModels, useAIProviders } from '@granit/react-ai';
import { useTranslation } from '@granit/react-localization';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
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
  Switch,
  Textarea,
} from '@granit/react-ui';
import { useMemo, useRef } from 'react';
import { useForm, useWatch } from 'react-hook-form';

import {
  createWorkspaceResolver,
  type CreateWorkspaceFormValues,
  type EditWorkspaceFormValues,
  type WorkspaceFormValues,
} from '../validation';

import { WorkspaceCapabilities } from './workspace-capabilities';

/**
 * Derive a workspace key slug (`^[a-z0-9][a-z0-9-]*$`) from a free-text label:
 * lowercased, accents stripped, runs of invalid characters collapsed to a single
 * hyphen, leading hyphens trimmed, and capped at the server-enforced length.
 */
function slugifyKey(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+/, '')
    .slice(0, AI_WORKSPACE_LIMITS.KEY_MAX_LENGTH);
}

interface WorkspaceFormBaseProps {
  onCancel: () => void;
  isPending?: boolean;
}

interface CreateWorkspaceFormProps extends WorkspaceFormBaseProps {
  mode: 'create';
  defaultValues?: Partial<CreateWorkspaceFormValues>;
  onSubmit: (data: CreateWorkspaceFormValues) => Promise<void>;
}

interface EditWorkspaceFormProps extends WorkspaceFormBaseProps {
  mode: 'edit';
  defaultValues?: Partial<EditWorkspaceFormValues>;
  onSubmit: (data: EditWorkspaceFormValues) => Promise<void>;
}

type WorkspaceFormProps = CreateWorkspaceFormProps | EditWorkspaceFormProps;

export function WorkspaceForm(props: Readonly<WorkspaceFormProps>) {
  const { mode, onCancel, isPending = false } = props;
  const { t } = useTranslation();
  const isCreate = mode === 'create';

  const formResolver = useMemo(
    () => createWorkspaceResolver(isCreate ? 'create' : 'edit', t),
    [isCreate, t]
  );

  const form = useForm<WorkspaceFormValues>({
    resolver: formResolver,
    defaultValues: {
      provider: '',
      model: '',
      displayName: '',
      systemPrompt: '',
      temperature: '',
      maxOutputTokens: '',
      ...(isCreate ? { key: '' } : { activated: true }),
      ...props.defaultValues,
    },
  });

  // In create mode the key auto-derives from the label until the user edits the
  // key directly; from then on we stop overwriting their explicit choice.
  const keyEdited = useRef(false);

  const selectedProvider = useWatch({ control: form.control, name: 'provider' });
  const selectedModel = useWatch({ control: form.control, name: 'model' });
  const { data: providers } = useAIProviders();
  const { data: models } = useAIProviderModels(selectedProvider || undefined);

  const selectedModelCapabilities =
    models?.find((m) => m.id === selectedModel)?.capabilities ?? null;

  const handleSubmit = form.handleSubmit(async (data) => {
    if (props.mode === 'create') {
      await props.onSubmit(data as CreateWorkspaceFormValues);
    } else {
      await props.onSubmit(data as EditWorkspaceFormValues);
    }
  });

  return (
    <Form {...form}>
      <form data-slot="workspace-form" onSubmit={handleSubmit} className="space-y-6">
        {isCreate && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('AI.Workspaces.Form.Identity')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('AI.Workspaces.Form.ModelName')}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value ?? ''}
                        placeholder="GPT-4o"
                        onChange={(event) => {
                          field.onChange(event);
                          // Live-derive the key from the label until the user
                          // overrides it, stripping characters the slug forbids.
                          if (!keyEdited.current) {
                            form.setValue('key', slugifyKey(event.target.value), {
                              shouldValidate: true,
                            });
                          }
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="key"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('AI.Workspaces.Form.Key')}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="my-workspace"
                        className="font-mono"
                        onChange={(event) => {
                          keyEdited.current = true;
                          field.onChange(event);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('AI.Workspaces.Form.Provider')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="provider"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('AI.Workspaces.Form.ProviderName')}</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={(value) => {
                        field.onChange(value);
                        form.setValue('model', '');
                      }}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder={t('AI.Workspaces.Form.SelectProvider')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {providers?.map((p) => (
                          <SelectItem key={p.name} value={p.name}>
                            {p.name}
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
                name="model"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('AI.Workspaces.Form.Model')}</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={!selectedProvider}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder={t('AI.Workspaces.Form.SelectModel')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {models?.map((m) => (
                          <SelectItem key={m.id} value={m.id}>
                            {m.displayName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <WorkspaceCapabilities capabilities={selectedModelCapabilities} />
            {!isCreate && (
              <FormField
                control={form.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('AI.Workspaces.Form.ModelName')}</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ''} placeholder="GPT-4o" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('AI.Workspaces.Form.Configuration')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="systemPrompt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('AI.Workspaces.Form.SystemPrompt')}</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      rows={4}
                      placeholder={t('AI.Workspaces.Form.SystemPromptPlaceholder')}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="temperature"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('AI.Workspaces.Form.Temperature')}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        step="0.1"
                        min={0}
                        max={2}
                        placeholder="0.7"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="maxOutputTokens"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('AI.Workspaces.Form.MaxOutputTokens')}</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" min={1} placeholder="4096" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {!isCreate && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('AI.Workspaces.Form.Status')}</CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="activated"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-3">
                    <FormControl>
                      <Switch checked={field.value as boolean} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className="!mt-0 cursor-pointer">
                      {t('AI.Workspaces.Form.IsActive')}
                    </FormLabel>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        )}

        <div className="flex gap-2">
          <Button type="submit" disabled={isPending}>
            {isPending ? '...' : t('Common.Save')}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel}>
            {t('Common.Cancel')}
          </Button>
        </div>
      </form>
    </Form>
  );
}
