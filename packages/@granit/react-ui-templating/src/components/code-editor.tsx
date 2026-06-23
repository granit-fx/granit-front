import { html } from '@codemirror/lang-html';
import { EditorState } from '@codemirror/state';
import { oneDark } from '@codemirror/theme-one-dark';
import { cn } from '@granit/utils';
import { EditorView, basicSetup } from 'codemirror';
import { useTheme } from 'next-themes';
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from 'react';

import type { TemplateEditorHandle } from './template-editor';

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  readOnly?: boolean;
}

export const CodeEditor = forwardRef<TemplateEditorHandle, CodeEditorProps>(function CodeEditor(
  { value, onChange, className, readOnly = false },
  ref
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);
  const { theme } = useTheme();

  // Keep onChange ref up to date without recreating the editor
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // Create editor once
  useEffect(() => {
    if (!containerRef.current) return;

    const isDark = theme === 'dark';

    const updateListener = EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        onChangeRef.current(update.state.doc.toString());
      }
    });

    const view = new EditorView({
      doc: value,
      extensions: [
        basicSetup,
        html(),
        updateListener,
        EditorView.editable.of(!readOnly),
        EditorState.readOnly.of(readOnly),
        EditorView.theme({
          '&': { height: '400px', fontSize: '14px' },
          '.cm-scroller': { overflow: 'auto' },
        }),
        ...(isDark ? [oneDark] : []),
      ],
      parent: containerRef.current,
    });

    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, [theme, readOnly]);

  // Sync external value changes (e.g. form reset)
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const currentDoc = view.state.doc.toString();
    if (currentDoc !== value) {
      view.dispatch({
        changes: { from: 0, to: currentDoc.length, insert: value },
      });
    }
  }, [value]);

  const insertAtCursor = useCallback((text: string) => {
    const view = viewRef.current;
    if (!view) return;
    const cursor = view.state.selection.main.head;
    view.dispatch({
      changes: { from: cursor, insert: text },
      selection: { anchor: cursor + text.length },
    });
    view.focus();
  }, []);

  useImperativeHandle(ref, () => ({ insertAtCursor }), [insertAtCursor]);

  return (
    <div
      data-slot="code-editor"
      className={cn(
        'overflow-hidden rounded-md border bg-background [&_.cm-editor]:outline-none [&_.cm-focused]:outline-none',
        className
      )}
      ref={containerRef}
    />
  );
});
