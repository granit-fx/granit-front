import { useTranslation } from '@granit/react-localization';
import {
  Button,
  Separator,
  Spinner,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@granit/react-ui';
import { Eye } from 'lucide-react';
import {
  forwardRef,
  lazy,
  Suspense,
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';

import { InsertVariableButton } from './insert-variable-button';

const CodeEditor = lazy(() => import('./code-editor').then((m) => ({ default: m.CodeEditor })));
const RichTextEditor = lazy(() =>
  import('./rich-text-editor').then((m) => ({ default: m.RichTextEditor }))
);

export type EditorMode = 'wysiwyg' | 'code';

export interface TemplateEditorHandle {
  insertAtCursor: (text: string) => void;
}

interface TemplateEditorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  readOnly?: boolean;
  mimeType?: string;
  templateName?: string;
}

const RICH_TEXT_MIME_TYPES = new Set(['text/html', 'application/pdf']);

export const TemplateEditor = forwardRef<TemplateEditorHandle, TemplateEditorProps>(
  function TemplateEditor(
    { value, onChange, className, readOnly = false, mimeType = 'text/html', templateName },
    ref
  ) {
    const isRichText = RICH_TEXT_MIME_TYPES.has(mimeType);
    const [mode, setMode] = useState<EditorMode>('wysiwyg');
    const editorRef = useRef<TemplateEditorHandle>(null);

    const insertAtCursor = useCallback((text: string) => {
      editorRef.current?.insertAtCursor(text);
    }, []);

    useImperativeHandle(ref, () => ({ insertAtCursor }), [insertAtCursor]);

    // Non-rich-text mime types: code editor with toolbar
    if (!isRichText) {
      return (
        <div data-slot="template-editor" className={className}>
          <div className="rounded-md border bg-background">
            {templateName && (
              <TooltipProvider delayDuration={300}>
                <div className="flex items-center gap-0.5 border-b px-2 py-1">
                  <InsertVariableButton templateName={templateName} onInsert={insertAtCursor} />
                </div>
              </TooltipProvider>
            )}
            <Suspense fallback={<EditorFallback />}>
              <CodeEditor
                ref={editorRef}
                value={value}
                onChange={onChange}
                readOnly={readOnly}
                className="border-0"
              />
            </Suspense>
          </div>
        </div>
      );
    }

    return (
      <div data-slot="template-editor" className={className}>
        <Suspense fallback={<EditorFallback />}>
          {mode === 'wysiwyg' ? (
            <RichTextEditor
              ref={editorRef}
              value={value}
              onChange={onChange}
              readOnly={readOnly}
              templateName={templateName}
              onSwitchToCode={() => setMode('code')}
            />
          ) : (
            <CodeEditorWithToolbar
              ref={editorRef}
              value={value}
              onChange={onChange}
              readOnly={readOnly}
              templateName={templateName}
              onSwitchToWysiwyg={() => setMode('wysiwyg')}
            />
          )}
        </Suspense>
      </div>
    );
  }
);

// ---------------------------------------------------------------------------
// Code editor with toolbar (WYSIWYG button + variable insert)
// ---------------------------------------------------------------------------

interface CodeEditorWithToolbarProps {
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
  templateName?: string;
  onSwitchToWysiwyg: () => void;
}

const CodeEditorWithToolbar = forwardRef<TemplateEditorHandle, CodeEditorWithToolbarProps>(
  function CodeEditorWithToolbar(
    { value, onChange, readOnly = false, templateName, onSwitchToWysiwyg },
    ref
  ) {
    const { t } = useTranslation();
    const editorRef = useRef<TemplateEditorHandle>(null);

    const insertAtCursor = useCallback((text: string) => {
      editorRef.current?.insertAtCursor(text);
    }, []);

    useImperativeHandle(ref, () => ({ insertAtCursor }), [insertAtCursor]);

    return (
      <div data-slot="code-editor-with-toolbar" className="rounded-md border bg-background">
        <TooltipProvider delayDuration={300}>
          <div
            data-slot="editor-mode-toggle"
            className="flex items-center gap-0.5 border-b px-2 py-1"
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1.5 px-2 text-xs"
                  onClick={onSwitchToWysiwyg}
                  aria-label={t('Templates.Editor.ModeWysiwyg', 'WYSIWYG')}
                >
                  <Eye className="h-3.5 w-3.5" />
                  WYSIWYG
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                {t('Templates.Editor.ModeWysiwyg', 'WYSIWYG')}
              </TooltipContent>
            </Tooltip>
            {templateName && (
              <>
                <Separator orientation="vertical" className="mx-1 h-5" />
                <InsertVariableButton templateName={templateName} onInsert={insertAtCursor} />
              </>
            )}
          </div>
        </TooltipProvider>
        <Suspense fallback={<EditorFallback />}>
          <CodeEditor
            ref={editorRef}
            value={value}
            onChange={onChange}
            readOnly={readOnly}
            className="border-0"
          />
        </Suspense>
      </div>
    );
  }
);

function EditorFallback() {
  return (
    <div className="flex h-48 items-center justify-center">
      <Spinner />
    </div>
  );
}
