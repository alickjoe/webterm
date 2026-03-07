import type { Extension } from '@codemirror/state';
import { json, jsonParseLinter } from '@codemirror/lang-json';
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { xml } from '@codemirror/lang-xml';
import { sql } from '@codemirror/lang-sql';
import { yaml } from '@codemirror/lang-yaml';
import { markdown } from '@codemirror/lang-markdown';
import { StreamLanguage } from '@codemirror/language';
import { linter } from '@codemirror/lint';

// Legacy mode imports
import { toml } from '@codemirror/legacy-modes/mode/toml';
import { properties } from '@codemirror/legacy-modes/mode/properties';
import { dockerFile } from '@codemirror/legacy-modes/mode/dockerfile';
import { shell } from '@codemirror/legacy-modes/mode/shell';
import { go } from '@codemirror/legacy-modes/mode/go';
import { nginx } from '@codemirror/legacy-modes/mode/nginx';

interface LanguageConfig {
  extension: () => Extension;
  label: string;
  prettierParser?: string;
  lintSource?: () => Extension;
}

function buildLanguageMap(): Map<string, LanguageConfig> {
  const map = new Map<string, LanguageConfig>();

  // JSON
  const jsonConfig: LanguageConfig = {
    extension: () => json(),
    label: 'JSON',
    prettierParser: 'json',
    lintSource: () => linter(jsonParseLinter()),
  };
  map.set('.json', jsonConfig);
  map.set('.jsonc', jsonConfig);

  // YAML
  const yamlConfig: LanguageConfig = {
    extension: () => yaml(),
    label: 'YAML',
    prettierParser: 'yaml',
  };
  map.set('.yaml', yamlConfig);
  map.set('.yml', yamlConfig);

  // TOML
  const tomlConfig: LanguageConfig = {
    extension: () => StreamLanguage.define(toml),
    label: 'TOML',
  };
  map.set('.toml', tomlConfig);

  // XML
  const xmlConfig: LanguageConfig = {
    extension: () => xml(),
    label: 'XML',
    prettierParser: 'html',
  };
  map.set('.xml', xmlConfig);
  map.set('.svg', xmlConfig);

  // INI / Properties
  const iniConfig: LanguageConfig = {
    extension: () => StreamLanguage.define(properties),
    label: 'INI',
  };
  map.set('.ini', iniConfig);
  map.set('.conf', iniConfig);
  map.set('.cfg', iniConfig);
  map.set('.env', { ...iniConfig, label: 'ENV' });
  map.set('.properties', iniConfig);

  // Nginx
  const nginxConfig: LanguageConfig = {
    extension: () => StreamLanguage.define(nginx),
    label: 'Nginx',
  };
  // Handled via filename matching below

  // Dockerfile
  const dockerConfig: LanguageConfig = {
    extension: () => StreamLanguage.define(dockerFile),
    label: 'Dockerfile',
  };
  // Handled via filename matching below

  // Shell
  const shellConfig: LanguageConfig = {
    extension: () => StreamLanguage.define(shell),
    label: 'Shell',
  };
  map.set('.sh', shellConfig);
  map.set('.bash', shellConfig);
  map.set('.zsh', shellConfig);

  // JavaScript
  const jsConfig: LanguageConfig = {
    extension: () => javascript(),
    label: 'JavaScript',
    prettierParser: 'babel',
  };
  map.set('.js', jsConfig);
  map.set('.mjs', jsConfig);
  map.set('.cjs', jsConfig);
  map.set('.jsx', { ...jsConfig, extension: () => javascript({ jsx: true }), label: 'JSX' });

  // TypeScript
  const tsConfig: LanguageConfig = {
    extension: () => javascript({ typescript: true }),
    label: 'TypeScript',
    prettierParser: 'typescript',
  };
  map.set('.ts', tsConfig);
  map.set('.mts', tsConfig);
  map.set('.tsx', {
    ...tsConfig,
    extension: () => javascript({ typescript: true, jsx: true }),
    label: 'TSX',
    prettierParser: 'typescript',
  });

  // Python
  const pyConfig: LanguageConfig = {
    extension: () => python(),
    label: 'Python',
  };
  map.set('.py', pyConfig);

  // Go
  const goConfig: LanguageConfig = {
    extension: () => StreamLanguage.define(go),
    label: 'Go',
  };
  map.set('.go', goConfig);

  // SQL
  const sqlConfig: LanguageConfig = {
    extension: () => sql(),
    label: 'SQL',
  };
  map.set('.sql', sqlConfig);

  // HTML
  const htmlConfig: LanguageConfig = {
    extension: () => html(),
    label: 'HTML',
    prettierParser: 'html',
  };
  map.set('.html', htmlConfig);
  map.set('.htm', htmlConfig);
  map.set('.vue', { ...htmlConfig, label: 'Vue', prettierParser: 'html' });

  // CSS
  const cssConfig: LanguageConfig = {
    extension: () => css(),
    label: 'CSS',
    prettierParser: 'css',
  };
  map.set('.css', cssConfig);
  map.set('.scss', { ...cssConfig, label: 'SCSS', prettierParser: 'scss' });
  map.set('.less', { ...cssConfig, label: 'Less', prettierParser: 'less' });

  // Markdown
  const mdConfig: LanguageConfig = {
    extension: () => markdown(),
    label: 'Markdown',
    prettierParser: 'markdown',
  };
  map.set('.md', mdConfig);
  map.set('.markdown', mdConfig);

  // Store special filename configs for getConfigByFilename
  map.set('__dockerfile', dockerConfig);
  map.set('__nginx', nginxConfig);

  return map;
}

const languageMap = buildLanguageMap();

function getConfigByFilename(filename: string): LanguageConfig | null {
  const lower = filename.toLowerCase();

  // Special filename matching (no extension)
  if (lower === 'dockerfile' || lower.startsWith('dockerfile.')) {
    return languageMap.get('__dockerfile') || null;
  }
  if (lower === 'makefile') {
    return languageMap.get('.sh') || null;
  }
  if (lower.includes('nginx') && lower.endsWith('.conf')) {
    return languageMap.get('__nginx') || null;
  }

  // Extension-based matching
  const dotIndex = lower.lastIndexOf('.');
  if (dotIndex === -1) return null;
  const ext = lower.substring(dotIndex);
  return languageMap.get(ext) || null;
}

export function getLanguageExtension(filename: string): Extension | null {
  const config = getConfigByFilename(filename);
  return config ? config.extension() : null;
}

export function getLintExtension(filename: string): Extension | null {
  const config = getConfigByFilename(filename);
  return config?.lintSource ? config.lintSource() : null;
}

export function getPrettierConfig(filename: string): { parser: string } | null {
  const config = getConfigByFilename(filename);
  return config?.prettierParser ? { parser: config.prettierParser } : null;
}

export function isEditableFile(filename: string): boolean {
  return getConfigByFilename(filename) !== null;
}

export function getFileLanguageLabel(filename: string): string {
  const config = getConfigByFilename(filename);
  return config?.label || 'Text';
}

export function canFormat(filename: string): boolean {
  const config = getConfigByFilename(filename);
  return !!config?.prettierParser;
}
