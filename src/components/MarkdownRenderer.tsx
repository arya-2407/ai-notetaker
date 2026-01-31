import { ReactNode } from 'react';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export default function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  const lines = content.split('\n');
  const elements: ReactNode[] = [];

  lines.forEach((line, i) => {
    const trimmed = line.trim();

    if (!trimmed) {
      // Empty line - add spacing
      elements.push(<div key={i} className="h-2" />);
    } else if (trimmed.startsWith('### ')) {
      elements.push(
        <h3 key={i} className="text-lg font-semibold mt-4 mb-2 text-zinc-900">
          {trimmed.slice(4)}
        </h3>
      );
    } else if (trimmed.startsWith('## ')) {
      elements.push(
        <h2 key={i} className="text-xl font-semibold mt-4 mb-2 text-zinc-900">
          {trimmed.slice(3)}
        </h2>
      );
    } else if (trimmed.startsWith('# ')) {
      elements.push(
        <h1 key={i} className="text-2xl font-bold mt-4 mb-3 text-zinc-900">
          {trimmed.slice(2)}
        </h1>
      );
    } else if (trimmed.startsWith('- ') || trimmed.startsWith('• ') || trimmed.startsWith('* ')) {
      const bulletContent = trimmed.slice(2);
      elements.push(
        <div key={i} className="flex gap-2 mb-2">
          <span className="text-zinc-600 mt-0.5">•</span>
          <span className="flex-1">{parseInlineFormatting(bulletContent)}</span>
        </div>
      );
    } else {
      elements.push(
        <p key={i} className="mb-3">
          {parseInlineFormatting(trimmed)}
        </p>
      );
    }
  });

  return <div className={className}>{elements}</div>;
}

// Helper to parse **bold** and *italic* formatting
function parseInlineFormatting(text: string): ReactNode[] {
  const parts: ReactNode[] = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    // Match **bold** (greedy)
    const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
    // Match *italic* (greedy)
    const italicMatch = remaining.match(/(?<!\*)\*([^*]+?)\*(?!\*)/);

    if (boldMatch && (!italicMatch || boldMatch.index! <= italicMatch.index!)) {
      // Add text before bold
      if (boldMatch.index! > 0) {
        parts.push(<span key={key++}>{remaining.slice(0, boldMatch.index)}</span>);
      }
      // Add bold text
      parts.push(
        <strong key={key++} className="font-semibold text-zinc-900">
          {boldMatch[1]}
        </strong>
      );
      remaining = remaining.slice(boldMatch.index! + boldMatch[0].length);
    } else if (italicMatch) {
      // Add text before italic
      if (italicMatch.index! > 0) {
        parts.push(<span key={key++}>{remaining.slice(0, italicMatch.index)}</span>);
      }
      // Add italic text
      parts.push(
        <em key={key++} className="italic">
          {italicMatch[1]}
        </em>
      );
      remaining = remaining.slice(italicMatch.index! + italicMatch[0].length);
    } else {
      // No more formatting, add rest as plain text
      parts.push(<span key={key++}>{remaining}</span>);
      break;
    }
  }

  return parts;
}
