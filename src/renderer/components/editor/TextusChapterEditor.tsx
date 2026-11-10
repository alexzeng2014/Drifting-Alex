/**
 * A chapter's prose surface, edited with the Textus Markdown editor
 * (Milkdown/ProseMirror) instead of Drifting's TipTap surface.
 *
 * Drifting stays the owner of the document: the chapter arrives as stored
 * TipTap JSON, is converted to Markdown for the editor, and every edit comes
 * back through `materializeCanonicalNodeProse` so content, outline and word
 * count are the same canonical projection the rest of the app reads.
 */
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import { Editor, editorViewCtx } from '@milkdown/kit/core';
import { listenerCtx } from '@milkdown/kit/plugin/listener';
import { replaceAll } from '@milkdown/kit/utils';
import { Milkdown, MilkdownProvider, useEditor, useInstance } from '@milkdown/react';
import '@milkdown/kit/prose/view/style/prosemirror.css';

import { configureEditorRoot, withEditorCore } from '../../textus/editor/editor-extensions';
import { createImageNoticePlugin } from '../../textus/editor/image-notice-plugin';
import { resolveStrings } from '../../textus/i18n/strings';
import { detectLang } from '../../textus/i18n/langs';
import { editorSettings, type Settings } from '../../textus/prefs/SettingsContext';
import '../../textus/theme/content-base.css';
import '../../textus/editor/milkdown-theme.css';
import './textus-chapter.css';

import { markdownToPmJson, pmJsonToMarkdown } from '../../lib/chapter-markdown';
import { materializeCanonicalNodeProse } from '../../services/node-prose-metrics.service';
import type { OutlineItem } from '../../lib/outline';
import { useAutosizeTextArea } from '../../hooks/useAutosizeTextArea';
import loglevel from 'loglevel';

const log = loglevel.getLogger('TextusChapterEditor');
log.setLevel(loglevel.levels.WARN);

interface TextusChapterEditorProps {
  nodeId: string;
  /** Stored chapter content: TipTap JSON, or null for an empty chapter. */
  content: string | null;
  projectId: string;
  title?: string;
  untitledTitle?: string;
  summary?: string;
  showTitle?: boolean;
  showSummary?: boolean;
  editableTitle?: boolean;
  editableSummary?: boolean;
  onContentUpdate: (
    nodeId: string,
    pmJson: string,
    outlineJson: string,
    wordCount: number,
  ) => void;
  onTitleUpdate?: (nodeId: string, title: string) => void;
  onSummaryUpdate?: (nodeId: string, summary: string) => void;
  onOutlineChange?: (outline: OutlineItem[]) => void;
  readOnly?: boolean;
  autoFocus?: boolean;
  minHeight?: string;
}

/** How long typing settles before the chapter is persisted. */
const PERSIST_DELAY_MS = 400;

function MarkdownSurface({
  nodeId,
  initialMarkdown,
  externalMarkdown,
  settings,
  readOnly,
  autoFocus,
  onMarkdown,
}: {
  nodeId: string;
  initialMarkdown: string;
  /** A version of the chapter written outside this editor (the Agent). */
  externalMarkdown: string | null;
  settings: Settings;
  readOnly: boolean;
  autoFocus: boolean;
  onMarkdown: (markdown: string) => void;
}) {
  const settingsRef = useRef(settings);
  settingsRef.current = settings;
  const onMarkdownRef = useRef(onMarkdown);
  onMarkdownRef.current = onMarkdown;

  // Replace the document when the Agent (or a sync) wrote a newer one. Only a
  // version this surface did not write reaches `externalMarkdown`.
  const [loading, getInstance] = useInstance();
  useEffect(() => {
    if (loading || externalMarkdown === null) return;
    getInstance().action(replaceAll(externalMarkdown));
  }, [externalMarkdown, loading, getInstance]);

  useEditor(
    (root) =>
      withEditorCore(
        Editor.make().config((ctx) => {
          configureEditorRoot(
            ctx,
            root,
            initialMarkdown,
            () => resolveStrings(settingsRef.current.language).editorLabel,
          );
          ctx
            .get(listenerCtx)
            .mounted((mounted) => {
              const view = mounted.get(editorViewCtx);
              if (readOnly) view.setProps({ editable: () => false });
              else if (autoFocus) view.focus();
            })
            .markdownUpdated((_ctx, markdown, previous) => {
              if (markdown === previous) return;
              onMarkdownRef.current(markdown);
            });
        }),
        {
          settings: settingsRef,
          docPath: { current: null },
          // A chapter lives in Drifting's database, not a folder: a pasted
          // image has nowhere to go and gets the notice instead.
          noDiskImages: createImageNoticePlugin(() => {}),
        },
      ),
    [nodeId],
  );

  return <Milkdown />;
}

