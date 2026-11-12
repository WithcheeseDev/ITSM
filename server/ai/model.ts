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
    return createAzure({ baseURL: endpoint.replace(/\/+$/, ''), apiKey }).responses(model);
  }
  if (provider === 'bedrock') {
    const { AWS_REGION: region, AWS_ACCESS_KEY_ID: accessKeyId, AWS_SECRET_ACCESS_KEY: secretAccessKey } = env;
    if (!region || !accessKeyId || !secretAccessKey) throw new ConfigMissingError('bedrock');
    return createAmazonBedrock({ region, accessKeyId, secretAccessKey })(model);
  }
  throw new ConfigMissingError('AI_PROVIDER');
}
