import * as fs from 'fs';
import * as path from 'path';
import { Issue } from '../types';
import {
  CODE_EXTENSIONS,
  CODE_IGNORE_PATTERNS,
  LARGE_FILE_LINES,
  CONSOLE_WARNING_THRESHOLD,
  INLINE_FUNCTION_THRESHOLD,
  INLINE_STYLE_THRESHOLD,
  HEAVY_RENDER_MAP_THRESHOLD,
  MEMO_LINE_THRESHOLD,
  CONSOLE_LOG_PATTERN,
  INLINE_FUNCTION_PATTERN,
  INLINE_STYLE_PATTERN,
  USE_EFFECT_NO_DEPS,
  HARDCODED_URL_PATTERN,
  LARGE_OBJECT_PATTERN,
  MAP_CALL_PATTERN,
} from '../constants';

export async function scanCode(projectPath: string): Promise<Issue[]> {
  const issues: Issue[] = [];
  const { glob } = await import('glob');

  const files = await glob(CODE_EXTENSIONS, {
    cwd: projectPath,
    ignore: CODE_IGNORE_PATTERNS,
  });

  for (const file of files) {
    try {
      const content = fs.readFileSync(path.join(projectPath, file), 'utf-8');
      const lines = content.split('\n');

      checkFileSize(file, lines.length, issues);
      checkConsoleStatements(file, content, lines, issues);

      if (file.endsWith('.jsx') || file.endsWith('.tsx')) {
        checkInlineFunctions(file, content, issues);
        checkInlineStyles(file, content, issues);
        checkUseEffectDeps(file, content, issues);
        checkMemoization(file, content, lines.length, issues);
      }

      checkSyncFileOps(file, content, issues);
      checkHardcodedUrls(file, content, issues);
      checkLargeObjects(file, content, issues);
      checkReactNativePatterns(file, content, issues);
    } catch {
      // Skip unreadable files
    }
  }

  return issues;
}

function checkFileSize(file: string, lineCount: number, issues: Issue[]): void {
  if (lineCount > LARGE_FILE_LINES) {
    issues.push({
      severity: 'warning',
      category: 'code',
      title: 'Large file',
      file,
      message: `File has ${lineCount} lines`,
      suggestion: 'Consider splitting into smaller modules',
      impact:
        'Large files are harder to maintain and may impact bundle splitting',
    });
  }
}

