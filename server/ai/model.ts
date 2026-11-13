/** Model adapter (integration.md Add-on 2026-11-13): picks the provider from AI_PROVIDER. Adding a provider = 1 case. */
import { createAmazonBedrock } from '@ai-sdk/amazon-bedrock';
import { createAzure } from '@ai-sdk/azure';
import type { LanguageModel } from 'ai';

export interface AiEnv {
  AI_PROVIDER?: string;
  AI_MODEL?: string;
  AZURE_AI_ENDPOINT?: string;
  AZURE_AI_KEY?: string;
  AWS_REGION?: string;
  AWS_ACCESS_KEY_ID?: string;
  AWS_SECRET_ACCESS_KEY?: string;
  AWS_SESSION_TOKEN?: string;
}

const REQUEST_TIMEOUT_MS = 3500;

/**
 * fetch with a per-request cap: a request that stalls (seen: one call ~7.5s while others take ~0.7s) is cut at 3.5s and
 * sent once more, so one slow request does not spend the whole 9s budget. The caller's abort still wins.
 * The cap only bounds time-to-headers: it is cleared once base() resolves, so a streamed body keeps reading.
 */
export function stallRetryFetch(base: typeof fetch = fetch, timeoutMs = REQUEST_TIMEOUT_MS): typeof fetch {
  return async (input, init) => {
    for (let attempt = 0; ; attempt++) {
      const cap = new AbortController();
      const timer = setTimeout(() => cap.abort(new DOMException('stalled', 'TimeoutError')), timeoutMs);
      const signal = init?.signal ? AbortSignal.any([init.signal, cap.signal]) : cap.signal;
      try {
        return await base(input, { ...init, signal });
      } catch (err) {
        if (attempt > 0 || init?.signal?.aborted || !cap.signal.aborted) throw err;
      } finally {
        clearTimeout(timer);
      }
    }
  };
}

export class ConfigMissingError extends Error {
  override name = 'ConfigMissingError';
}

/** Throws ConfigMissingError before building a provider: both SDKs fall back to process env / credential chains otherwise. */
export function resolveModel(env: AiEnv): LanguageModel {
  const { AI_PROVIDER: provider, AI_MODEL: model } = env;
  if (!model) throw new ConfigMissingError('AI_MODEL');
  if (provider === 'azure') {
    const { AZURE_AI_ENDPOINT: endpoint, AZURE_AI_KEY: apiKey } = env;
    if (!endpoint || !apiKey) throw new ConfigMissingError('azure');
    // baseURL ending in /openai/v1 on *.services.ai.azure.com is used as-is → POST {endpoint}/responses, no api-version
    return createAzure({ baseURL: endpoint.replace(/\/+$/, ''), apiKey, fetch: stallRetryFetch() }).responses(model);
  }
  if (provider === 'bedrock') {
    const { AWS_REGION: region, AWS_ACCESS_KEY_ID: accessKeyId, AWS_SECRET_ACCESS_KEY: secretAccessKey } = env;
    if (!region || (!!accessKeyId !== !!secretAccessKey)) throw new ConfigMissingError('bedrock');
    // Lambda passes its role's temporary keys (+ session token) through env; with none, the SDK reads AWS_* itself
    const keys = accessKeyId && secretAccessKey ? { accessKeyId, secretAccessKey, sessionToken: env.AWS_SESSION_TOKEN } : {};
    return createAmazonBedrock({ region, ...keys, fetch: stallRetryFetch() })(model);
  }
  throw new ConfigMissingError('AI_PROVIDER');
}
