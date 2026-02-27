/**
 * MarkdownEditor
 * A textarea with Edit/Preview tabs and markdown formatting toolbar
 */

import { useState, useRef, useEffect } from 'react';
import { MarkdownRenderer } from '@/components/atoms/MarkdownRenderer';

type Tab = 'edit' | 'preview';

interface MarkdownEditorProps {
  /** Current value */
  value: string;
  /** Change handler */
  onChange: (value: string) => void;
  /** Placeholder text for textarea */
  placeholder?: string;
  /** Whether the editor is disabled */
  disabled?: boolean;
  /** Number of rows for textarea */
  rows?: number;
  /** Whether there's a validation error */
  hasError?: boolean;
  /** HTML id attribute for the textarea */
  id?: string;
}

// Toolbar Icons as inline SVGs
const icons = {
  bold: (
    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M15.6 10.79c.97-.67 1.65-1.77 1.65-2.79 0-2.26-1.75-4-4-4H7v14h7.04c2.09 0 3.71-1.7 3.71-3.79 0-1.52-.86-2.82-2.15-3.42zM10 6.5h3c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-3v-3zm3.5 9H10v-3h3.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5z" />
    </svg>
  ),
  italic: (
    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M10 4v3h2.21l-3.42 8H6v3h8v-3h-2.21l3.42-8H18V4z" />
    </svg>
  ),
  heading: (
    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M5 4v3h5.5v12h3V7H19V4z" />
    </svg>
  ),
  link: (
    <svg
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
      />
    </svg>
  ),
  code: (
    <svg
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
      />
    </svg>
  ),
  quote: (
    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M6 17h3l2-4V7H5v6h3zm8 0h3l2-4V7h-6v6h3z" />
    </svg>
  ),
  bulletList: (
    <svg
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 6h16M4 12h16M4 18h16"
      />
      <circle cx="1" cy="6" r="1" fill="currentColor" />
      <circle cx="1" cy="12" r="1" fill="currentColor" />
      <circle cx="1" cy="18" r="1" fill="currentColor" />
    </svg>
  ),
  numberList: (
    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M2 17h2v.5H3v1h1v.5H2v1h3v-4H2v1zm1-9h1V4H2v1h1v3zm-1 3h1.8L2 13.1v.9h3v-1H3.2L5 10.9V10H2v1zm5-6v2h14V5H7zm0 14h14v-2H7v2zm0-6h14v-2H7v2z" />
    </svg>
  ),
  taskList: (
    <svg
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
      />
    </svg>
  ),
  mention: (
    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10h5v-2h-5c-4.34 0-8-3.66-8-8s3.66-8 8-8 8 3.66 8 8v1.43c0 .79-.71 1.57-1.5 1.57s-1.5-.78-1.5-1.57V12c0-2.76-2.24-5-5-5s-5 2.24-5 5 2.24 5 5 5c1.38 0 2.64-.56 3.54-1.47.65.89 1.77 1.47 2.96 1.47 1.97 0 3.5-1.6 3.5-3.57V12c0-5.52-4.48-10-10-10zm0 13c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z" />
    </svg>
  ),
  table: (
    <svg
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 10h18M3 14h18M10 3v18M14 3v18M3 6a3 3 0 013-3h12a3 3 0 013 3v12a3 3 0 01-3 3H6a3 3 0 01-3-3V6z"
      />
    </svg>
  ),
  chevronDown: (
    <svg
      className="h-3 w-3"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 9l-7 7-7-7"
      />
    </svg>
  ),
};

// Toolbar button component
interface ToolbarButtonProps {
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  className?: string;
}

function ToolbarButton({
  onClick,
  disabled,
  children,
  className = '',
}: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex h-7 w-7 items-center justify-center rounded text-content-secondary transition-colors hover:bg-surface-hover hover:text-content disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  );
}

// Separator component
function ToolbarSeparator() {
  return <div className="mx-1 h-5 w-px bg-border" />;
}

/**
 * MarkdownEditor component - textarea with Edit/Preview tabs and formatting toolbar
 * Similar to GitHub's markdown editor pattern
 */
