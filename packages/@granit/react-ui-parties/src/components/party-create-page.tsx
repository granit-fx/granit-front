import { useTranslation } from '@granit/react-localization';
import { isAxiosError, useCreatePartyMutation } from '@granit/react-parties';
import { toast, Button, Separator } from '@granit/react-ui';
import { ArrowLeft } from 'lucide-react';
import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router';

import { logger } from '../logger';

import { CreateConflictDialog } from './create-conflict-dialog';
import { PartyCreateForm } from './party-create-form';

import type { PartyCreateFormValues } from '../validation';
import type {
  PartyCreateConflictResponse,
  PartyCreateRequest,
  PartyId,
  PartyKind,
  PartyRole,
} from '@granit/parties';

function buildRequest(values: PartyCreateFormValues): PartyCreateRequest {
  return {
    kind: values.kind as PartyKind,
    name: values.name,
    defaultCurrency: values.defaultCurrency,
    roles: values.role === 'None' ? null : (values.role as PartyRole),
    website: values.website ?? null,
    language: values.language ?? null,
    timezone: values.timezone ?? null,
    internalNotes: values.internalNotes ?? null,
  };
}

function extractConflict(error: unknown): PartyCreateConflictResponse | null {
  if (!isAxiosError(error) || error.response?.status !== 409) return null;
  const data = error.response.data as PartyCreateConflictResponse | undefined;
  if (!data || !Array.isArray(data.candidates)) return null;
  return data;
}

export function PartyCreatePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const mutation = useCreatePartyMutation();
  const [conflict, setConflict] = useState<PartyCreateConflictResponse | null>(null);
  const lastRequest = useRef<PartyCreateRequest | null>(null);

  const handleSubmit = async (values: PartyCreateFormValues) => {
    const request = buildRequest(values);
    lastRequest.current = request;

    try {
      const created = await mutation.mutateAsync({ request });
      toast.success(t('Parties.Create.Success'));
      navigate(`/parties/${created.id}`);
    } catch (err) {
      const conflictBody = extractConflict(err);
      if (conflictBody) {
        setConflict(conflictBody);
        return;
      }
      // API errors are surfaced by the global MutationCache.onError toast.
      logger.error('[PartyCreatePage] create party failed', err);
    }
  };

  const handleCreateAnyway = async (): Promise<PartyId | null> => {
    if (!lastRequest.current) return null;
    try {
      const created = await mutation.mutateAsync({
        request: lastRequest.current,
        options: { force: true },
      });
      return created.id;
    } catch (err) {
      logger.error('[PartyCreatePage] force-create party failed', err);
      return null;
    }
  };

  return (
    <div data-slot="party-create-page" className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/parties">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('Parties.Detail.BackToList')}
          </Link>
        </Button>
        <Separator orientation="vertical" className="h-6" />
        <h2 className="text-2xl font-semibold text-foreground">{t('Parties.Create.Title')}</h2>
      </div>

      <PartyCreateForm
        onSubmit={handleSubmit}
        onCancel={() => navigate('/parties')}
        isPending={mutation.isPending}
      />

      <CreateConflictDialog
        conflict={conflict}
        onCreateAnyway={handleCreateAnyway}
        onClose={() => setConflict(null)}
      />
    </div>
  );
}