function checkConsoleStatements(
  file: string,
  content: string,
  lines: string[],
  issues: Issue[]
): void {
  const matches = content.match(CONSOLE_LOG_PATTERN);

  if (!matches) return;

  const consoleLines: number[] = [];
  lines.forEach((line, index) => {
    if (/console\.(log|warn|error|info|debug)\s*\(/.test(line)) {
      consoleLines.push(index + 1);
    }
  });

  if (consoleLines.length > CONSOLE_WARNING_THRESHOLD) {
    issues.push({
      severity: 'warning',
      category: 'code',
      title: 'Multiple console statements',
      file,
      line: consoleLines[0],
      message: `${
        matches.length
      } console statements found (lines: ${consoleLines
        .slice(0, 5)
        .join(', ')}${consoleLines.length > 5 ? '...' : ''})`,
      suggestion: 'Remove console statements in production or use a logger',
      impact: 'Console statements impact performance and expose debug info',
    });
  } else if (consoleLines.length > 0) {
    issues.push({
      severity: 'info',
      category: 'code',
      title: 'Console statement found',
      file,
      line: consoleLines[0],
      message: `${matches.length} console statement(s) found`,
      suggestion: 'Consider removing before production',
    });
  }
}

function checkInlineFunctions(
  file: string,
  content: string,
  issues: Issue[]
): void {
  const matches = content.match(INLINE_FUNCTION_PATTERN);
  if (matches && matches.length > INLINE_FUNCTION_THRESHOLD) {
    issues.push({
      severity: 'warning',
      category: 'code',
      title: 'Inline functions in render',
      file,
      message: `${matches.length} inline arrow functions in event handlers`,
      suggestion: 'Use useCallback to memoize handlers',
      impact: 'Inline functions cause unnecessary re-renders',
    });
  }
}

function checkInlineStyles(
  file: string,
  content: string,
  issues: Issue[]
): void {
  const matches = content.match(INLINE_STYLE_PATTERN);
  if (matches && matches.length > INLINE_STYLE_THRESHOLD) {
    issues.push({
      severity: 'info',
      category: 'code',
      title: 'Multiple inline styles',
      file,
      message: `${matches.length} inline style objects`,
      suggestion: 'Use StyleSheet.create() or move styles outside component',
      impact: 'Inline styles create new objects on each render',
    });
  }
}

function checkUseEffectDeps(
  file: string,
  content: string,
  issues: Issue[]
): void {
  const matches = content.match(USE_EFFECT_NO_DEPS);
  if (matches && matches.length > 0) {
    issues.push({
      severity: 'warning',
      category: 'code',
      title: 'useEffect without dependencies',
      file,
      message: 'useEffect called without dependency array',
      suggestion:
        'Add dependency array [] for mount-only effects, or [deps] for reactive effects',
      impact: 'Missing dependencies can cause infinite re-renders',
    });
  }
}

function checkMemoization(
  file: string,
  content: string,
  lineCount: number,
  issues: Issue[]
): void {
  const isExportedComponent =
    content.includes('export default function') ||
    content.includes('export const');

  if (!isExportedComponent) return;

  const hasMemo = content.includes('React.memo') || content.includes('memo(');
  const mapMatches = content.match(MAP_CALL_PATTERN) || [];
  const hasHeavyRender =
    mapMatches.length > HEAVY_RENDER_MAP_THRESHOLD ||
    content.includes('FlatList');

  if (!hasMemo && hasHeavyRender && lineCount > MEMO_LINE_THRESHOLD) {
    issues.push({
      severity: 'info',
      category: 'code',
      title: 'Consider memoization',
      file,
      message: 'Component with heavy rendering not memoized',
      suggestion: 'Wrap with React.memo() to prevent unnecessary re-renders',
    });
  }
}

function checkSyncFileOps(
  file: string,
  content: string,
  issues: Issue[]
): void {
  const hasSyncOps =
    content.includes('fs.readFileSync') ||
    content.includes('fs.writeFileSync') ||
    content.includes('fs.existsSync');

  const isAllowed =
    file.includes('cli') || file.includes('script') || file.includes('config');

  if (hasSyncOps && !isAllowed) {
    issues.push({
      severity: 'warning',
      category: 'code',
      title: 'Synchronous file operation',
      file,
      message: 'Sync file operations block the event loop',
      suggestion: 'Use async versions: fs.promises.readFile, etc.',
    });
  }
}

function checkHardcodedUrls(
  file: string,
  content: string,
  issues: Issue[]
): void {
  const matches = content.match(HARDCODED_URL_PATTERN);

  if (!matches) return;

  const nonTestUrls = matches.filter(
    (url) => !url.includes('example.com') && !url.includes('placeholder')
  );

  if (nonTestUrls.length > 0) {
    issues.push({
      severity: 'info',
      category: 'code',
      title: 'Hardcoded URLs',
      file,
      message: `${nonTestUrls.length} hardcoded URL(s) found`,
      suggestion: 'Move URLs to environment variables or config',
    });
  }
}

function checkLargeObjects(
  file: string,
  content: string,
  issues: Issue[]
): void {
  const matches = content.match(LARGE_OBJECT_PATTERN);
  if (matches && matches.length > 0) {
    issues.push({
      severity: 'info',
      category: 'code',
      title: 'Large inline object',
      file,
      message: 'Large object literal defined inline',
      suggestion: 'Move to separate file or lazy load',
    });
  }
}

function checkReactNativePatterns(
  file: string,
  content: string,
  issues: Issue[]
): void {
  const isReactNative =
    content.includes('react-native') || content.includes('React Native');

  if (!isReactNative) return;

  // Check for Image without resizeMode
  if (
    content.includes('<Image') &&
    !content.includes('resizeMode') &&
    content.includes('source={')
  ) {
    issues.push({
      severity: 'info',
      category: 'code',
      title: 'Image without resizeMode',
      file,
      message: 'Image component without explicit resizeMode',
      suggestion: 'Add resizeMode prop for better performance',
    });
  }

  // Check for ScrollView misuse
  const viewMatches = content.match(/<View/g) || [];
  if (
    content.includes('<ScrollView') &&
    viewMatches.length > 10 &&
    !content.includes('FlatList')
  ) {
    issues.push({
      severity: 'warning',
      category: 'code',
      title: 'ScrollView with many items',
      file,
      message: 'ScrollView used for list rendering',
      suggestion: 'Use FlatList or SectionList for better performance',
      impact: 'ScrollView renders all children at once',
    });
  }
}
