export type Severity = 'critical' | 'warning' | 'info';

export interface Issue {
  severity: Severity;
  category: 'dependency' | 'asset' | 'code';
  title: string;
  file?: string;
  line?: number;
  message: string;
  suggestion?: string;
  impact?: string;
}

export interface ScanResult {
  score: number;
  issues: Issue[];
  summary: {
    critical: number;
    warning: number;
    info: number;
    passed: number;
  };
}

export interface ScanOptions {
  path: string;
  ai: boolean;
  apiKey?: string;
  verbose: boolean;
  json: boolean;
}

export interface HeavyDependency {
  name: string;
  size: string;
  alternative: string;
}
