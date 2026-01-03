import { HeavyDependency, Severity } from './types';

// ===================
// AI Configuration
// ===================
export const AI_PROMPT = `You are a performance optimization expert for React and React Native applications.

Analyze these performance scan results and provide actionable recommendations:

Performance Score: {{score}}/100
Critical Issues: {{critical}}
Warnings: {{warning}}
Info: {{info}}

Issues found:
{{issues}}

Provide a brief analysis (max 200 words) with:
1. The top 3 priority fixes that will have the biggest impact
2. A quick win that can be done in under 5 minutes
3. One long-term improvement suggestion

Keep the response concise and actionable. Use bullet points.`;

export const AI_SYSTEM_MESSAGE =
  'You are a helpful performance optimization assistant. Be concise and practical.';

export const AI_MODEL = 'gpt-4o-mini';
export const AI_MAX_TOKENS = 500;
export const AI_TEMPERATURE = 0.7;

// ===================
// Size Thresholds
// ===================
export const IMAGE_SIZE_WARNING = 100 * 1024; // 100KB
export const IMAGE_SIZE_CRITICAL = 500 * 1024; // 500KB
export const FONT_SIZE_WARNING = 200 * 1024; // 200KB
export const TOTAL_ASSETS_WARNING = 10 * 1024 * 1024; // 10MB
export const WEBP_SUGGESTION_THRESHOLD = 50 * 1024; // 50KB
export const RESOLUTION_VARIANT_THRESHOLD = 20 * 1024; // 20KB

// ===================
// Code Thresholds
// ===================
export const LARGE_FILE_LINES = 300;
export const CONSOLE_WARNING_THRESHOLD = 3;
export const INLINE_FUNCTION_THRESHOLD = 2;
export const INLINE_STYLE_THRESHOLD = 3;
export const HEAVY_RENDER_MAP_THRESHOLD = 2;
export const MEMO_LINE_THRESHOLD = 50;
export const HIGH_DEPENDENCY_COUNT = 50;

// ===================
// Scoring
// ===================
export const SCORE_CRITICAL_PENALTY = 15;
export const SCORE_WARNING_PENALTY = 5;
export const SCORE_INFO_PENALTY = 1;
export const SCORE_BASE_CHECKS = 10;

// ===================
// File Extensions
// ===================
export const IMAGE_EXTENSIONS = [
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.bmp',
  '.webp',
  '.svg',
];
export const FONT_EXTENSIONS = ['.ttf', '.otf', '.woff', '.woff2'];
export const CODE_EXTENSIONS = '**/*.{js,jsx,ts,tsx}';

// ===================
// Glob Patterns
// ===================
export const IGNORE_PATTERNS = [
  '**/node_modules/**',
  '**/dist/**',
  '**/build/**',
  '**/.git/**',
];

export const CODE_IGNORE_PATTERNS = [
  ...IGNORE_PATTERNS,
  '**/coverage/**',
  '**/*.test.*',
  '**/*.spec.*',
  '**/__tests__/**',
];

// ===================
// Regex Patterns
// ===================
export const CONSOLE_LOG_PATTERN = /console\.(log|warn|error|info|debug)\s*\(/g;
export const INLINE_FUNCTION_PATTERN =
  /(?:on[A-Z]\w*|render\w*)\s*=\s*\{?\s*\(\s*\)\s*=>/g;
export const INLINE_STYLE_PATTERN = /style\s*=\s*\{\s*\{/g;
export const USE_EFFECT_NO_DEPS =
  /useEffect\s*\(\s*\(\s*\)\s*=>\s*\{[^}]*\}\s*\)/g;
export const HARDCODED_URL_PATTERN =
  /['"`](https?:\/\/(?!localhost)[^'"`\s]+)['"`]/g;
export const LARGE_OBJECT_PATTERN = /\{[^{}]{500,}\}/g;
export const MAP_CALL_PATTERN = /map\s*\(/g;

// ===================
// Heavy Dependencies
// ===================
export const HEAVY_DEPS: HeavyDependency[] = [
  {
    name: 'moment',
    size: '328KB',
    alternative: 'date-fns (tree-shakeable) or dayjs (2KB)',
  },
  {
    name: 'lodash',
    size: '72KB',
    alternative: 'lodash-es or individual imports (lodash/debounce)',
  },
  { name: 'axios', size: '14KB', alternative: 'native fetch (RN 0.72+) or ky' },
  {
    name: 'underscore',
    size: '16KB',
    alternative: 'lodash-es or native methods',
  },
  { name: 'jquery', size: '87KB', alternative: 'native DOM APIs' },
  { name: 'bluebird', size: '80KB', alternative: 'native Promise' },
  { name: 'request', size: '48KB', alternative: 'native fetch or node-fetch' },
  { name: 'uuid', size: '12KB', alternative: 'crypto.randomUUID() (native)' },
  { name: 'node-fetch', size: '8KB', alternative: 'native fetch (Node 18+)' },
  {
    name: 'core-js',
    size: '200KB+',
    alternative: 'Check if you really need all polyfills',
  },
  { name: 'ramda', size: '46KB', alternative: 'lodash-es or native methods' },
  { name: 'rxjs', size: '50KB', alternative: 'Consider if you need full RxJS' },
  {
    name: 'immutable',
    size: '64KB',
    alternative: 'Immer (16KB) or native spread',
  },
];

export const CRITICAL_DEPS = ['moment', 'lodash'];

// ===================
// UI Constants
// ===================
export const SEVERITY_ICONS: Record<Severity, string> = {
  critical: 'X',
  warning: '!',
  info: 'i',
};

export const CATEGORY_ICONS: Record<string, string> = {
  dependency: '[pkg]',
  asset: '[img]',
  code: '[src]',
};