export function MarkdownEditor({
  value,
  onChange,
  placeholder = 'Write your content here...',
  disabled = false,
  rows = 10,
  hasError = false,
  id,
}: MarkdownEditorProps) {
  const [activeTab, setActiveTab] = useState<Tab>('edit');
  const [headingMenuOpen, setHeadingMenuOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const headingMenuRef = useRef<HTMLDivElement>(null);

  // Close heading menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        headingMenuRef.current &&
        !headingMenuRef.current.contains(event.target as Node)
      ) {
        setHeadingMenuOpen(false);
      }
    };

    if (headingMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [headingMenuOpen]);

  // Get current selection from textarea
  const getSelection = () => {
    const textarea = textareaRef.current;
    if (!textarea) return { start: 0, end: 0, text: '' };

    return {
      start: textarea.selectionStart,
      end: textarea.selectionEnd,
      text: value.substring(textarea.selectionStart, textarea.selectionEnd),
    };
  };

  // Set cursor position and optionally select text
  const setCursorPosition = (start: number, end?: number) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // Need to wait for React to update the value
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start, end ?? start);
    }, 0);
  };

  // Wrap selected text with prefix and suffix
  const wrapSelection = (
    prefix: string,
    suffix: string,
    placeholder: string
  ) => {
    const { start, end, text } = getSelection();
    const selectedText = text || placeholder;
    const newText = `${prefix}${selectedText}${suffix}`;

    const newValue = value.substring(0, start) + newText + value.substring(end);
    onChange(newValue);

    // Select the inserted text (excluding prefix/suffix) if using placeholder
    if (!text) {
      setCursorPosition(
        start + prefix.length,
        start + prefix.length + placeholder.length
      );
    } else {
      setCursorPosition(start + newText.length);
    }
  };

  // Insert text at cursor position
  const insertAtCursor = (text: string) => {
    const { start, end } = getSelection();
    const newValue = value.substring(0, start) + text + value.substring(end);
    onChange(newValue);
    setCursorPosition(start + text.length);
  };

  // Prefix lines with given prefix
  const prefixLines = (prefixFn: string | ((index: number) => string)) => {
    const { start, end } = getSelection();

    // Find the start of the first line
    let lineStart = start;
    while (lineStart > 0 && value[lineStart - 1] !== '\n') {
      lineStart--;
    }

    // Find the end of the last line
    let lineEnd = end;
    while (lineEnd < value.length && value[lineEnd] !== '\n') {
      lineEnd++;
    }

    // Get the lines to prefix
    const linesText = value.substring(lineStart, lineEnd);
    const lines = linesText.split('\n');

    // Apply prefix to each line
    const prefixedLines = lines.map((line, index) => {
      const prefix =
        typeof prefixFn === 'function' ? prefixFn(index) : prefixFn;
      return prefix + line;
    });

    const newLinesText = prefixedLines.join('\n');
    const newValue =
      value.substring(0, lineStart) + newLinesText + value.substring(lineEnd);
    onChange(newValue);

    // Position cursor at end of modified text
    setCursorPosition(lineStart + newLinesText.length);
  };

  // Toolbar actions
  const handleBold = () => wrapSelection('**', '**', 'bold text');
  const handleItalic = () => wrapSelection('*', '*', 'italic text');

  const handleHeading = (level: number) => {
    const prefix = '#'.repeat(level) + ' ';
    prefixLines(prefix);
    setHeadingMenuOpen(false);
  };

  const handleLink = () => {
    const { text } = getSelection();
    if (text) {
      wrapSelection('[', '](url)', '');
    } else {
      const { start, end } = getSelection();
      const linkText = '[link text](url)';
      const newValue =
        value.substring(0, start) + linkText + value.substring(end);
      onChange(newValue);
      // Select "link text"
      setCursorPosition(start + 1, start + 10);
    }
  };

  const handleCode = () => {
    const { text } = getSelection();
    // Check if selection spans multiple lines
    if (text && text.includes('\n')) {
      wrapSelection('```\n', '\n```', '');
    } else {
      wrapSelection('`', '`', 'code');
    }
  };

  const handleQuote = () => prefixLines('> ');
  const handleBulletList = () => prefixLines('- ');
  const handleNumberList = () => prefixLines((index) => `${index + 1}. `);
  const handleTaskList = () => prefixLines('- [ ] ');
  const handleMention = () => insertAtCursor('@');

  const handleTable = () => {
    const tableTemplate = `| Column 1 | Column 2 | Column 3 |
| -------- | -------- | -------- |
|          |          |          |`;

    const selection = getSelection();
    // Add newlines if not at start of line
    const needsNewlineBefore =
      selection.start > 0 && value[selection.start - 1] !== '\n';
    const prefix = needsNewlineBefore ? '\n\n' : '';

    const newValue =
      value.substring(0, selection.start) +
      prefix +
      tableTemplate +
      value.substring(selection.end);
    onChange(newValue);
    setCursorPosition(selection.start + prefix.length + tableTemplate.length);
  };

  const borderClasses = hasError
    ? 'border-state-error focus-within:border-state-error focus-within:ring-state-error'
    : 'border-border focus-within:border-accent focus-within:ring-accent';

  return (
    <div>
      {/* Tab bar */}
      <div className="flex gap-1">
        <button
          type="button"
          onClick={() => setActiveTab('edit')}
          disabled={disabled}
          className={`rounded-t-ado border border-b-0 px-4 py-1.5 text-sm font-medium transition-colors ${
            activeTab === 'edit'
              ? 'border-border bg-surface text-content'
              : 'border-transparent bg-transparent text-content-secondary hover:text-content'
          } ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
        >
          Edit
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('preview')}
          disabled={disabled}
          className={`rounded-t-ado border border-b-0 px-4 py-1.5 text-sm font-medium transition-colors ${
            activeTab === 'preview'
              ? 'border-border bg-surface text-content'
              : 'border-transparent bg-transparent text-content-secondary hover:text-content'
          } ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
        >
          Preview
        </button>
      </div>

      {/* Content area */}
      <div
        className={`rounded-ado rounded-tl-none border bg-surface focus-within:ring-1 ${borderClasses}`}
      >
        {activeTab === 'edit' ? (
          <>
            {/* Toolbar */}
            <div className="flex items-center gap-0.5 border-b border-border px-2 py-1.5">
              {/* Text formatting */}
              <ToolbarButton onClick={handleBold} disabled={disabled}>
                {icons.bold}
              </ToolbarButton>
              <ToolbarButton onClick={handleItalic} disabled={disabled}>
                {icons.italic}
              </ToolbarButton>

              {/* Heading dropdown */}
              <div className="relative" ref={headingMenuRef}>
                <button
                  type="button"
                  onClick={() => setHeadingMenuOpen(!headingMenuOpen)}
                  disabled={disabled}
                  className="flex h-7 items-center gap-0.5 rounded px-1.5 text-content-secondary transition-colors hover:bg-surface-hover hover:text-content disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {icons.heading}
                  {icons.chevronDown}
                </button>

                {headingMenuOpen && (
                  <div className="absolute left-0 top-full z-50 mt-1 w-20 rounded-md border border-border bg-surface py-1 shadow-lg">
                    {[1, 2, 3, 4, 5, 6].map((level) => (
                      <button
                        key={level}
                        type="button"
                        onClick={() => handleHeading(level)}
                        className="flex w-full items-center px-3 py-1.5 text-sm text-content transition-colors hover:bg-surface-hover"
                      >
                        H{level}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <ToolbarSeparator />

              {/* Links and code */}
              <ToolbarButton onClick={handleLink} disabled={disabled}>
                {icons.link}
              </ToolbarButton>
              <ToolbarButton onClick={handleCode} disabled={disabled}>
                {icons.code}
              </ToolbarButton>

              <ToolbarSeparator />

              {/* Blocks */}
              <ToolbarButton onClick={handleQuote} disabled={disabled}>
                {icons.quote}
              </ToolbarButton>
              <ToolbarButton onClick={handleBulletList} disabled={disabled}>
                {icons.bulletList}
              </ToolbarButton>
              <ToolbarButton onClick={handleNumberList} disabled={disabled}>
                {icons.numberList}
              </ToolbarButton>
              <ToolbarButton onClick={handleTaskList} disabled={disabled}>
                {icons.taskList}
              </ToolbarButton>

              <ToolbarSeparator />

              {/* Special inserts */}
              <ToolbarButton onClick={handleMention} disabled={disabled}>
                {icons.mention}
              </ToolbarButton>
              <ToolbarButton onClick={handleTable} disabled={disabled}>
                {icons.table}
              </ToolbarButton>
            </div>

            {/* Textarea */}
            <textarea
              ref={textareaRef}
              id={id}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              disabled={disabled}
              placeholder={placeholder}
              rows={rows}
              className="w-full resize-none bg-transparent px-3 py-2 text-content placeholder:text-content-disabled focus:outline-none"
            />
          </>
        ) : (
          <div
            className="overflow-auto px-3 py-2"
            style={{ minHeight: `${rows * 1.5}rem` }}
          >
            {value.trim() ? (
              <MarkdownRenderer content={value} />
            ) : (
              <p className="text-content-disabled">Nothing to preview</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default MarkdownEditor;
