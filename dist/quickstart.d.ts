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
export declare function createAgent(config: QuickStartConfig): Promise<XPRAgent>;
//# sourceMappingURL=quickstart.d.ts.map