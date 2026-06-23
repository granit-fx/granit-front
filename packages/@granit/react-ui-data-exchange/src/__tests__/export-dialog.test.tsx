import { screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ExportDialog } from '../components/export/export-dialog';

import { renderDataExchange } from './test-utils';

import type {
  ExportDefinitionSummary,
  ExportFieldResponse,
  ExportJobResponse,
  ExportPresetResponse,
} from '@granit/data-exchange';

// Mutable hook state, reset per-test, lets each test drive one branch.
const startExport = vi.fn();
const resetJob = vi.fn();
const savePreset = vi.fn();
const removePreset = vi.fn();

interface ExportJobHookState {
  job: ExportJobResponse | null;
  isCreating: boolean;
  isExporting: boolean;
  error: { message: string } | null;
}

const state: {
  fields: { data: readonly ExportFieldResponse[] | undefined; isLoading: boolean };
  definitions: { data: readonly ExportDefinitionSummary[] | undefined };
  presets: readonly ExportPresetResponse[];
  job: ExportJobHookState;
} = {
  fields: { data: undefined, isLoading: false },
  definitions: { data: undefined },
  presets: [],
  job: { job: null, isCreating: false, isExporting: false, error: null },
};

vi.mock('@granit/react-data-exchange', () => ({
  useExportDefinitions: () => ({ data: state.definitions.data }),
  useExportFields: () => ({ data: state.fields.data, isLoading: state.fields.isLoading }),
  useExportJob: () => ({
    job: state.job.job,
    isCreating: state.job.isCreating,
    isExporting: state.job.isExporting,
    error: state.job.error,
    startExport,
    reset: resetJob,
  }),
  useExportPresets: () => ({
    presets: { data: state.presets },
    save: { mutate: savePreset },
    remove: { mutate: removePreset },
  }),
}));

function makeField(propertyPath: string, order: number, extra: Partial<ExportFieldResponse> = {}) {
  return {
    propertyPath,
    clrTypeName: 'String',
    header: propertyPath,
    format: null,
    order,
    isNavigation: false,
    ...extra,
  } satisfies ExportFieldResponse;
}

const fields: ExportFieldResponse[] = [
  makeField('id', 0),
  makeField('name', 1),
  makeField('owner', 2, { isNavigation: true }),
];

