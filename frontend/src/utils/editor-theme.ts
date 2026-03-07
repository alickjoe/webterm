import { EditorView } from '@codemirror/view';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { tags } from '@lezer/highlight';
import type { Extension } from '@codemirror/state';

const tokyonightColors = {
  bg: '#1a1b26',
  bgSecondary: '#24283b',
  bgTertiary: '#2f3349',
  fg: '#a9b1d6',
  fgBright: '#c0caf5',
  muted: '#565f89',
  accent: '#7aa2f7',
  keyword: '#bb9af7',
  string: '#9ece6a',
  number: '#ff9e64',
  cyan: '#2ac3de',
  red: '#f7768e',
  yellow: '#e0af68',
  border: '#3b4261',
  selection: '#33467c',
  cursor: '#c0caf5',
};

const theme = EditorView.theme(
  {
    '&': {
      color: tokyonightColors.fg,
      backgroundColor: tokyonightColors.bg,
      height: '100%',
    },
    '.cm-content': {
      caretColor: tokyonightColors.cursor,
      fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', Menlo, Monaco, monospace",
      fontSize: '14px',
      lineHeight: '1.6',
    },
    '.cm-cursor, .cm-dropCursor': {
      borderLeftColor: tokyonightColors.cursor,
    },
    '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection': {
      backgroundColor: tokyonightColors.selection,
    },
    '.cm-panels': {
      backgroundColor: tokyonightColors.bgSecondary,
      color: tokyonightColors.fg,
    },
    '.cm-panels.cm-panels-top': {
      borderBottom: `1px solid ${tokyonightColors.border}`,
    },
    '.cm-panels.cm-panels-bottom': {
      borderTop: `1px solid ${tokyonightColors.border}`,
    },
    '.cm-searchMatch': {
      backgroundColor: 'rgba(122, 162, 247, 0.3)',
      outline: `1px solid rgba(122, 162, 247, 0.5)`,
    },
    '.cm-searchMatch.cm-searchMatch-selected': {
      backgroundColor: 'rgba(122, 162, 247, 0.5)',
    },
    '.cm-activeLine': {
      backgroundColor: tokyonightColors.bgTertiary,
    },
    '.cm-selectionMatch': {
      backgroundColor: 'rgba(122, 162, 247, 0.15)',
    },
    '&.cm-focused .cm-matchingBracket, &.cm-focused .cm-nonmatchingBracket': {
      backgroundColor: 'rgba(59, 66, 97, 0.6)',
      outline: `1px solid ${tokyonightColors.border}`,
    },
    '.cm-gutters': {
      backgroundColor: tokyonightColors.bgSecondary,
      color: tokyonightColors.muted,
      borderRight: `1px solid ${tokyonightColors.border}`,
    },
    '.cm-activeLineGutter': {
      backgroundColor: tokyonightColors.bgTertiary,
      color: tokyonightColors.fgBright,
    },
    '.cm-foldPlaceholder': {
      backgroundColor: 'transparent',
      border: 'none',
      color: tokyonightColors.muted,
    },
    '.cm-tooltip': {
      border: `1px solid ${tokyonightColors.border}`,
      backgroundColor: tokyonightColors.bgSecondary,
      color: tokyonightColors.fg,
    },
    '.cm-tooltip .cm-tooltip-arrow:before': {
      borderTopColor: 'transparent',
      borderBottomColor: 'transparent',
    },
    '.cm-tooltip .cm-tooltip-arrow:after': {
      borderTopColor: tokyonightColors.bgSecondary,
      borderBottomColor: tokyonightColors.bgSecondary,
    },
    '.cm-tooltip-autocomplete': {
      '& > ul > li[aria-selected]': {
        backgroundColor: tokyonightColors.bgTertiary,
        color: tokyonightColors.fgBright,
      },
    },
    // Lint diagnostic styles
    '.cm-lintRange-error': {
      backgroundImage: 'none',
      textDecoration: `underline wavy ${tokyonightColors.red}`,
    },
    '.cm-lintRange-warning': {
      backgroundImage: 'none',
      textDecoration: `underline wavy ${tokyonightColors.yellow}`,
    },
    '.cm-diagnostic-error': {
      borderLeft: `3px solid ${tokyonightColors.red}`,
    },
    '.cm-diagnostic-warning': {
      borderLeft: `3px solid ${tokyonightColors.yellow}`,
    },
    // Scrollbar
    '& ::-webkit-scrollbar': {
      width: '8px',
      height: '8px',
    },
    '& ::-webkit-scrollbar-track': {
      background: tokyonightColors.bg,
    },
    '& ::-webkit-scrollbar-thumb': {
      background: tokyonightColors.border,
      borderRadius: '4px',
    },
    '& ::-webkit-scrollbar-thumb:hover': {
      background: tokyonightColors.muted,
    },
  },
  { dark: true }
);

