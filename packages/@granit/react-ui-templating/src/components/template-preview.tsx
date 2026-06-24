import { useTranslation } from '@granit/react-localization';
import {
  useTemplateBinaryPreview,
  useTemplatePreview,
  useTemplateVariables,
} from '@granit/react-templating';
import {
  Alert,
  AlertDescription,
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@granit/react-ui';
import { Loader2, Wand2 } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';

import { TestDataEditor } from './test-data-editor';
import { TestDataManager } from './test-data-manager';

import type { TemplateVariable } from '@granit/templating';

const DocumentFormat = { Html: 0, Pdf: 1, Excel: 2 } as const;
type DocumentFormatValue = (typeof DocumentFormat)[keyof typeof DocumentFormat];

interface TemplatePreviewProps {
  templateName: string;
  culture?: string;
}

export function TemplatePreview({ templateName, culture }: Readonly<TemplatePreviewProps>) {
  const { t } = useTranslation();
  const htmlPreview = useTemplatePreview();
  const binaryPreview = useTemplateBinaryPreview();
  const { data: variables } = useTemplateVariables(templateName);

  const [testData, setTestData] = useState<string>('{\n  \n}');
  const [format, setFormat] = useState<DocumentFormatValue>(DocumentFormat.Html);

  const sampleData = useMemo(() => {
    if (!variables) return null;
    const allVars = [
      ...(variables.globalVariables ?? []),
      ...(variables.modelVariables ?? []),
      ...(variables.enrichedVariables ?? []),
    ];
    if (allVars.length === 0) return null;

    const data: Record<string, unknown> = {};
    for (const v of allVars) {
      data[v.name] = generateSampleValue(v);
    }
    return JSON.stringify(data, null, 2);
  }, [variables]);

  const handleGenerateSample = useCallback(() => {
    if (sampleData) setTestData(sampleData);
  }, [sampleData]);

  const isPending = htmlPreview.isPending || binaryPreview.isPending;

  const handlePreview = () => {
    let data: Record<string, unknown> = {};
    try {
      const trimmed = testData.trim();
      if (trimmed) {
        data = JSON.parse(trimmed) as Record<string, unknown>;
      }
    } catch {
      return;
    }

    const request = { culture, data };

    if (format === DocumentFormat.Html) {
      htmlPreview.mutate({ name: templateName, request });
    } else {
      binaryPreview.mutate(
        { name: templateName, request },
        {
          onSuccess: (blob) => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${templateName}.${format === DocumentFormat.Pdf ? 'pdf' : 'xlsx'}`;
            a.click();
            URL.revokeObjectURL(url);
          },
        }
      );
    }
  };

  return (
    <div data-slot="template-preview" className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {/* Left panel: test data */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">{t('Templates.Editor.TestData')}</h3>
          <Select
            value={String(format)}
            onValueChange={(v) => setFormat(Number(v) as DocumentFormatValue)}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={String(DocumentFormat.Html)}>HTML</SelectItem>
              <SelectItem value={String(DocumentFormat.Pdf)}>PDF</SelectItem>
              <SelectItem value={String(DocumentFormat.Excel)}>Excel</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <TestDataManager
            templateName={templateName}
            currentData={testData}
            onLoad={setTestData}
          />
          {sampleData && (
            <Button type="button" variant="outline" size="sm" onClick={handleGenerateSample}>
              <Wand2 className="mr-2 h-3 w-3" />
              {t('Templates.Editor.GenerateSample', 'Generate')}
            </Button>
          )}
        </div>

        <TestDataEditor value={testData} onChange={setTestData} />

        <Button onClick={handlePreview} disabled={isPending}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {t('Templates.Actions.Preview')}
        </Button>
      </div>

      {/* Right panel: render */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">{t('Templates.Editor.Preview')}</h3>
          {htmlPreview.data?.renderTimeMs != null && (
            <span className="text-xs text-muted-foreground">
              {t('Templates.Editor.RenderTime')}: {htmlPreview.data.renderTimeMs}ms
            </span>
          )}
        </div>
        <div className="min-h-[400px] rounded-md border bg-white p-4 dark:bg-muted/20">
          <PreviewContent htmlPreview={htmlPreview} t={t} />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Preview content (extracted to avoid nested ternary)
// ---------------------------------------------------------------------------

function PreviewContent({
  htmlPreview,
  t,
}: Readonly<{
  htmlPreview: ReturnType<typeof useTemplatePreview>;
  t: (key: string) => string;
}>) {
  if (htmlPreview.data?.html) {
    return (
      <iframe
        srcDoc={htmlPreview.data.html}
        className="h-full min-h-[400px] w-full border-0"
        sandbox="allow-same-origin"
        title={t('Templates.Editor.Preview')}
      />
    );
  }

  if (htmlPreview.isError) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          {t('Templates.Messages.PreviewError')}
          {htmlPreview.error?.message && (
            <pre className="mt-2 whitespace-pre-wrap text-xs">{htmlPreview.error.message}</pre>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  return <p className="text-sm text-muted-foreground">{t('Templates.Actions.Preview')}</p>;
}

// ---------------------------------------------------------------------------
// Generate sample values for test data based on variable type
// ---------------------------------------------------------------------------

const STRING_SAMPLE_PATTERNS: readonly [string, string][] = [
  ['name', 'Jean Dupont'],
  ['email', 'jean.dupont@example.com'],
  ['url', 'https://example.com'],
  ['link', 'https://example.com'],
  ['phone', '+32 470 12 34 56'],
  ['address', '12 Rue de la Santé, 75013 Paris'],
];

function generateSampleValue(variable: TemplateVariable): unknown {
  const name = variable.name.toLowerCase();

  switch (variable.type) {
    case 'DateTime':
      return '2026-03-08T14:30:00Z';
    case 'Decimal':
    case 'Double':
    case 'Single':
      return generateNumericSample(name, 1234.56, 42.5);
    case 'Int32':
    case 'Int64':
    case 'Int16':
      return generateIntegerSample(name);
    case 'Boolean':
      return true;
    case 'String':
    default:
      return generateStringSample(name, variable.name);
  }
}

function generateNumericSample(name: string, currencyValue: number, defaultValue: number): number {
  if (name.includes('amount') || name.includes('price') || name.includes('total'))
    return currencyValue;
  return defaultValue;
}

function generateIntegerSample(name: string): number {
  if (name.includes('number')) return 10042;
  if (name.includes('count') || name.includes('quantity')) return 3;
  return 1;
}

function generateStringSample(name: string, originalName: string): string {
  const match = STRING_SAMPLE_PATTERNS.find(([key]) => name.includes(key));
  return match ? match[1] : `Sample ${originalName}`;
}
