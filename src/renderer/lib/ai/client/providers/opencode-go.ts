import { OpenAIProvider } from './openai-runtime';
import { defaultAgentProviderModel } from '../../../agent/runtime/agent-provider-contract';
import { platform } from '../../../../platform';

/** The OpenCode Go subscription's OpenAI-compatible endpoint. */
export const OPENCODE_GO_BASE_URL = 'https://opencode.ai/zen/go/v1';

export interface OpenCodeGoProviderConfig {
  apiKey: string;
  defaultModel?: string;
}

/**
 * The endpoint sends no CORS headers (its preflight answers 404) and refuses
 * a request without an `x-opencode-session` routing id, so the request leaves
 * from native code. The native side injects the bearer and the session; the
 * SDK still sees an ordinary `fetch` returning a streaming `Response`.
 */
const nativeCompletionFetch: typeof globalThis.fetch = async (input, init) => {
  void input;
  const body = typeof init?.body === 'string' ? init.body : '';
  const signal = init?.signal ?? new AbortController().signal;
  return platform.byokCompletion.request(body, signal, 'opencode_go');
};

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
      sendCompletionCap: false,
      fetch: nativeCompletionFetch,
    });
  }
}
