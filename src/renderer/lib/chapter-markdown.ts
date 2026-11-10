/**
 * The chapter prose bridge: TipTap JSON (the app's stored chapter form) and
 * the Markdown the Textus editor reads and writes.
 *
 * The prose profile is deliberately restrained (docs: editor-schema-profile):
 * paragraphs, headings 1–3, block quotes, horizontal rules, hard breaks and
 * the bold / italic / strike / underline / link / inline-code marks. The
 * Markdown side therefore carries exactly that surface; anything else a
 * Markdown file can express (lists, code blocks, tables) is flattened to its
 * text rather than dropped, so no words are lost when a chapter is opened.
 */
import type { JSONContent } from '@tiptap/core';
import { marked, type Token, type Tokens } from 'marked';
import { uuidv7 } from 'uuidv7';

const HEADING_LEVELS = [1, 2, 3] as const;

/* ------------------------------------------------------------------ */
/* TipTap JSON -> Markdown                                             */
/* ------------------------------------------------------------------ */

function escapeMarkdown(text: string): string {
  return text
    .replace(/([\\`*_[\]<>])/g, '\\$1')
    .replace(/^(\s*)([#>+-]|\d+\.)(\s)/gm, '$1\\$2$3');
}

function inlineText(nodes: readonly JSONContent[] | undefined): string {
  if (!nodes?.length) return '';
  return nodes
    .map((node) => {
      if (node.type === 'hardBreak') return '  \n';
      if (node.type !== 'text') return '';
      const text = escapeMarkdown(node.text ?? '');
      if (!text) return '';
      const marks = node.marks ?? [];
      const has = (type: string) => marks.some((mark) => mark.type === type);
      const link = marks.find((mark) => mark.type === 'link');
      let out = text;
      if (has('code')) out = `\`${text.replace(/`/g, '\\`')}\``;
      if (link?.attrs?.['href']) out = `[${out}](${String(link.attrs['href'])})`;
      if (has('strike')) out = `~~${out}~~`;
      if (has('italic')) out = `*${out}*`;
      if (has('bold')) out = `**${out}**`;
      if (has('underline')) out = `<u>${out}</u>`;
      return out;
    })
    .join('');
}

function plainText(nodes: readonly JSONContent[] | undefined): string {
  if (!nodes?.length) return '';
  return nodes
    .map((node) => {
      if (node.type === 'hardBreak') return '\n';
      if (node.type === 'text') return node.text ?? '';
      return plainText(node.content);
    })
    .join('');
}

function blockToMarkdown(node: JSONContent): string {
  switch (node.type) {
    case 'heading': {
      const level = Number(node.attrs?.['level'] ?? 1);
      const hashes = '#'.repeat(HEADING_LEVELS.includes(level as 1 | 2 | 3) ? level : 1);
      return `${hashes} ${inlineText(node.content)}`.trimEnd();
    }
    case 'paragraph':
      return inlineText(node.content);
    case 'blockquote':
      return (node.content ?? [])
        .map(blockToMarkdown)
        .join('\n\n')
        .split('\n')
        .map((line) => (line.length ? `> ${line}` : '>'))
        .join('\n');
    case 'horizontalRule':
      return '---';
    case 'bulletList':
    case 'orderedList': {
      const ordered = node.type === 'orderedList';
      return (node.content ?? [])
        .map((item, index) => {
          const body = (item.content ?? []).map(blockToMarkdown).join('\n\n');
          const marker = ordered ? `${index + 1}.` : '-';
          return body
            .split('\n')
            .map((line, lineIndex) => (lineIndex === 0 ? `${marker} ${line}` : `  ${line}`))
            .join('\n');
        })
        .join('\n');
    }
    case 'codeBlock': {
      const language = String(node.attrs?.['language'] ?? '');
      return `\`\`\`${language}\n${plainText(node.content)}\n\`\`\``;
    }
    default:
      // Anything the prose profile does not carry keeps its words.
      return inlineText(node.content) || plainText(node.content);
  }
}

/** The chapter's stored JSON as the Markdown the editor opens. */
export function pmJsonToMarkdown(json: string | JSONContent): string {
  let doc: JSONContent;
  try {
    doc = typeof json === 'string' ? (JSON.parse(json) as JSONContent) : json;
  } catch {
    return '';
  }
  if (doc?.type !== 'doc') return '';
  return (doc.content ?? [])
    .map(blockToMarkdown)
    .filter((block) => block.trim().length > 0)
    .join('\n\n')
    .trim();
}

/* ------------------------------------------------------------------ */
/* Markdown -> TipTap JSON                                             */
/* ------------------------------------------------------------------ */

function blockId(): string {
  return uuidv7();
}

interface Mark {
  type: string;
  attrs?: Record<string, unknown>;
}

