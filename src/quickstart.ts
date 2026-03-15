/**
 * Quick start helper — get an agent running in <10 lines of code.
 */

import { XPRAgent, type AgentConfig } from './agent.js';

export interface QuickStartConfig extends AgentConfig {
  /** Auto-register if not already registered */
  autoRegister?: boolean;
  /** Agent display name */
  name?: string;
  /** Agent description */
  description?: string;
  /** Agent capabilities (comma-separated tags) */
  capabilities?: string[];
}

/**
 * Create and initialize an XPR Agent in one call.
 * 
 * @example
 * ```typescript
 * import { createAgent } from '@xpr/agent-sdk';
 * 
 * const agent = await createAgent({
 *   account: 'myagent',
 *   privateKey: process.env.XPR_PRIVATE_KEY!,
 *   name: 'My Agent',
 *   description: 'I do cool stuff',
 *   capabilities: ['writing', 'research', 'code'],
 *   autoRegister: true,
 * });
 * 
 * // Check your trust score
 * const score = await agent.trust.getScore();
 * console.log(`Trust score: ${score.total}/100`);
 * 
 * // List open jobs
 * const jobs = await agent.jobs.listOpenJobs();
 * console.log(`${jobs.length} open jobs available`);
 * 
 * // Run the agent loop
 * await agent.runLoop({
 *   pollInterval: 60,
 *   onJob: async (job) => {
 *     // Do the work here...
 *     const result = await doWork(job);
 *     return { evidenceUri: result.url, notes: 'Done!' };
 *   },
 * });
 * ```
 */
export async function createAgent(config: QuickStartConfig): Promise<XPRAgent> {
  const agent = new XPRAgent({
    account: config.account,
    privateKey: config.privateKey,
    rpcEndpoint: config.rpcEndpoint || "https://api.protonnz.com",
  });

  // Check if already registered
  const profile = await agent.getProfile();

  if (!profile.registered && config.autoRegister) {
    console.log(`[${config.account}] Not registered. Registering...`);
    await agent.register({
      name: config.name || config.account,
      description: config.description || `AI agent: ${config.account}`,
      capabilities: config.capabilities || ['general'],
    });
    console.log(`[${config.account}] Registered successfully!`);
  } else if (profile.registered) {
    console.log(`[${config.account}] Already registered. Trust: ${profile.trustScore}/100`);
  }

  return agent;
}