describe('ExportDialog', () => {
  beforeEach(() => {
    state.fields = { data: undefined, isLoading: false };
    state.definitions = { data: undefined };
    state.presets = [];
    state.job = { job: null, isCreating: false, isExporting: false, error: null };
    startExport.mockReset();
    resetJob.mockReset();
    savePreset.mockReset();
    removePreset.mockReset();
  });

  function renderDialog(props: Partial<Parameters<typeof ExportDialog>[0]> = {}) {
    return renderDataExchange(
      <ExportDialog
        definitionName="Admin.UserExport"
        open
        onOpenChange={vi.fn()}
        formats={['csv', 'xlsx']}
        {...props}
      />
    );
  }

  it('should not render content when closed', () => {
    renderDataExchange(
      <ExportDialog definitionName="Admin.UserExport" open={false} onOpenChange={vi.fn()} />
    );
    expect(document.querySelector('[data-slot="export-dialog"]')).not.toBeInTheDocument();
  });

  it('should render a spinner while fields are loading', () => {
    state.fields = { data: undefined, isLoading: true };
    renderDialog();
    expect(document.querySelector('[data-slot="export-fields"]')).not.toBeInTheDocument();
  });

  it('should render fields with a navigation badge and disable export with none selected', () => {
    state.fields = { data: fields, isLoading: false };
    renderDialog();
    expect(screen.getByText('id')).toBeInTheDocument();
    expect(screen.getByText('nav')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Export' })).toBeEnabled();
  });

  it('should toggle a field off and start the export with the remaining fields', async () => {
    state.fields = { data: fields, isLoading: false };
    const { user } = renderDialog();
    // Deselect "id".
    await user.click(screen.getByLabelText('id'));
    await user.click(screen.getByRole('button', { name: 'Export' }));
    expect(startExport).toHaveBeenCalledTimes(1);
    const arg = startExport.mock.calls[0][0];
    expect(arg.selectedFields).toEqual(['name', 'owner']);
    expect(arg.format).toBe('csv');
  });

  it('should toggle all fields off, disabling the export and save-preset buttons', async () => {
    state.fields = { data: fields, isLoading: false };
    const { user } = renderDialog();
    await user.click(screen.getByRole('button', { name: 'Deselect all' }));
    expect(screen.getByRole('button', { name: 'Export' })).toBeDisabled();
    expect(screen.getByRole('button', { name: /Save preset/ })).toBeDisabled();
  });

  it('should move a field down then up', async () => {
    state.fields = { data: fields, isLoading: false };
    const { user } = renderDialog();
    const moveDownButtons = screen.getAllByRole('button', {
      name: 'Move down',
    });
    // First row down is enabled, last row down is disabled.
    expect(moveDownButtons[0]).toBeEnabled();
    expect(moveDownButtons[moveDownButtons.length - 1]).toBeDisabled();
    await user.click(moveDownButtons[0]!);
    const moveUpButtons = screen.getAllByRole('button', {
      name: 'Move up',
    });
    expect(moveUpButtons[0]).toBeDisabled();
    await user.click(moveUpButtons[1]!);
    await user.click(screen.getByRole('button', { name: 'Export' }));
    expect(startExport).toHaveBeenCalled();
  });

  it('should open the save-preset input, save, and reset', async () => {
    state.fields = { data: fields, isLoading: false };
    const { user } = renderDialog();
    await user.click(screen.getByRole('button', { name: /Save preset/ }));
    const input = screen.getByPlaceholderText('Preset name');
    await user.type(input, 'My preset');
    await user.click(screen.getByRole('button', { name: /Common.Save/ }));
    expect(savePreset).toHaveBeenCalledTimes(1);
    expect(savePreset.mock.calls[0][0].presetName).toBe('My preset');
  });

  it('should save a preset via the Enter key', async () => {
    state.fields = { data: fields, isLoading: false };
    const { user } = renderDialog();
    await user.click(screen.getByRole('button', { name: /Save preset/ }));
    const input = screen.getByPlaceholderText('Preset name');
    await user.type(input, 'Quick{Enter}');
    expect(savePreset).toHaveBeenCalledTimes(1);
  });

  it('should cancel the preset editor via the Escape key', async () => {
    state.fields = { data: fields, isLoading: false };
    const { user } = renderDialog();
    await user.click(screen.getByRole('button', { name: /Save preset/ }));
    const input = screen.getByPlaceholderText('Preset name');
    await user.type(input, '{Escape}');
    expect(screen.queryByPlaceholderText('Preset name')).not.toBeInTheDocument();
  });

  it('should load and remove presets', async () => {
    state.fields = { data: fields, isLoading: false };
    state.presets = [
      {
        definitionName: 'Admin.UserExport',
        presetName: 'Minimal',
        selectedFields: ['name'],
        format: 'xlsx',
        includeIdForImport: true,
      },
    ];
    const { user } = renderDialog();
    const presetGroup = document.querySelector('[data-slot="export-presets"]') as HTMLElement;
    await user.click(within(presetGroup).getByRole('button', { name: 'Minimal' }));
    await user.click(
      within(presetGroup).getByRole('button', {
        name: 'Delete preset',
      })
    );
    expect(removePreset).toHaveBeenCalledWith('Minimal');
  });

  it('should show a completed job status with row count', () => {
    state.fields = { data: fields, isLoading: false };
    state.job = {
      job: {
        id: 'j1',
        status: 'Completed',
        rowCount: 42,
        errorMessage: null,
      } as unknown as ExportJobResponse,
      isCreating: false,
      isExporting: false,
      error: null,
    };
    renderDialog();
    expect(document.querySelector('[data-slot="export-status"]')).toBeInTheDocument();
    expect(screen.getByText('(42 rows)')).toBeInTheDocument();
  });

  it('should show a failed job status with the error message', () => {
    state.fields = { data: fields, isLoading: false };
    state.job = {
      job: {
        id: 'j1',
        status: 'Failed',
        rowCount: null,
        errorMessage: 'boom',
      } as unknown as ExportJobResponse,
      isCreating: false,
      isExporting: false,
      error: null,
    };
    renderDialog();
    expect(screen.getByText('boom')).toBeInTheDocument();
  });

  it('should show an in-progress job status and disable export while active', () => {
    state.fields = { data: fields, isLoading: false };
    state.job = {
      job: {
        id: 'j1',
        status: 'Queued',
        rowCount: null,
        errorMessage: null,
      } as unknown as ExportJobResponse,
      isCreating: true,
      isExporting: false,
      error: null,
    };
    renderDialog();
    expect(screen.getByRole('button', { name: 'Export' })).toBeDisabled();
  });

  it('should show a standalone error when there is no job', () => {
    state.fields = { data: fields, isLoading: false };
    state.job = {
      job: null,
      isCreating: false,
      isExporting: false,
      error: { message: 'network down' },
    };
    renderDialog();
    expect(screen.getByText('network down')).toBeInTheDocument();
  });

  it('should reset job state and close the dialog via Close', async () => {
    state.fields = { data: fields, isLoading: false };
    const onOpenChange = vi.fn();
    const { user } = renderDialog({ onOpenChange });
    await user.click(screen.getByRole('button', { name: 'Common.Close' }));
    expect(resetJob).toHaveBeenCalled();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('should derive formats from the definition when no override is given', () => {
    state.fields = { data: fields, isLoading: false };
    state.definitions = {
      data: [
        {
          name: 'Admin.UserExport',
          supportedFormats: ['json'],
        } as unknown as ExportDefinitionSummary,
      ],
    };
    renderDataExchange(
      <ExportDialog definitionName="Admin.UserExport" open onOpenChange={vi.fn()} />
    );
    expect(document.querySelector('[data-slot="export-format"]')).toBeInTheDocument();
  });
});
