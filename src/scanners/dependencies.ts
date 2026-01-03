import * as fs from 'fs';
import * as path from 'path';
import { Issue } from '../types';
import { HEAVY_DEPS, CRITICAL_DEPS, HIGH_DEPENDENCY_COUNT } from '../constants';

export async function scanDependencies(projectPath: string): Promise<Issue[]> {
  const issues: Issue[] = [];
  const packageJsonPath = path.join(projectPath, 'package.json');

  if (!fs.existsSync(packageJsonPath)) {
    return issues;
  }

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
  const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
  const depNames = Object.keys(deps || {});

  checkHeavyDependencies(depNames, issues);
  await checkLodashImports(depNames, projectPath, issues);
  checkDuplicateLibraries(depNames, issues);
  checkDependencyCount(packageJson, issues);

  return issues;
}

function checkHeavyDependencies(depNames: string[], issues: Issue[]): void {
  for (const heavy of HEAVY_DEPS) {
    if (depNames.includes(heavy.name)) {
      issues.push({
        severity: CRITICAL_DEPS.includes(heavy.name) ? 'critical' : 'warning',
        category: 'dependency',
        title: `Heavy dependency: ${heavy.name}`,
        message: `${heavy.name} (${heavy.size}) adds significant bundle size`,
        suggestion: `Consider using ${heavy.alternative}`,
        impact: `Removing could save ~${heavy.size}`,
      });
    }
  }
}

async function checkLodashImports(
  depNames: string[],
  projectPath: string,
  issues: Issue[]
): Promise<void> {
  if (!depNames.includes('lodash') || depNames.includes('lodash-es')) {
    return;
  }

  const srcPath = path.join(projectPath, 'src');
  if (!fs.existsSync(srcPath)) {
    return;
  }

  const hasFullImport = await detectFullLodashImport(srcPath);
  if (hasFullImport) {
    issues.push({
      severity: 'warning',
      category: 'dependency',
      title: 'Full lodash import detected',
      message: 'Importing entire lodash instead of specific functions',
      suggestion:
        'Use: import debounce from "lodash/debounce" instead of import { debounce } from "lodash"',
      impact: 'Could save up to 70KB',
    });
  }
}

function checkDuplicateLibraries(depNames: string[], issues: Issue[]): void {
  if (depNames.includes('axios') && depNames.includes('node-fetch')) {
    issues.push({
      severity: 'warning',
      category: 'dependency',
      title: 'Duplicate HTTP libraries',
      message: 'Both axios and node-fetch are installed',
      suggestion: 'Use one HTTP library consistently',
    });
  }

  if (depNames.includes('moment') && depNames.includes('date-fns')) {
    issues.push({
      severity: 'warning',
      category: 'dependency',
      title: 'Duplicate date libraries',
      message: 'Both moment and date-fns are installed',
      suggestion: 'Migrate fully to date-fns and remove moment',
    });
  }
}

function checkDependencyCount(
  packageJson: Record<string, unknown>,
  issues: Issue[]
): void {
  const deps = packageJson.dependencies as Record<string, string> | undefined;
  const prodDeps = Object.keys(deps || {}).length;

  if (prodDeps > HIGH_DEPENDENCY_COUNT) {
    issues.push({
      severity: 'warning',
      category: 'dependency',
      title: 'High dependency count',
      message: `${prodDeps} production dependencies installed`,
      suggestion: 'Review if all dependencies are necessary',
    });
  }
}

async function detectFullLodashImport(srcPath: string): Promise<boolean> {
  const { glob } = await import('glob');
  const files = await glob('**/*.{js,jsx,ts,tsx}', { cwd: srcPath });

  for (const file of files.slice(0, 50)) {
    try {
      const content = fs.readFileSync(path.join(srcPath, file), 'utf-8');
      if (
        content.includes('from "lodash"') ||
        content.includes("from 'lodash'") ||
        content.includes('require("lodash")') ||
        content.includes("require('lodash')")
      ) {
        return true;
      }
    } catch {
      // Skip unreadable files
    }
  }

  return false;
}
