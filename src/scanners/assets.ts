import * as fs from 'fs';
import * as path from 'path';
import { Issue } from '../types';
import {
  IMAGE_SIZE_WARNING,
  IMAGE_SIZE_CRITICAL,
  FONT_SIZE_WARNING,
  TOTAL_ASSETS_WARNING,
  WEBP_SUGGESTION_THRESHOLD,
  RESOLUTION_VARIANT_THRESHOLD,
  IMAGE_EXTENSIONS,
  FONT_EXTENSIONS,
  IGNORE_PATTERNS,
} from '../constants';

export async function scanAssets(projectPath: string): Promise<Issue[]> {
  const issues: Issue[] = [];
  const { glob } = await import('glob');

  await scanImages(projectPath, glob, issues);
  await scanFonts(projectPath, glob, issues);
  await checkTotalAssetsSize(projectPath, glob, issues);

  return issues;
}

async function scanImages(
  projectPath: string,
  glob: typeof import('glob').glob,
  issues: Issue[]
): Promise<void> {
  for (const ext of IMAGE_EXTENSIONS) {
    const files = await glob(`**/*${ext}`, {
      cwd: projectPath,
      ignore: IGNORE_PATTERNS,
    });

    for (const file of files) {
      const filePath = path.join(projectPath, file);
      try {
        const stats = fs.statSync(filePath);
        checkImageSize(file, stats.size, issues);
        checkWebPAlternative(file, filePath, stats.size, issues);
        checkResolutionVariants(file, filePath, stats.size, issues);
      } catch {
        // Skip unreadable files
      }
    }
  }
}

function checkImageSize(file: string, size: number, issues: Issue[]): void {
  if (size > IMAGE_SIZE_CRITICAL) {
    issues.push({
      severity: 'critical',
      category: 'asset',
      title: 'Very large image',
      file,
      message: `Image is ${formatSize(
        size
      )} - this will significantly impact load time`,
      suggestion: 'Compress to under 200KB, consider WebP format',
      impact: `Could save ~${formatSize(size - IMAGE_SIZE_WARNING)}`,
    });
  } else if (size > IMAGE_SIZE_WARNING) {
    issues.push({
      severity: 'warning',
      category: 'asset',
      title: 'Large image',
      file,
      message: `Image is ${formatSize(size)}`,
      suggestion: 'Consider compressing or using WebP format',
    });
  }
}

function checkWebPAlternative(
  file: string,
  filePath: string,
  size: number,
  issues: Issue[]
): void {
  const ext = path.extname(file).toLowerCase();
  const isConvertible = ext === '.png' || ext === '.jpg' || ext === '.jpeg';

  if (isConvertible && size > WEBP_SUGGESTION_THRESHOLD) {
    const webpExists = fs.existsSync(filePath.replace(ext, '.webp'));

    if (!webpExists) {
      issues.push({
        severity: 'info',
        category: 'asset',
        title: 'Consider WebP format',
        file,
        message: `${ext.toUpperCase()} format used - WebP could be 25-35% smaller`,
        suggestion: 'Convert to WebP for better compression',
      });
    }
  }
}

function checkResolutionVariants(
  file: string,
  filePath: string,
  size: number,
  issues: Issue[]
): void {
  const ext = path.extname(file).toLowerCase();
  const basename = path.basename(file, ext);

  if (basename.includes('@2x') || basename.includes('@3x')) {
    return;
  }

  const dir = path.dirname(filePath);
  const has2x = fs.existsSync(path.join(dir, `${basename}@2x${ext}`));
  const has3x = fs.existsSync(path.join(dir, `${basename}@3x${ext}`));

  if (!has2x && !has3x && size > RESOLUTION_VARIANT_THRESHOLD) {
    issues.push({
      severity: 'info',
      category: 'asset',
      title: 'Missing resolution variants',
      file,
      message: 'No @2x or @3x variants found',
      suggestion:
        'Add resolution-specific variants for better quality on high-DPI screens',
    });
  }
}

async function scanFonts(
  projectPath: string,
  glob: typeof import('glob').glob,
  issues: Issue[]
): Promise<void> {
  for (const ext of FONT_EXTENSIONS) {
    const files = await glob(`**/*${ext}`, {
      cwd: projectPath,
      ignore: IGNORE_PATTERNS,
    });

    for (const file of files) {
      try {
        const stats = fs.statSync(path.join(projectPath, file));
        checkFontSize(file, stats.size, issues);
        checkFontFormat(file, issues);
      } catch {
        // Skip unreadable files
      }
    }
  }
}

function checkFontSize(file: string, size: number, issues: Issue[]): void {
  if (size > FONT_SIZE_WARNING) {
    issues.push({
      severity: 'warning',
      category: 'asset',
      title: 'Large font file',
      file,
      message: `Font is ${formatSize(size)}`,
      suggestion: 'Consider subsetting font to include only needed characters',
    });
  }
}

function checkFontFormat(file: string, issues: Issue[]): void {
  const ext = path.extname(file).toLowerCase();
  if (ext === '.ttf' || ext === '.otf') {
    issues.push({
      severity: 'info',
      category: 'asset',
      title: 'Unoptimized font format',
      file,
      message: `${ext.toUpperCase()} format used`,
      suggestion: 'WOFF2 format is ~30% smaller and widely supported',
    });
  }
}

async function checkTotalAssetsSize(
  projectPath: string,
  glob: typeof import('glob').glob,
  issues: Issue[]
): Promise<void> {
  const allAssets = await glob(
    '**/*.{png,jpg,jpeg,gif,webp,svg,ttf,otf,woff,woff2}',
    {
      cwd: projectPath,
      ignore: IGNORE_PATTERNS,
    }
  );

  let totalSize = 0;

  for (const file of allAssets) {
    try {
      const stats = fs.statSync(path.join(projectPath, file));
      totalSize += stats.size;
    } catch {
      // Skip
    }
  }

  if (totalSize > TOTAL_ASSETS_WARNING) {
    issues.push({
      severity: 'warning',
      category: 'asset',
      title: 'High total assets size',
      message: `Total assets size is ${formatSize(totalSize)}`,
      suggestion: 'Consider lazy loading images or using a CDN',
      impact: 'Large assets increase initial load time',
    });
  }
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;

  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}
