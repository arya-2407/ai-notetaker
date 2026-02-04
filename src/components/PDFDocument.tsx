import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { ReactNode } from 'react';

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff',
  },
  header: {
    marginBottom: 24,
    borderBottom: '2px solid #1a1a1a',
    paddingBottom: 12,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Helvetica-Bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 10,
    color: '#666666',
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    backgroundColor: '#f5f5f5',
    padding: 8,
    marginBottom: 12,
    borderLeft: '3px solid #1a1a1a',
  },
  sectionHeaderCues: {
    backgroundColor: '#fef3c7',
    padding: 8,
    marginBottom: 12,
    borderLeft: '3px solid #d97706',
  },
  sectionHeaderSummary: {
    backgroundColor: '#dbeafe',
    padding: 8,
    marginBottom: 12,
    borderLeft: '3px solid #2563eb',
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#374151',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  content: {
    paddingLeft: 4,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 8,
    color: '#999999',
  },
  // Markdown styles
  paragraph: {
    marginBottom: 6,
    lineHeight: 1.6,
    color: '#1a1a1a',
  },
  h1: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 8,
    marginTop: 12,
    color: '#1a1a1a',
  },
  h2: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 6,
    marginTop: 10,
    color: '#1a1a1a',
  },
  h3: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 4,
    marginTop: 8,
    color: '#1a1a1a',
  },
  bulletItem: {
    flexDirection: 'row',
    marginBottom: 4,
    paddingLeft: 8,
  },
  bullet: {
    width: 12,
    fontSize: 10,
    color: '#666666',
  },
  bulletText: {
    flex: 1,
    lineHeight: 1.6,
    color: '#1a1a1a',
  },
  bold: {
    fontFamily: 'Helvetica-Bold',
  },
  italic: {
    fontFamily: 'Helvetica-Oblique',
  },
});

// Parse inline markdown (bold, italic) within a line
function parseInlineMarkdown(text: string): ReactNode[] {
  const parts: ReactNode[] = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    // Match **bold** or *italic*
    const boldMatch = remaining.match(/^\*\*(.+?)\*\*/);
    const italicMatch = remaining.match(/^\*(.+?)\*/);

    if (boldMatch && (!italicMatch || boldMatch.index! <= italicMatch.index!)) {
      if (boldMatch.index! > 0) {
        parts.push(<Text key={key++}>{remaining.slice(0, boldMatch.index)}</Text>);
      }
      parts.push(<Text key={key++} style={styles.bold}>{boldMatch[1]}</Text>);
      remaining = remaining.slice(boldMatch.index! + boldMatch[0].length);
    } else if (italicMatch) {
      if (italicMatch.index! > 0) {
        parts.push(<Text key={key++}>{remaining.slice(0, italicMatch.index)}</Text>);
      }
      parts.push(<Text key={key++} style={styles.italic}>{italicMatch[1]}</Text>);
      remaining = remaining.slice(italicMatch.index! + italicMatch[0].length);
    } else {
      // No more markdown, add rest as plain text
      parts.push(<Text key={key++}>{remaining}</Text>);
      break;
    }
  }

  return parts;
}

// Render markdown text to PDF components
function MarkdownText({ content }: { content: string }) {
  const lines = content.split('\n');
  const elements: ReactNode[] = [];

  lines.forEach((line, i) => {
    const trimmed = line.trim();

    if (!trimmed) {
      // Empty line
      elements.push(<Text key={i} style={{ marginBottom: 4 }}> </Text>);
    } else if (trimmed.startsWith('### ')) {
      elements.push(
        <Text key={i} style={styles.h3}>
          {parseInlineMarkdown(trimmed.slice(4))}
        </Text>
      );
    } else if (trimmed.startsWith('## ')) {
      elements.push(
        <Text key={i} style={styles.h2}>
          {parseInlineMarkdown(trimmed.slice(3))}
        </Text>
      );
    } else if (trimmed.startsWith('# ')) {
      elements.push(
        <Text key={i} style={styles.h1}>
          {parseInlineMarkdown(trimmed.slice(2))}
        </Text>
      );
    } else if (trimmed.startsWith('- ') || trimmed.startsWith('• ') || trimmed.startsWith('* ')) {
      const bulletContent = trimmed.slice(2);
      elements.push(
        <View key={i} style={styles.bulletItem}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.bulletText}>{parseInlineMarkdown(bulletContent)}</Text>
        </View>
      );
    } else {
      elements.push(
        <Text key={i} style={styles.paragraph}>
          {parseInlineMarkdown(trimmed)}
        </Text>
      );
    }
  });

  return <View>{elements}</View>;
}

interface CornellNotes {
  cues: string;
  notes: string;
  summary: string;
}

interface PDFDocumentProps {
  notes: CornellNotes;
  title?: string;
}

export default function PDFDocumentComponent({ notes, title = 'Lecture Notes' }: PDFDocumentProps) {
  const date = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{date}</Text>
        </View>

        {/* Notes Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Notes</Text>
          </View>
          <View style={styles.content}>
            <MarkdownText content={notes.notes} />
          </View>
        </View>

        {/* Cues & Questions Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderCues}>
            <Text style={styles.sectionTitle}>Cues & Questions</Text>
          </View>
          <View style={styles.content}>
            <MarkdownText content={notes.cues} />
          </View>
        </View>

        {/* Summary Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderSummary}>
            <Text style={styles.sectionTitle}>Summary</Text>
          </View>
          <View style={styles.content}>
            <MarkdownText content={notes.summary} />
          </View>
        </View>

        {/* Footer */}
        {/* <Text style={styles.footer}>Generated with Notetaker</Text> */}
      </Page>
    </Document>
  );
}
