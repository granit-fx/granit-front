import { useEffect, useRef, useState } from 'react';

import type { KeyboardEvent, ReactNode } from 'react';

export interface InlineEditProps {
  readonly initialValue: string;
  readonly placeholder?: string;
  readonly ariaLabel: string;
  readonly onCommit: (value: string) => void;
  readonly onCancel: () => void;
  readonly autoSelect?: boolean;
  readonly className?: string;
}

/**
 * Tiny inline-edit input. Commits on Enter or blur, cancels on Escape.
 * Headless: no styling, just a `data-granit-inline-edit` marker for apps to
 * target. Used by FolderTree, DocumentsList and confirm-trash flows in place
 * of `window.prompt`.
 */
export function InlineEdit({
  initialValue,
  placeholder,
  ariaLabel,
  onCommit,
  onCancel,
  autoSelect = true,
  className,
}: InlineEditProps): ReactNode {
  const [value, setValue] = useState(initialValue);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (autoSelect && inputRef.current) {
      inputRef.current.select();
    }
  }, [autoSelect]);

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      event.stopPropagation();
      const trimmed = value.trim();
      if (trimmed.length === 0) {
        onCancel();
        return;
      }
      onCommit(trimmed);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      onCancel();
    } else {
      // Prevent parent keyboard handlers (e.g. list nav) from hijacking typing.
      event.stopPropagation();
    }
  }

  return (
    <input
      ref={inputRef}
      type="text"
      data-granit-inline-edit=""
      autoFocus
      aria-label={ariaLabel}
      placeholder={placeholder}
      className={className}
      value={value}
      onChange={(event) => setValue(event.target.value)}
      onKeyDown={handleKeyDown}
      onBlur={() => {
        const trimmed = value.trim();
        if (trimmed.length === 0 || trimmed === initialValue) {
          onCancel();
          return;
        }
        onCommit(trimmed);
      }}
      onClick={(event) => event.stopPropagation()}
    />
  );
}
