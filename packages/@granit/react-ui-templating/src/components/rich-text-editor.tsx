import { useTranslation } from '@granit/react-localization';
import { Button, Tooltip, TooltipContent, TooltipTrigger } from '@granit/react-ui';
import {
  RichTextEditor as SharedRichTextEditor,
  type RichTextEditorHandle,
} from '@granit/react-ui-rich-text';
import { Code } from 'lucide-react';
import { forwardRef, useImperativeHandle, useRef } from 'react';

import { InsertVariableButton } from './insert-variable-button';

import type { TemplateEditorHandle } from './template-editor';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  readOnly?: boolean;
  templateName?: string;
  onSwitchToCode?: () => void;
}

// Templating edits HTML templates whose first block is usually the document
// title bound to the model — surface that as the empty-state hint.
const PLACEHOLDER = '<h1>{{ model.title }}</h1>';

/**
 * Templating's WYSIWYG — a thin wrapper over the shared
 * {@link @granit/react-ui-rich-text!RichTextEditor}. It owns only the
 * templating-specific toolbar extras (the `{{ variable }}` picker and the
 * switch-to-code toggle); the generic formatting toolbar + HTML round-trip
 * live in the shared editor so every Granit HTML editor stays consistent.
 */
export const RichTextEditor = forwardRef<TemplateEditorHandle, RichTextEditorProps>(
  function RichTextEditor(
    { value, onChange, className, readOnly = false, templateName, onSwitchToCode },
    ref
  ) {
    const { t } = useTranslation();
    const innerRef = useRef<RichTextEditorHandle>(null);

    // Re-expose the shared editor's imperative handle so the variable picker
    // (and external callers via TemplateEditor) can insert at the caret.
    useImperativeHandle(
      ref,
      () => ({ insertAtCursor: (text: string) => innerRef.current?.insertAtCursor(text) }),
      []
    );

    const hasExtras = Boolean(templateName) || Boolean(onSwitchToCode);

    return (
      <SharedRichTextEditor
        ref={innerRef}
        value={value}
        onChange={onChange}
        className={className}
        readOnly={readOnly}
        placeholder={PLACEHOLDER}
        ariaLabel={t('Templates.Editor.Content', { defaultValue: 'Editor content' })}
        toolbarExtras={
          hasExtras ? (
            <>
              {templateName ? (
                <InsertVariableButton
                  templateName={templateName}
                  onInsert={(expr) => innerRef.current?.insertAtCursor(expr)}
                />
              ) : null}
              {onSwitchToCode ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 gap-1.5 px-2 text-xs"
                      onClick={onSwitchToCode}
                      aria-label={t('Templates.Editor.ModeCode', { defaultValue: 'Code' })}
                    >
                      <Code className="h-3.5 w-3.5" />
                      {t('Templates.Editor.ModeCode', { defaultValue: 'Code' })}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-xs">
                    {t('Templates.Editor.ModeCode', { defaultValue: 'Code' })}
                  </TooltipContent>
                </Tooltip>
              ) : null}
            </>
          ) : undefined
        }
      />
    );
  }
);