export function TextusChapterEditor({
  nodeId,
  content,
  projectId,
  title = '',
  untitledTitle,
  summary = '',
  showTitle = false,
  showSummary = false,
  editableTitle = false,
  editableSummary = false,
  onContentUpdate,
  onTitleUpdate,
  onSummaryUpdate,
  onOutlineChange,
  readOnly = false,
  autoFocus = false,
  minHeight = '400px',
}: TextusChapterEditorProps) {
  const { t, i18n } = useTranslation();
  const language = detectLang(i18n.language || 'en');

  const settings = useMemo<Settings>(
    () =>
      editorSettings({
        language,
        enableMath: true,
        enableMermaid: true,
        typewriterMode: false,
        enableCompletion: false,
        enableGrammarCheck: false,
      }),
    [language],
  );

  // Read once per chapter: the editor owns the document from then on.
  const initialMarkdown = useMemo(
    () => (content ? pmJsonToMarkdown(content) : ''),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [nodeId],
  );

  const [titleValue, setTitleValue] = useState(title);
  const [summaryValue, setSummaryValue] = useState(summary);
  useEffect(() => setTitleValue(title), [title]);
  useEffect(() => setSummaryValue(summary), [summary]);

  const titleRef = useAutosizeTextArea(titleValue);
  const summaryRef = useAutosizeTextArea(summaryValue);

  const saveTitle = () => {
    const next = titleValue.trim();
    if (!next) {
      setTitleValue(title);
      return;
    }
    if (onTitleUpdate && next !== title) onTitleUpdate(nodeId, next);
  };

  const saveSummary = () => {
    const next = summaryValue.trim();
    if (onSummaryUpdate && next !== summary) onSummaryUpdate(nodeId, next);
  };

  const pending = useRef<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** The stored JSON this editor last wrote, so its own echo is not reloaded. */
  const ownWrite = useRef<string | null>(content);
  const [externalMarkdown, setExternalMarkdown] = useState<string | null>(null);

  const persist = useCallback(
    (markdown: string) => {
      const pmJson = markdownToPmJson(markdown);
      ownWrite.current = pmJson;
      void materializeCanonicalNodeProse(projectId, nodeId, pmJson)
        .then((projection) => {
          ownWrite.current = projection.contentJson;
          onContentUpdate(
            nodeId,
            projection.contentJson,
            projection.outlineJson,
            projection.wordCount,
          );
          onOutlineChange?.(JSON.parse(projection.outlineJson) as OutlineItem[]);
        })
        .catch((error) => {
          log.error('[TextusChapterEditor] Could not materialize the chapter:', error);
        });
    },
    [nodeId, projectId, onContentUpdate, onOutlineChange],
  );

  // The Agent writes the chapter through Yjs; show its result here too.
  useEffect(() => {
    if (content === null || content === ownWrite.current) return;
    ownWrite.current = content;
    setExternalMarkdown(pmJsonToMarkdown(content));
  }, [content]);

  const schedule = useCallback(
    (markdown: string) => {
      pending.current = markdown;
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        timer.current = null;
        const next = pending.current;
        pending.current = null;
        if (next !== null) persist(next);
      }, PERSIST_DELAY_MS);
    },
    [persist],
  );

  // A chapter left mid-keystroke still lands in the store.
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
      const next = pending.current;
      pending.current = null;
      if (next !== null) persist(next);
    },
    [persist],
  );

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      {(showTitle || showSummary) && (
        <div style={{ marginBottom: 0 }}>
          {showTitle && (
            <div>
              {editableTitle ? (
                <textarea
                  ref={titleRef}
                  rows={1}
                  value={titleValue}
                  placeholder={untitledTitle ?? t('chapterEditor.untitledChapter')}
                  onChange={(event) =>
                    setTitleValue(event.target.value.replace(/[\r\n]/g, ''))
                  }
                  onBlur={saveTitle}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      event.currentTarget.blur();
                    } else if (event.key === 'Escape') {
                      setTitleValue(title);
                      event.currentTarget.blur();
                    }
                  }}
                  onFocus={(event) => event.target.select()}
                  className="page__title"
                />
              ) : (
                <h1 className="page__title" style={{ margin: '0 0 10px' }}>
                  {titleValue || untitledTitle || t('chapterEditor.untitledChapter')}
                </h1>
              )}
            </div>
          )}
          {showSummary && (
            <div data-agent-summary>
              {editableSummary ? (
                <textarea
                  ref={summaryRef}
                  value={summaryValue}
                  placeholder={t('chapterEditor.synopsisPlaceholder')}
                  onChange={(event) => setSummaryValue(event.target.value)}
                  onBlur={saveSummary}
                  onKeyDown={(event) => {
                    if (event.key === 'Escape') {
                      setSummaryValue(summary);
                      event.currentTarget.blur();
                    }
                  }}
                  rows={1}
                  className="page__sub"
                />
              ) : (
                summaryValue && <p className="page__sub">{summaryValue}</p>
              )}
            </div>
          )}
        </div>
      )}

      <div
        className="textus-chapter-editor"
        data-node-id={nodeId}
        style={{ minHeight }}
      >
        <MilkdownProvider>
          <MarkdownSurface
            nodeId={nodeId}
            initialMarkdown={initialMarkdown}
            externalMarkdown={externalMarkdown}
            settings={settings}
            readOnly={readOnly}
            autoFocus={autoFocus}
            onMarkdown={schedule}
          />
        </MilkdownProvider>
      </div>
    </div>
  );
}
