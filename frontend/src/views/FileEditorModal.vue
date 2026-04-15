<template>
  <div class="editor-overlay" @keydown.escape="handleClose">
    <div class="editor-container">
      <!-- Header -->
      <div class="editor-header">
        <div class="editor-header-left">
          <template v-if="isNewFile">
            <input
              ref="fileNameInput"
              v-model="editableFileName"
              class="filename-input"
              :placeholder="t('editor.fileNamePlaceholder')"
              @input="onFileNameChange"
              spellcheck="false"
            />
          </template>
          <template v-else>
            <span class="filename">{{ editor.fileName.value }}</span>
          </template>
          <span class="lang-badge">{{ editor.languageLabel.value }}</span>
          <span v-if="editor.isDirty.value" class="dirty-dot" :title="t('editor.unsaved')"></span>
        </div>
        <div class="editor-header-right">
          <span v-if="editor.error.value" class="editor-error-msg">{{ editor.error.value }}</span>
          <button
            v-if="editor.canFormatFile.value"
            class="btn-secondary btn-sm"
            :disabled="editor.saving.value"
            @click="handleFormat"
            :title="t('editor.format') + ' (Ctrl+Shift+F)'"
          >
            {{ t('editor.format') }}
          </button>
          <button
            class="btn-primary btn-sm"
            :disabled="editor.saving.value || editor.loading.value"
            @click="handleSave"
            :title="t('editor.save') + ' (Ctrl+S)'"
          >
            {{ editor.saving.value ? t('editor.saving') : t('editor.save') }}
          </button>
          <button class="btn-secondary btn-sm" @click="handleClose">
            {{ t('editor.close') }}
          </button>
        </div>
      </div>

      <!-- Editor Body -->
      <div class="editor-body">
        <div v-if="editor.loading.value" class="editor-loading">{{ t('editor.loadingFile') }}</div>
        <div ref="editorContainer" class="cm-container"></div>
      </div>

      <!-- Status Bar -->
      <div class="editor-statusbar">
        <span>{{ t('editor.line') }} {{ cursorLine }}, {{ t('editor.col') }} {{ cursorCol }}</span>
        <span>UTF-8</span>
        <span>{{ editor.languageLabel.value }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter, drawSelection, rectangularSelection, crosshairCursor, dropCursor } from '@codemirror/view';
import { EditorState, Compartment } from '@codemirror/state';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { indentOnInput, bracketMatching, foldGutter, foldKeymap } from '@codemirror/language';
import { closeBrackets, closeBracketsKeymap, autocompletion, completionKeymap } from '@codemirror/autocomplete';
import { highlightSelectionMatches, searchKeymap } from '@codemirror/search';
import { lintKeymap } from '@codemirror/lint';
import { tokyonightTheme } from '@/utils/editor-theme';
import { getLanguageExtension, getLintExtension } from '@/utils/editor-languages';
import { useFileEditor } from '@/composables/useFileEditor';
import type { FileEntry } from '@/types';

const { t } = useI18n();

const props = defineProps<{
  sessionId: string;
  file: FileEntry | null;
  currentPath: string;
}>();

const emit = defineEmits<{
  close: [];
  saved: [];
}>();

const editor = useFileEditor();
const editorContainer = ref<HTMLElement | null>(null);
const fileNameInput = ref<HTMLInputElement | null>(null);
let editorView: EditorView | null = null;
const languageCompartment = new Compartment();
const lintCompartment = new Compartment();

const cursorLine = ref(1);
const cursorCol = ref(1);
const editableFileName = ref('untitled.txt');

const isNewFile = computed(() => props.file === null);

function getLanguageExtensions(filename: string) {
  const langExt = getLanguageExtension(filename);
  const lintExt = getLintExtension(filename);
  return {
    lang: langExt || [],
    lint: lintExt || [],
  };
}

function createEditorState(content: string, filename: string): EditorState {
  const langExts = getLanguageExtensions(filename);

  return EditorState.create({
    doc: content,
    extensions: [
      lineNumbers(),
      highlightActiveLineGutter(),
      history(),
      foldGutter(),
      drawSelection(),
      dropCursor(),
      EditorState.allowMultipleSelections.of(true),
      indentOnInput(),
      bracketMatching(),
      closeBrackets(),
      autocompletion(),
      rectangularSelection(),
      crosshairCursor(),
      highlightActiveLine(),
      highlightSelectionMatches(),
      keymap.of([
        ...closeBracketsKeymap,
        ...defaultKeymap,
        ...searchKeymap,
        ...historyKeymap,
        ...foldKeymap,
        ...completionKeymap,
        ...lintKeymap,
        indentWithTab,
        {
          key: 'Mod-s',
          run: () => {
            handleSave();
            return true;
          },
        },
        {
          key: 'Mod-Shift-f',
          run: () => {
            handleFormat();
            return true;
          },
        },
      ]),
      languageCompartment.of(langExts.lang),
      lintCompartment.of(langExts.lint),
      tokyonightTheme,
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          editor.isDirty.value = update.state.doc.toString() !== editor.originalContent.value;
        }
        if (update.selectionSet) {
          const pos = update.state.selection.main.head;
          const line = update.state.doc.lineAt(pos);
          cursorLine.value = line.number;
          cursorCol.value = pos - line.from + 1;
        }
      }),
    ],
  });
}

