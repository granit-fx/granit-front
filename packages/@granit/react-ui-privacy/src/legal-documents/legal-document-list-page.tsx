import { usePermissions } from '@granit/react-authorization';
import { useTranslation } from '@granit/react-localization';
import { useLegalDocuments } from '@granit/react-privacy';
import {
  Badge,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@granit/react-ui';
import { dataTableFeatures, EmptyState } from '@granit/react-ui-kit';
import { flexRender, useTable } from '@tanstack/react-table';
import { Loader2, Plus, X } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';

import { useLegalDocumentColumns } from './components/legal-document-columns';
import { LegalDocumentPublishDialog } from './components/legal-document-publish-dialog';

import type { LegalDocumentDetailResponse } from '@granit/privacy';

export function LegalDocumentListPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { hasPermission } = usePermissions();
  const canCreate = hasPermission('Privacy.LegalDocuments.Create');

  const documentIdFilter = searchParams.get('documentId');
  const { data: documents, isLoading } = useLegalDocuments(
    documentIdFilter ? { documentId: documentIdFilter } : undefined
  );

  const [publishTarget, setPublishTarget] = useState<LegalDocumentDetailResponse | null>(null);

  const columns = useLegalDocumentColumns({
    onViewVersions: (docId) => {
      setSearchParams({ documentId: docId });
    },
    onEdit: (id) => {
      navigate(`/privacy/legal-documents/${id}/edit`);
    },
    onPublish: (doc) => {
      setPublishTarget(doc);
    },
  });

  const table = useTable({
    features: dataTableFeatures,
    data: documents ?? [],
    columns,
  });

  function clearFilter() {
    setSearchParams({});
  }

  return (
    <div data-slot="legal-document-list-page" className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">
            {t('Privacy.LegalDocuments.Title')}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('Privacy.LegalDocuments.Subtitle')}
          </p>
        </div>
        {canCreate && (
          <Button asChild>
            <Link to="/privacy/legal-documents/new">
              <Plus className="mr-2 size-4" />
              {t('Privacy.LegalDocuments.NewDocument')}
            </Link>
          </Button>
        )}
      </div>

      {documentIdFilter && (
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="gap-1 px-3 py-1">
            {t('Privacy.LegalDocuments.FilteredBy', { documentId: documentIdFilter })}
            <button
              onClick={clearFilter}
              className="ml-1 rounded-full hover:bg-muted"
              aria-label={t('Privacy.LegalDocuments.ClearFilter')}
            >
              <X className="size-3" />
            </button>
          </Badge>
        </div>
      )}

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      )}
      {!isLoading && documents && documents.length > 0 && (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      {!isLoading && (!documents || documents.length === 0) && (
        <EmptyState message={t('Privacy.LegalDocuments.NoDocuments')} />
      )}

      {publishTarget && (
        <LegalDocumentPublishDialog
          documentId={publishTarget.id}
          displayName={publishTarget.displayName}
          open={true}
          onOpenChange={(open) => {
            if (!open) setPublishTarget(null);
          }}
        />
      )}
    </div>
  );
}
