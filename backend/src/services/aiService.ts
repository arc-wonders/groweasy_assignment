import OpenAI from 'openai';
import { env } from '../utils/env.js';
import { CRM_MAPPING_PROMPT } from '../prompts/crmMappingPrompt.js';

const client = new OpenAI({
  apiKey: env.openRouterApiKey,
  baseURL: env.openRouterBaseUrl,
  dangerouslyAllowBrowser: false,
});

export interface MappedRecord {
  created_at?: string;
  name?: string;
  email?: string;
  country_code?: string;
  mobile_without_country_code?: string;
  company?: string;
  city?: string;
  state?: string;
  country?: string;
  lead_owner?: string;
  crm_status?: string;
  crm_note?: string;
  data_source?: string;
  possession_time?: string;
  description?: string;
}

export interface MappingResult {
  skip: boolean;
  record?: MappedRecord;
}

export async function mapRowsToCrm(rows: Record<string, unknown>[]): Promise<MappingResult[]> {
  if (!env.openRouterApiKey) {
    throw new Error('Missing OPENROUTER_API_KEY in environment.');
  }

  const batchSize = 50;
  const results: MappingResult[] = [];

  for (let index = 0; index < rows.length; index += batchSize) {
    const batch = rows.slice(index, index + batchSize);
    const completion = await client.chat.completions.create({
      model: env.openRouterModel,
      messages: [
        { role: 'system', content: CRM_MAPPING_PROMPT },
        {
          role: 'user',
          content: JSON.stringify({ rows: batch }, null, 2),
        },
      ],
      temperature: 0,
    });

    const content = completion.choices[0]?.message?.content ?? '[]';
    const parsed = parseResponse(content);
    results.push(...parsed);
  }

  return results;
}

function parseResponse(content: string): MappingResult[] {
  const cleaned = extractJsonContent(content);
  if (!cleaned) {
    return [];
  }

  try {
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed)) {
      return parsed as MappingResult[];
    }
    if (parsed && typeof parsed === 'object' && 'rows' in parsed) {
      return (parsed as { rows: MappingResult[] }).rows;
    }
    if (parsed && typeof parsed === 'object' && 'skip' in parsed) {
      return [parsed as MappingResult];
    }
    return [];
  } catch {
    return [];
  }
}

function extractJsonContent(text: string): string {
  let trimmed = text.trim();
  if (!trimmed) {
    return '';
  }

  // Remove common code fence blocks.
  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenceMatch?.[1]) {
    trimmed = fenceMatch[1].trim();
  }

  if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
    return trimmed;
  }

  const arrayJson = extractBalancedJson(trimmed, '[', ']');
  if (arrayJson) {
    return arrayJson;
  }

  const objectJson = extractBalancedJson(trimmed, '{', '}');
  return objectJson;
}

function extractBalancedJson(text: string, openChar: string, closeChar: string): string {
  const start = text.indexOf(openChar);
  if (start === -1) {
    return '';
  }

  let depth = 0;
  for (let i = start; i < text.length; i += 1) {
    const char = text[i];
    if (char === openChar) {
      depth += 1;
    } else if (char === closeChar) {
      depth -= 1;
      if (depth === 0) {
        return text.slice(start, i + 1).trim();
      }
    }
  }

  return '';
}