function initEditor(content: string, filename: string) {
  if (!editorContainer.value) return;

  if (editorView) {
    editorView.destroy();
  }

  const state = createEditorState(content, filename);
  editorView = new EditorView({
    state,
    parent: editorContainer.value,
  });
}

function onFileNameChange() {
  const name = editableFileName.value || 'untitled.txt';
  editor.setFileName(name);

  if (editorView) {
    const langExts = getLanguageExtensions(name);
    editorView.dispatch({
      effects: [
        languageCompartment.reconfigure(langExts.lang),
        lintCompartment.reconfigure(langExts.lint),
      ],
    });
  }
}

async function handleSave() {
  if (!editorView) return;

  if (isNewFile.value) {
    const name = editableFileName.value.trim();
    if (!name) {
      editor.error.value = t('editor.fileNameRequired');
      return;
    }
    editor.setFileName(name);
  }

  const content = editorView.state.doc.toString();
  const success = await editor.saveFile(props.sessionId, content, props.currentPath);
  if (success) {
    emit('saved');
  }
}

async function handleFormat() {
  if (!editorView) return;

  const content = editorView.state.doc.toString();
  const formatted = await editor.formatContent(content);
  if (formatted !== null && formatted !== content) {
    editorView.dispatch({
      changes: {
        from: 0,
        to: editorView.state.doc.length,
        insert: formatted,
      },
    });
  }
}

function handleClose() {
  if (editor.closeEditor()) {
    emit('close');
  }
}

// Prevent browser default save
function onKeyDown(e: KeyboardEvent) {
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault();
  }
}

onMounted(async () => {
  window.addEventListener('keydown', onKeyDown);

  if (props.file) {
    // Edit existing file
    const success = await editor.openFile(props.sessionId, props.file);
    if (success) {
      await nextTick();
      initEditor(editor.originalContent.value, editor.fileName.value);
    }
  } else {
    // Create new file
    editor.createNewFile(props.currentPath);
    editableFileName.value = 'untitled.txt';
    await nextTick();
    initEditor('', editableFileName.value);
    fileNameInput.value?.select();
  }
});

onUnmounted(() => {
  window.removeEventListener('keydown', onKeyDown);
  if (editorView) {
    editorView.destroy();
    editorView = null;
  }
});
</script>

<style scoped>
.editor-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  z-index: 1001;
  display: flex;
  align-items: stretch;
  justify-content: stretch;
  padding: 20px;
}

.editor-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: var(--bg-primary);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
  min-width: 0;
  min-height: 0;
}

.editor-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
  gap: 12px;
}

.editor-header-left {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.editor-header-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.filename {
  font-family: var(--font-mono);
  font-size: 13px;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.filename-input {
  font-family: var(--font-mono);
  font-size: 13px;
  padding: 4px 8px;
  width: 240px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border);
  border-radius: 4px;
  color: var(--text-primary);
  outline: none;
}

.filename-input:focus {
  border-color: var(--accent);
}

.lang-badge {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 4px;
  background: var(--bg-tertiary);
  color: var(--text-muted);
  white-space: nowrap;
}

.dirty-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--warning);
  flex-shrink: 0;
}

.editor-error-msg {
  font-size: 12px;
  color: var(--danger);
  max-width: 300px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.editor-body {
  flex: 1;
  overflow: hidden;
  position: relative;
  min-height: 0;
}

.cm-container {
  height: 100%;
}

.cm-container :deep(.cm-editor) {
  height: 100%;
}

.editor-loading {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-primary);
  color: var(--text-muted);
  z-index: 1;
  font-size: 14px;
}

.editor-statusbar {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 4px 16px;
  background: var(--bg-tertiary);
  border-top: 1px solid var(--border);
  font-size: 12px;
  color: var(--text-muted);
  flex-shrink: 0;
}

.btn-sm {
  padding: 6px 12px;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
}
</style>
