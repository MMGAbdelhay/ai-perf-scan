import chalk from 'chalk';
import { ScanResult, Issue, Severity } from './types';
import { SEVERITY_ICONS, CATEGORY_ICONS } from './constants';

export function printHeader(): void {
  console.log('');
  console.log(chalk.bold.cyan('  ai-perf-scan'));
  console.log(chalk.gray('  Performance scanner for React & React Native'));
  console.log('');
}

export function printScore(result: ScanResult): void {
  const grade = getGrade(result.score);
  const coloredScore = colorizeScore(result.score);

  console.log(chalk.bold('  Performance Score'));
  console.log('');
  console.log(`  ${coloredScore} ${chalk.gray(`(Grade: ${grade})`)}`);
  console.log('');

  printSummary(result);
}

export function printIssues(issues: Issue[], verbose: boolean): void {
  if (issues.length === 0) {
    console.log(chalk.green('  No issues found!'));
    return;
  }

  const critical = issues.filter((i) => i.severity === 'critical');
  const warnings = issues.filter((i) => i.severity === 'warning');
  const info = issues.filter((i) => i.severity === 'info');

  if (critical.length > 0) {
    printSection('Critical Issues', 'critical', critical, verbose);
  }

  if (warnings.length > 0) {
    printSection('Warnings', 'warning', warnings, verbose);
  }

  if (verbose && info.length > 0) {
    printSection('Info', 'info', info, verbose);
  } else if (info.length > 0) {
    console.log(
      chalk.gray(`  + ${info.length} info items (use --verbose to see)`)
    );
    console.log('');
  }
}

export function printAISuggestions(suggestions: string): void {
  console.log(chalk.magenta.bold('  AI Analysis'));
  console.log(chalk.gray('  -----------'));
  console.log('');

  for (const line of suggestions.split('\n')) {
    console.log(`  ${line}`);
  }
  console.log('');
}

export function printJSON(result: ScanResult, aiSuggestions?: string): void {
  console.log(JSON.stringify({ ...result, aiSuggestions }, null, 2));
}

export function printFooter(): void {
  console.log(chalk.gray('  ─────────────────────────────────────'));
  console.log(chalk.gray('  Run with --ai to get AI-powered suggestions'));
  console.log(chalk.gray('  Run with --verbose to see all details'));
  console.log('');
}

// Helper functions

function getGrade(score: number): string {
  if (score >= 90) return 'A+';
  if (score >= 80) return 'A';
  if (score >= 70) return 'B';
  if (score >= 60) return 'C';
  if (score >= 50) return 'D';

  return 'F';
}

function colorizeScore(score: number): string {
  const text = `${score}/100`;

  if (score >= 80) return chalk.green.bold(text);
  if (score >= 60) return chalk.yellow.bold(text);

  return chalk.red.bold(text);
}

function getSeverityColor(severity: Severity): (text: string) => string {
  if (severity === 'critical') return chalk.red;
  if (severity === 'warning') return chalk.yellow;

  return chalk.blue;
}

function printSummary(result: ScanResult): void {
  const { critical, warning, info, passed } = result.summary;
  const total = critical + warning + info + passed;

  if (total > 0) {
    console.log(
      `  ${chalk.red(`${critical} critical`)}  ` +
        `${chalk.yellow(`${warning} warnings`)}  ` +
        `${chalk.blue(`${info} info`)}  ` +
        `${chalk.green(`${passed} passed`)}`
    );
  }

  console.log('');
}

function printSection(
  title: string,
  severity: Severity,
  issues: Issue[],
  verbose: boolean
): void {
  const colorFn =
    severity === 'critical'
      ? chalk.red.bold
      : severity === 'warning'
      ? chalk.yellow.bold
      : chalk.blue.bold;

  console.log(colorFn(`  ${title}`));
  console.log(chalk.gray(`  ${'-'.repeat(title.length)}`));
  printIssueGroup(issues, verbose);
  console.log('');
}

function printIssueGroup(issues: Issue[], verbose: boolean): void {
  for (const issue of issues) {
    const color = getSeverityColor(issue.severity);
    const icon = SEVERITY_ICONS[issue.severity];
    const catIcon = CATEGORY_ICONS[issue.category] || '';

    console.log('');

    console.log(
      `  ${color(`[${icon}]`)} ${catIcon} ${chalk.bold(issue.title)}`
    );

    if (issue.file) {
      const location = issue.line ? `${issue.file}:${issue.line}` : issue.file;
      console.log(`      ${chalk.gray(location)}`);
    }

    console.log(`      ${issue.message}`);

    if (issue.suggestion) {
      console.log(`      ${chalk.cyan('->')} ${issue.suggestion}`);
    }

    if (verbose && issue.impact) {
      console.log(`      ${chalk.green('Impact:')} ${issue.impact}`);
    }
  }
}