const highlightStyle = HighlightStyle.define([
  { tag: tags.keyword, color: tokyonightColors.keyword },
  { tag: [tags.name, tags.deleted, tags.character, tags.macroName], color: tokyonightColors.fg },
  { tag: [tags.function(tags.variableName)], color: tokyonightColors.accent },
  { tag: [tags.labelName], color: tokyonightColors.fg },
  { tag: [tags.color, tags.constant(tags.name), tags.standard(tags.name)], color: tokyonightColors.number },
  { tag: [tags.definition(tags.name), tags.separator], color: tokyonightColors.fg },
  { tag: [tags.brace], color: tokyonightColors.fg },
  { tag: [tags.annotation], color: tokyonightColors.yellow },
  { tag: [tags.number, tags.changed, tags.annotation, tags.modifier, tags.self, tags.namespace], color: tokyonightColors.number },
  { tag: [tags.typeName, tags.className], color: tokyonightColors.cyan },
  { tag: [tags.operator, tags.operatorKeyword], color: tokyonightColors.cyan },
  { tag: [tags.tagName], color: tokyonightColors.red },
  { tag: [tags.squareBracket], color: tokyonightColors.fg },
  { tag: [tags.angleBracket], color: tokyonightColors.fg },
  { tag: [tags.attributeName], color: tokyonightColors.accent },
  { tag: [tags.regexp], color: tokyonightColors.string },
  { tag: [tags.quote], color: tokyonightColors.string },
  { tag: [tags.string], color: tokyonightColors.string },
  { tag: tags.link, color: tokyonightColors.string, textDecoration: 'underline', textUnderlinePosition: 'under' as any },
  { tag: [tags.url, tags.escape, tags.special(tags.string)], color: tokyonightColors.string },
  { tag: [tags.meta], color: tokyonightColors.muted },
  { tag: [tags.comment], color: tokyonightColors.muted, fontStyle: 'italic' },
  { tag: tags.strong, fontWeight: 'bold', color: tokyonightColors.number },
  { tag: tags.emphasis, fontStyle: 'italic', color: tokyonightColors.keyword },
  { tag: tags.strikethrough, textDecoration: 'line-through' },
  { tag: tags.heading, fontWeight: 'bold', color: tokyonightColors.accent },
  { tag: tags.special(tags.heading1), fontWeight: 'bold', color: tokyonightColors.accent },
  { tag: tags.heading1, fontWeight: 'bold', color: tokyonightColors.accent },
  { tag: [tags.heading2, tags.heading3, tags.heading4], fontWeight: 'bold', color: tokyonightColors.accent },
  { tag: [tags.heading5, tags.heading6], color: tokyonightColors.accent },
  { tag: [tags.atom, tags.bool, tags.special(tags.variableName)], color: tokyonightColors.number },
  { tag: [tags.processingInstruction, tags.inserted], color: tokyonightColors.string },
  { tag: [tags.contentSeparator], color: tokyonightColors.muted },
  { tag: tags.invalid, color: tokyonightColors.red, borderBottom: `1px dotted ${tokyonightColors.red}` },
  { tag: [tags.propertyName], color: tokyonightColors.accent },
]);

export const tokyonightTheme: Extension = [theme, syntaxHighlighting(highlightStyle)];