function inlineFromTokens(tokens: readonly Token[] | undefined, marks: readonly Mark[] = []): JSONContent[] {
  if (!tokens?.length) return [];
  const out: JSONContent[] = [];
  for (const token of tokens) {
    switch (token.type) {
      case 'text': {
        const text = (token as Tokens.Text).text;
        // A text token may itself hold inline children (some marked builds).
        const children = (token as Tokens.Text).tokens;
        if (children?.length) out.push(...inlineFromTokens(children, marks));
        else if (text) out.push(textNode(text, marks));
        break;
      }
      case 'escape':
        out.push(textNode((token as Tokens.Escape).text, marks));
        break;
      case 'strong':
        out.push(...inlineFromTokens((token as Tokens.Strong).tokens, [...marks, { type: 'bold' }]));
        break;
      case 'em':
        out.push(...inlineFromTokens((token as Tokens.Em).tokens, [...marks, { type: 'italic' }]));
        break;
      case 'del':
        out.push(...inlineFromTokens((token as Tokens.Del).tokens, [...marks, { type: 'strike' }]));
        break;
      case 'codespan':
        out.push(textNode((token as Tokens.Codespan).text, [...marks, { type: 'code' }]));
        break;
      case 'link': {
        const link = token as Tokens.Link;
        out.push(...inlineFromTokens(link.tokens, [
          ...marks,
          { type: 'link', attrs: { href: link.href, target: null, rel: null, class: null } },
        ]));
        break;
      }
      case 'br':
        out.push({ type: 'hardBreak' });
        break;
      case 'html': {
        const raw = (token as Tokens.HTML).text;
        if (/^<u>/i.test(raw) || /<\/u>$/i.test(raw)) {
          out.push(...inlineFromTokens([{ type: 'text', raw: raw.replace(/<\/?u>/gi, '') } as Tokens.Text], [...marks, { type: 'underline' }]));
        } else {
          const text = raw.replace(/<[^>]*>/g, '');
          if (text) out.push(textNode(text, marks));
        }
        break;
      }
      case 'image': {
        const image = token as Tokens.Image;
        if (image.text) out.push(textNode(image.text, marks));
        break;
      }
      default: {
        const text = (token as { text?: string }).text;
        if (text) out.push(textNode(text, marks));
      }
    }
  }
  return mergeAdjacent(out);
}

function textNode(text: string, marks: readonly Mark[]): JSONContent {
  return marks.length
    ? { type: 'text', text, marks: marks.map((mark) => ({ ...mark })) }
    : { type: 'text', text };
}

/** Adjacent nodes with identical marks become one text node. */
function mergeAdjacent(nodes: JSONContent[]): JSONContent[] {
  const out: JSONContent[] = [];
  for (const node of nodes) {
    const previous = out[out.length - 1];
    if (
      previous?.type === 'text'
      && node.type === 'text'
      && JSON.stringify(previous.marks ?? []) === JSON.stringify(node.marks ?? [])
    ) {
      previous.text = `${previous.text ?? ''}${node.text ?? ''}`;
      continue;
    }
    out.push(node);
  }
  return out;
}

function paragraph(content: JSONContent[]): JSONContent {
  return { type: 'paragraph', attrs: { blockId: blockId() }, content };
}

function heading(level: number, content: JSONContent[]): JSONContent {
  const safe = HEADING_LEVELS.includes(level as 1 | 2 | 3) ? level : 1;
  return { type: 'heading', attrs: { level: safe, blockId: blockId() }, content };
}

function blockFromToken(token: Token): JSONContent[] {
  switch (token.type) {
    case 'heading': {
      const headingToken = token as Tokens.Heading;
      return [heading(headingToken.depth, inlineFromTokens(headingToken.tokens))];
    }
    case 'paragraph': {
      const paragraphToken = token as Tokens.Paragraph;
      return [paragraph(inlineFromTokens(paragraphToken.tokens))];
    }
    case 'blockquote': {
      const quoteToken = token as Tokens.Blockquote;
      const inner = quoteToken.tokens.flatMap(blockFromToken);
      return [{ type: 'blockquote', content: inner.length ? inner : [paragraph([])] }];
    }
    case 'hr':
      return [{ type: 'horizontalRule' }];
    case 'list': {
      const listToken = token as Tokens.List;
      // The prose profile has no lists; each item's blocks keep their place.
      return listToken.items.flatMap((item) => item.tokens.flatMap(blockFromToken));
    }
    case 'code': {
      const codeToken = token as Tokens.Code;
      return codeToken.text
        .split(/\n{2,}/)
        .filter((chunk) => chunk.trim().length > 0)
        .map((chunk) => paragraph([{ type: 'text', text: chunk }]));
    }
    case 'table': {
      const tableToken = token as Tokens.Table;
      const rows = [tableToken.header, ...tableToken.rows]
        .map((row) => row.map((cell) => cell.text).join(' | '))
        .filter((row) => row.trim().length > 0);
      return rows.map((row) => paragraph([{ type: 'text', text: row }]));
    }
    case 'html': {
      const text = (token as Tokens.HTML).text.replace(/<[^>]*>/g, '').trim();
      return text ? [paragraph([{ type: 'text', text }])] : [];
    }
    case 'space':
      return [];
    default: {
      const text = ((token as { text?: string }).text ?? '').trim();
      return text ? [paragraph([{ type: 'text', text }])] : [];
    }
  }
}

/** Markdown from the editor as the chapter JSON the app stores. */
export function markdownToPmJson(markdown: string): string {
  const normalized = markdown.replace(/\r\n?/g, '\n');
  if (!normalized.trim()) {
    return JSON.stringify({ type: 'doc', content: [paragraph([])] });
  }
  const tokens = marked.lexer(normalized, { gfm: true, breaks: false });
  const content = tokens.flatMap(blockFromToken);
  return JSON.stringify({
    type: 'doc',
    content: content.length ? content : [paragraph([])],
  });
}
