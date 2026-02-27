import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';

interface MarkdownRendererProps {
  /** Markdown content to render */
  content: string;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Renders markdown content with GitHub Flavored Markdown support
 * and syntax highlighting for code blocks.
 *
 * Features:
 * - GFM: tables, strikethrough, task lists, autolinks
 * - Syntax highlighting for code blocks
 * - Styled with Tailwind prose classes
 */
export function MarkdownRenderer({
  content,
  className = '',
}: MarkdownRendererProps) {
  return (
    <div
      className={`prose prose-sm prose-headings:text-content prose-p:text-content
        prose-strong:text-content prose-a:text-accent hover:prose-a:text-accent-hover
        prose-code:rounded prose-code:bg-surface-tertiary
        prose-code:px-1 prose-code:py-0.5 prose-code:text-content prose-code:before:content-none prose-code:after:content-none prose-pre:bg-surface-tertiary prose-pre:text-content
        prose-blockquote:border-border prose-blockquote:text-content-secondary
        prose-hr:border-border prose-table:w-full
        prose-table:border-collapse
        prose-th:border prose-th:border-border
        prose-th:bg-surface-secondary prose-th:px-3 prose-th:py-2 prose-th:text-left prose-th:text-content prose-td:border prose-td:border-border
        prose-td:px-3 prose-td:py-2 prose-td:text-content prose-li:text-content prose-li:marker:text-content-secondary
        max-w-none text-content
        ${className}`}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

export default MarkdownRenderer;
