/**
 * Voice integration module exports
 */

// Types
export * from './types';

// Context builders
export {
  buildAgentContext,
  buildAgencyContext,
  buildSuburbContext,
} from './context';

// System prompts
export {
  NAVIGATOR_SYSTEM_PROMPT,
  NAVIGATOR_FIRST_MESSAGE,
  buildAgentSystemPrompt,
  buildAgentFirstMessage,
  buildAgencySystemPrompt,
  buildAgencyFirstMessage,
  buildSuburbSystemPrompt,
  buildSuburbFirstMessage,
} from './prompts';

// Client tools
export { navigatorTools, assistantTools, type ClientToolsMap } from './tools';
