import { createApiClient } from '@granit/api-client';
import { GranitClientProvider } from '@granit/react-api-client';
import { DataExchangeProvider } from '@granit/react-data-exchange';
import { createDataExchangeHandlers } from '@granit/react-data-exchange/testing';
import { TooltipProvider } from '@granit/react-ui';
import { createMswServer } from '@granit/testing/msw-server';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import i18next from 'i18next';
import { http, HttpResponse } from 'msw';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ImportDialog } from '../components/import/import-dialog';
import { dataExchangeTranslationsEn } from '../locales';

import type { ReactNode } from 'react';

// End-to-end regression for the four-step import wizard. Unlike import-dialog.test.tsx
// (which stubs the data hooks), this drives the REAL @granit/react-data-exchange hooks
// against the stateful MSW handlers, exercising the full HTTP pipeline:
//   upload -> preview mappings -> confirm -> execute -> report -> download correction.
// This guards against the pre-refonte backend where execute was a silent no-op and the
// correction file streamed 0 bytes.

// Absolute origin: the multipart upload uses axios' `fetch` transport (jsdom's
// XHR adapter hangs on FormData bodies under MSW), and the fetch adapter requires
// absolute request URLs. `fetch` transport is a supported api-client mode, so the
// hooks still run against the real client — only the adapter differs.
const ORIGIN = 'http://localhost';
const BASE_PATH = `${ORIGIN}/api/v1/data-exchange`;
const IMPORT_BASE = `${BASE_PATH}/import`;

const testI18n = i18next.createInstance();
void testI18n.use(initReactI18next).init({
  lng: 'en',
  fallbackLng: 'en',
  ns: ['translation'],
  defaultNS: 'translation',
  nsSeparator: false,
  keySeparator: false,
  resources: { en: { translation: { ...dataExchangeTranslationsEn } } },
  interpolation: { escapeValue: false },
});

const client = createApiClient({ baseURL: '', transport: 'fetch' });

const server = createMswServer(
  ...createDataExchangeHandlers(`${BASE_PATH}/metadata`, IMPORT_BASE, `${BASE_PATH}/export/jobs`)
);

function Wrapper({ children }: { readonly children: ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return (
    <I18nextProvider i18n={testI18n}>
      <GranitClientProvider client={client}>
        <QueryClientProvider client={queryClient}>
          <DataExchangeProvider config={{ client, basePath: BASE_PATH }}>
            <TooltipProvider>{children}</TooltipProvider>
          </DataExchangeProvider>
        </QueryClientProvider>
      </GranitClientProvider>
    </I18nextProvider>
  );
}

function makeCsv(): File {
  return new File(['code,alpha3\nBE,BEL\n'], 'countries.csv', { type: 'text/csv' });
}

describe('Import wizard (end-to-end)', () => {
  let createObjectURL: ReturnType<typeof vi.fn>;
  let revokeObjectURL: ReturnType<typeof vi.fn>;
  let anchorClick: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // A report with failed rows so the correction-file download surface appears.
    server.use(
      http.get(`${IMPORT_BASE}/:jobId/report`, ({ params }) =>
        HttpResponse.json({
          importJobId: params.jobId as string,
          finalStatus: 'PartiallyCompleted',
          totalRows: 2,
          succeededRows: 1,
          failedRows: 1,
          skippedRows: 0,
          insertedRows: 1,
          updatedRows: 0,
          duration: '00:00:00.200',
          rowErrors: [
            { rowNumber: 2, kind: 'Validation', errorCodes: ['E_ISO'], message: 'Invalid code' },
          ],
        })
      )
    );

    // Stub only the object-URL statics — replacing the whole URL global would
    // break `new URL()` used by axios/MSW when resolving request URLs.
    createObjectURL = vi.fn(() => 'blob:correction');
    revokeObjectURL = vi.fn();
    (URL as unknown as Record<string, unknown>).createObjectURL = createObjectURL;
    (URL as unknown as Record<string, unknown>).revokeObjectURL = revokeObjectURL;

    anchorClick = vi.fn();
    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      if (tag === 'a') {
        return { href: '', download: '', click: anchorClick } as unknown as HTMLAnchorElement;
      }
      return originalCreateElement(tag);
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete (URL as unknown as Record<string, unknown>).createObjectURL;
    delete (URL as unknown as Record<string, unknown>).revokeObjectURL;
  });

  it('runs the full pipeline: upload -> map -> execute -> report -> download correction', async () => {
    const user = userEvent.setup({ delay: null });

    render(
      <Wrapper>
        <ImportDialog definitionName="Admin.CountryImport" open onOpenChange={vi.fn()} />
      </Wrapper>
    );

    // Step 1 — upload. Selecting a file creates the job and auto-triggers preview.
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(fileInput, makeCsv());

    // Step 2 — map. The preview response drives the wizard to the mapping table.
    await waitFor(() =>
      expect(document.querySelector('[data-slot="column-mapping-table"]')).toBeInTheDocument()
    );

    // Confirm the suggested mappings (re-reads the concurrency stamp, PUTs, -> Mapped).
    await user.click(screen.getByRole('button', { name: 'Confirm mappings' }));

    // Step 3 — execute. Once the job is Mapped, the Execute button dispatches the run.
    const executeButton = await screen.findByRole('button', { name: 'Execute import' });
    await user.click(executeButton);

    // Step 4 — report. Polling observes the terminal status and the report renders.
    await waitFor(() =>
      expect(document.querySelector('[data-slot="import-report-summary"]')).toBeInTheDocument()
    );
    expect(screen.getByText('Partially completed')).toBeInTheDocument();

    // Download the correction file — now a real, non-empty file streams to the browser.
    const downloadButton = screen.getByRole('button', { name: /Download correction file/i });
    await user.click(downloadButton);

    await waitFor(() => expect(anchorClick).toHaveBeenCalledOnce());
    expect(createObjectURL).toHaveBeenCalledOnce();
    const downloadedBlob = createObjectURL.mock.calls[0]![0] as Blob;
    expect(downloadedBlob.size).toBeGreaterThan(0);
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:correction');
  });
});
