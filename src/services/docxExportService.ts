import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from 'docx';
import { Message, RagChunk } from '../types';

export type DocumentExportKind = 'latest' | 'conversation' | 'study-guide';

export interface DocumentSection {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
}

export interface DocumentTable {
  title?: string;
  columns: string[];
  rows: string[][];
}

export interface DocumentFlowchart {
  title: string;
  nodes: string[];
}

export interface TutorDocument {
  title: string;
  subtitle?: string;
  sections: DocumentSection[];
  tables?: DocumentTable[];
  flowcharts?: DocumentFlowchart[];
  sources?: RagChunk[];
}

const colors = {
  navy: '172554',
  indigo: '4338CA',
  lightIndigo: 'EEF2FF',
  slate: '475569',
  border: 'CBD5E1',
};

function paragraph(text: string, options: { bold?: boolean; color?: string } = {}): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text, bold: options.bold, color: options.color })],
    spacing: { after: 140 },
  });
}

function flowchart(flowchart: DocumentFlowchart): Table {
  const rows: TableRow[] = [];
  flowchart.nodes.forEach((node, index) => {
    rows.push(new TableRow({
      children: [
        new TableCell({
          shading: { fill: colors.lightIndigo, type: ShadingType.CLEAR },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 6, color: colors.indigo },
            bottom: { style: BorderStyle.SINGLE, size: 6, color: colors.indigo },
            left: { style: BorderStyle.SINGLE, size: 6, color: colors.indigo },
            right: { style: BorderStyle.SINGLE, size: 6, color: colors.indigo },
          },
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: `${index + 1}. ${node}`, bold: true, color: colors.navy })],
          })],
        }),
      ],
    }));
    if (index < flowchart.nodes.length - 1) {
      rows.push(new TableRow({
        children: [new TableCell({
          borders: {
            top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
            bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
            left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
            right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
          },
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: '↓', bold: true, color: colors.indigo, size: 24 })],
          })],
        })],
      }));
    }
  });
  return new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows });
}

function documentTable(table: DocumentTable): Table {
  const header = new TableRow({
    tableHeader: true,
    children: table.columns.map((column) => new TableCell({
      shading: { fill: colors.navy, type: ShadingType.CLEAR },
      children: [new Paragraph({
        children: [new TextRun({ text: column, bold: true, color: 'FFFFFF' })],
      })],
    })),
  });
  const rows = table.rows.map((row) => new TableRow({
    children: row.map((cell) => new TableCell({
      children: [paragraph(cell)],
    })),
  }));
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [header, ...rows],
  });
}

export async function downloadTutorDocument(documentData: TutorDocument, filename: string): Promise<void> {
  const children: Array<Paragraph | Table> = [
    new Paragraph({
      heading: HeadingLevel.TITLE,
      children: [new TextRun({ text: documentData.title, bold: true, color: colors.navy, size: 36 })],
    }),
  ];

  if (documentData.subtitle) {
    children.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: documentData.subtitle, italics: true, color: colors.slate })],
      spacing: { after: 300 },
    }));
  }

  documentData.sections.forEach((section) => {
    children.push(new Paragraph({
      heading: HeadingLevel.HEADING_1,
      children: [new TextRun({ text: section.heading, bold: true, color: colors.indigo })],
    }));
    section.paragraphs.forEach((text) => children.push(paragraph(text)));
    section.bullets?.forEach((text) => children.push(new Paragraph({
      text,
      bullet: { level: 0 },
      spacing: { after: 100 },
    })));
  });

  documentData.tables?.forEach((table) => {
    if (table.title) {
      children.push(new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun({ text: table.title, bold: true, color: colors.indigo })],
      }));
    }
    children.push(documentTable(table));
  });

  documentData.flowcharts?.forEach((item) => {
    children.push(new Paragraph({
      heading: HeadingLevel.HEADING_2,
      children: [new TextRun({ text: item.title, bold: true, color: colors.indigo })],
    }));
    children.push(flowchart(item));
  });

  if (documentData.sources?.length) {
    children.push(new Paragraph({
      heading: HeadingLevel.HEADING_1,
      children: [new TextRun({ text: 'Sources', bold: true, color: colors.indigo })],
    }));
    documentData.sources.forEach((source) => children.push(paragraph(
      `Lecture page ${source.slideNumber}: ${source.snippet}`,
    )));
  }

  children.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: 'Generated by My Personal Tutor', color: colors.slate, size: 18 })],
    spacing: { before: 400 },
  }));

  const blob = await Packer.toBlob(new Document({
    sections: [{ properties: {}, children }],
  }));
  const url = URL.createObjectURL(blob);
  const link = window.document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.docx') ? filename : `${filename}.docx`;
  link.click();
  URL.revokeObjectURL(url);
}

export function documentFromMessages(
  title: string,
  messages: Message[],
  sources: RagChunk[] = [],
): TutorDocument {
  const flowcharts = messages.flatMap((message) => message.visuals?.flatMap((visual) => (
    visual.type === 'concept-diagram' && visual.conceptDiagram
      ? [{
          title: visual.conceptDiagram.title,
          nodes: visual.conceptDiagram.nodes.map((node) => `${node.label}: ${node.detail}`),
        }]
      : []
  )) || []);

  return {
    title,
    subtitle: new Date().toLocaleDateString(),
    sections: messages.map((message) => ({
      heading: message.role === 'user' ? 'Question' : 'Tutor response',
      paragraphs: [message.text],
      bullets: message.visuals?.flatMap((visual) => {
        if (visual.type === 'mcq' && visual.mcq) return [visual.mcq.question, ...visual.mcq.options.map((option) => `${option.id}. ${option.text}`)];
        if (visual.type === 'flashcard' && visual.flashcard) return [`${visual.flashcard.front}: ${visual.flashcard.back}`];
        if (visual.type === 'hint-ladder' && visual.hintLadder) return visual.hintLadder.hints.map((hint) => `${hint.label}: ${hint.content}`);
        return [];
      }),
    })),
    flowcharts,
    sources,
  };
}
