import { describe, expect, it } from 'vitest';
import { markdownToPmJson, pmJsonToMarkdown } from './chapter-markdown';

const doc = (content: unknown[]) => JSON.stringify({ type: 'doc', content });

describe('pmJsonToMarkdown', () => {
  it('writes headings, paragraphs and marks', () => {
    const json = doc([
      { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Chapter' }] },
      {
        type: 'paragraph',
        attrs: { blockId: 'b1' },
        content: [
          { type: 'text', text: 'A ' },
          { type: 'text', text: 'bold', marks: [{ type: 'bold' }] },
          { type: 'text', text: ' and ' },
          { type: 'text', text: 'linked', marks: [{ type: 'link', attrs: { href: 'https://example.test' } }] },
          { type: 'text', text: '.' },
        ],
      },
    ]);
    expect(pmJsonToMarkdown(json)).toBe(
      '## Chapter\n\nA **bold** and [linked](https://example.test).',
    );
  });

  it('keeps block quotes and rules', () => {
    const json = doc([
      { type: 'blockquote', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Quoted' }] }] },
      { type: 'horizontalRule' },
    ]);
    expect(pmJsonToMarkdown(json)).toBe('> Quoted\n\n---');
  });

  it('reads an empty or malformed document as empty Markdown', () => {
    expect(pmJsonToMarkdown('not json')).toBe('');
    expect(pmJsonToMarkdown(doc([]))).toBe('');
  });
});

describe('markdownToPmJson', () => {
  const parse = (markdown: string) => JSON.parse(markdownToPmJson(markdown));

  it('round-trips the prose surface', () => {
    const markdown = '## Chapter\n\nA **bold** and [linked](https://example.test).';
    const rendered = pmJsonToMarkdown(markdownToPmJson(markdown));
    expect(rendered).toBe(markdown);
  });

  it('gives every block an id so comments can anchor', () => {
    const parsed = parse('First\n\nSecond');
    expect(parsed.content).toHaveLength(2);
    for (const node of parsed.content) {
      expect(typeof node.attrs.blockId).toBe('string');
      expect(node.attrs.blockId.length).toBeGreaterThan(8);
    }
  });

  it('keeps the words of blocks the prose profile cannot carry', () => {
    const parsed = parse('- one\n- two\n\n```js\nconst a = 1;\n```');
    const texts = parsed.content
      .flatMap((node: { content?: { text?: string }[] }) => node.content ?? [])
      .map((node: { text?: string }) => node.text)
      .join(' ');
    expect(texts).toContain('one');
    expect(texts).toContain('two');
    expect(texts).toContain('const a = 1;');
  });

  it('writes an empty paragraph for an empty document', () => {
    expect(parse('')).toMatchObject({
      type: 'doc',
      content: [{ type: 'paragraph' }],
    });
  });
});
