import OpenAI from 'openai';
import { ScanResult } from './types';
import {
  AI_PROMPT,
  AI_SYSTEM_MESSAGE,
  AI_MODEL,
  AI_MAX_TOKENS,
  AI_TEMPERATURE,
} from './constants';

export async function getAISuggestions(
  result: ScanResult,
  apiKey: string
): Promise<string> {
  const openai = new OpenAI({ apiKey });
  const prompt = buildPrompt(result);

  try {
    const response = await openai.chat.completions.create({
      model: AI_MODEL,
      messages: [
        { role: 'system', content: AI_SYSTEM_MESSAGE },
        { role: 'user', content: prompt },
      ],
      max_tokens: AI_MAX_TOKENS,
      temperature: AI_TEMPERATURE,
    });

    return (
      response.choices[0]?.message?.content ||
      'Unable to generate AI suggestions.'
    );
  } catch (error) {
    return handleError(error);
  }
}

function buildPrompt(result: ScanResult): string {
  const issuesSummary = result.issues
    .slice(0, 20)
    .map(
      (issue) =>
        `- [${issue.severity.toUpperCase()}] ${issue.title}${
          issue.file ? ` in ${issue.file}` : ''
        }: ${issue.message}`
    )
    .join('\n');

  return AI_PROMPT.replace('{{score}}', String(result.score))
    .replace('{{critical}}', String(result.summary.critical))
    .replace('{{warning}}', String(result.summary.warning))
    .replace('{{info}}', String(result.summary.info))
    .replace('{{issues}}', issuesSummary);
}

function handleError(error: unknown): string {
  if (error instanceof Error) {
    if (error.message.includes('API key')) {
      return 'Invalid API key. Please check your OpenAI API key.';
    }

    if (error.message.includes('quota')) {
      return 'API quota exceeded. Please check your OpenAI account.';
    }

    return `AI analysis failed: ${error.message}`;
  }

  return 'AI analysis failed. Please try again.';
}

export function validateApiKey(apiKey: string): boolean {
  return apiKey.startsWith('sk-') && apiKey.length > 20;
}
