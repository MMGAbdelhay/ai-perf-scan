import { Command } from 'commander';
import * as path from 'path';
import * as fs from 'fs';
import ora from 'ora';
import chalk from 'chalk';
import { scanDependencies } from './scanners/dependencies';
import { scanAssets } from './scanners/assets';
import { scanCode } from './scanners/code';
import { getAISuggestions, validateApiKey } from './ai';
import {
  printHeader,
  printScore,
  printIssues,
  printAISuggestions,
  printJSON,
  printFooter,
} from './reporter';
import { Issue, ScanResult, ScanOptions } from './types';
import {
  SCORE_CRITICAL_PENALTY,
  SCORE_WARNING_PENALTY,
  SCORE_INFO_PENALTY,
  SCORE_BASE_CHECKS,
} from './constants';

const program = new Command();

program
  .name('ai-perf-scan')
  .description('AI-powered performance scanner for React & React Native apps')
  .version('1.0.0')
  .argument('[path]', 'Path to project directory', '.')
  .option('--ai', 'Enable AI-powered suggestions (requires API key)')
  .option('--api-key <key>', 'OpenAI API key (or set OPENAI_API_KEY env var)')
  .option('-v, --verbose', 'Show detailed output including all info items')
  .option('--json', 'Output results as JSON')
  .action(async (projectPath: string, options: Record<string, unknown>) => {
    const scanOptions = parseOptions(projectPath, options);

    if (!scanOptions) return;

    if (!scanOptions.json) {
      printHeader();
    }

    const spinner = createSpinner();

    if (!scanOptions.json) {
      spinner.start();
    }

    try {
      const issues = await runScanners(scanOptions.path, spinner);
      spinner.stop();

      const result = calculateResult(issues);
      const aiSuggestions = await getAIAnalysis(scanOptions, result);

      outputResults(scanOptions, result, aiSuggestions);

      if (result.summary.critical > 0) {
        process.exit(1);
      }
    } catch (error) {
      spinner.stop();
      console.error(chalk.red('Error during scan:'), error);
      process.exit(1);
    }
  });

function parseOptions(
  projectPath: string,
  options: Record<string, unknown>
): ScanOptions | null {
  const resolvedPath = path.resolve(projectPath);

  if (!fs.existsSync(resolvedPath)) {
    console.error(chalk.red(`Error: Path does not exist: ${resolvedPath}`));
    process.exit(1);
  }

  if (!fs.existsSync(path.join(resolvedPath, 'package.json'))) {
    console.error(
      chalk.red('Error: No package.json found. Is this a JavaScript project?')
    );
    process.exit(1);
  }

  const scanOptions: ScanOptions = {
    path: resolvedPath,
    ai: Boolean(options.ai),
    apiKey: (options.apiKey as string) || process.env.OPENAI_API_KEY,
    verbose: Boolean(options.verbose),
    json: Boolean(options.json),
  };

  if (scanOptions.ai) {
    if (!scanOptions.apiKey) {
      console.error(
        chalk.red(
          'Error: AI mode requires an API key. Use --api-key or set OPENAI_API_KEY'
        )
      );
      process.exit(1);
    }

    if (!validateApiKey(scanOptions.apiKey)) {
      console.error(chalk.red('Error: Invalid API key format'));
      process.exit(1);
    }
  }

  return scanOptions;
}

function createSpinner() {
  return ora({ text: 'Scanning project...', spinner: 'dots' });
}

async function runScanners(
  projectPath: string,
  spinner: ReturnType<typeof ora>
): Promise<Issue[]> {
  const issues: Issue[] = [];

  spinner.text = 'Analyzing dependencies...';
  issues.push(...(await scanDependencies(projectPath)));

  spinner.text = 'Scanning assets...';
  issues.push(...(await scanAssets(projectPath)));

  spinner.text = 'Analyzing code patterns...';
  issues.push(...(await scanCode(projectPath)));

  return issues;
}

function calculateResult(issues: Issue[]): ScanResult {
  const summary = {
    critical: issues.filter((i) => i.severity === 'critical').length,
    warning: issues.filter((i) => i.severity === 'warning').length,
    info: issues.filter((i) => i.severity === 'info').length,
    passed: 0,
  };

  let score = 100;
  score -= summary.critical * SCORE_CRITICAL_PENALTY;
  score -= summary.warning * SCORE_WARNING_PENALTY;
  score -= summary.info * SCORE_INFO_PENALTY;
  score = Math.max(0, Math.min(100, score));

  summary.passed =
    SCORE_BASE_CHECKS +
    issues.length -
    summary.critical -
    summary.warning -
    summary.info;

  return { score, issues, summary };
}

async function getAIAnalysis(
  options: ScanOptions,
  result: ScanResult
): Promise<string | undefined> {
  if (!options.ai || !options.apiKey) return undefined;

  const spinner = ora({ text: 'Getting AI suggestions...', spinner: 'dots' });
  if (!options.json) {
    spinner.start();
  }

  const suggestions = await getAISuggestions(result, options.apiKey);

  if (!options.json) {
    spinner.stop();
  }

  return suggestions;
}

function outputResults(
  options: ScanOptions,
  result: ScanResult,
  aiSuggestions?: string
): void {
  if (options.json) {
    printJSON(result, aiSuggestions);
  } else {
    printScore(result);
    printIssues(result.issues, options.verbose);
    if (aiSuggestions) {
      printAISuggestions(aiSuggestions);
    }
    printFooter();
  }
}

program.parse();
