import { OpenAIProvider } from './openai-runtime';
import { defaultAgentProviderModel } from '../../../agent/runtime/agent-provider-contract';

/** The OpenCode Go subscription's OpenAI-compatible endpoint. */
export const OPENCODE_GO_BASE_URL = 'https://opencode.ai/zen/go/v1';

export interface OpenCodeGoProviderConfig {
  apiKey: string;
  defaultModel?: string;
}

/**
 * OpenCode Go speaks Chat Completions, so it reuses the OpenAI adapter. Its
 * models think by default and the endpoint takes no `reasoning_effort`, so
 * that parameter is never sent.
 */
export class OpenCodeGoProvider extends OpenAIProvider {
  constructor(config: OpenCodeGoProviderConfig) {
    super({
      apiKey: config.apiKey,
      defaultModel: config.defaultModel ?? defaultAgentProviderModel('opencode-go'),
      baseURL: OPENCODE_GO_BASE_URL,
      id: 'opencode-go',
      label: 'OpenCode Go',
      sendReasoningOff: false,
    });
  }
}
