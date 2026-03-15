/**
 * Main XPR Agent class.
 * Provides a high-level interface for operating as an AI agent on XPR Network.
 */

import { ChainClient } from './chain.js';
import { JobManager } from './jobs.js';
import { A2AClient } from './a2a.js';
import { TrustScore } from './trust.js';

export interface AgentConfig {
  /** Your XPR Network account name */
  account: string;
  /** Private key for signing transactions */
  privateKey: string;
  /** RPC endpoint (default: https://api.protonnz.com) */
  rpcEndpoint?: string;
}

export interface AgentProfile {
  account: string;
  name: string;
  description: string;
  capabilities: string[];
  endpoint: string;
  trustScore: number;
  registered: boolean;
}

export class XPRAgent {
  readonly chain: ChainClient;
  readonly jobs: JobManager;
  readonly a2a: A2AClient;
  readonly trust: TrustScore;
  readonly account: string;

  constructor(config: AgentConfig) {
    this.account = config.account;
    this.chain = new ChainClient({
      rpcEndpoint: config.rpcEndpoint || 'https://api.protonnz.com',
      account: config.account,
      privateKey: config.privateKey,
    });
    this.jobs = new JobManager(this.chain, config.account);
    this.a2a = new A2AClient(this.chain, config.account);
    this.trust = new TrustScore(this.chain, config.account);
  }

  /**
   * Get this agent's on-chain profile.
   */
  async getProfile(): Promise<AgentProfile> {
    const rows = await this.chain.getTableRows(
      'agents', 'agents', 'agents',
      { lowerBound: this.account, upperBound: this.account, limit: 1 }
    );

    if (rows.length === 0) {
      return {
        account: this.account,
        name: '',
        description: '',
        capabilities: [],
        endpoint: '',
        trustScore: 0,
        registered: false,
      };
    }

    const agent = rows[0] as Record<string, unknown>;
    return {
      account: agent.account as string,
      name: agent.name as string,
      description: agent.description as string,
      capabilities: ((agent.capabilities as string) || '').split(',').map(s => s.trim()),
      endpoint: agent.endpoint as string,
      trustScore: agent.trust_score as number,
      registered: true,
    };
  }

  /**
   * Register as a new agent on the registry.
   */
  async register(profile: {
    name: string;
    description: string;
    capabilities: string[];
    endpoint?: string;
  }): Promise<string> {
    return this.chain.transact([{
      account: 'agents',
      name: 'regagent',
      authorization: [{ actor: this.account, permission: 'active' }],
      data: {
        account: this.account,
        name: profile.name,
        description: profile.description,
        capabilities: profile.capabilities.join(','),
        endpoint: profile.endpoint || '',
      },
    }]);
  }

  /**
   * Update agent profile fields.
   */
  async updateProfile(updates: Partial<{
    name: string;
    description: string;
    capabilities: string[];
    endpoint: string;
  }>): Promise<string> {
    const data: Record<string, unknown> = { agent: this.account };
    if (updates.name !== undefined) data.name = updates.name;
    if (updates.description !== undefined) data.description = updates.description;
    if (updates.capabilities !== undefined) data.capabilities = updates.capabilities.join(',');
    if (updates.endpoint !== undefined) data.endpoint = updates.endpoint;

    return this.chain.transact([{
      account: 'agents',
      name: 'updateagent',
      authorization: [{ actor: this.account, permission: 'active' }],
      data,
    }]);
  }

  /**
   * Run the agent's main loop — poll for jobs, accept, and process.
   * Override `onJob` to define your agent's behavior.
   */
  async runLoop(options: {
    pollInterval?: number; // seconds between polls (default: 60)
    onJob: (job: import('./jobs.js').Job) => Promise<{ evidenceUri: string; notes?: string }>;
    onError?: (error: Error) => void;
    filter?: (job: import('./jobs.js').Job) => boolean;
  }): Promise<void> {
    const interval = (options.pollInterval || 60) * 1000;

    console.log(`[${this.account}] Agent loop started, polling every ${interval / 1000}s`);

    while (true) {
      try {
        // Check for funded jobs assigned to us
        const myJobs = await this.jobs.listMyJobs('funded');
        for (const job of myJobs) {
          if (options.filter && !options.filter(job)) continue;

          console.log(`[${this.account}] Processing job #${job.id}: ${job.title}`);
          try {
            await this.jobs.acceptJob(job.id);
            await this.jobs.startJob(job.id);
            const result = await options.onJob(job);
            await this.jobs.deliverJob(job.id, result.evidenceUri, result.notes);
            console.log(`[${this.account}] Delivered job #${job.id}`);
          } catch (jobError) {
            console.error(`[${this.account}] Failed job #${job.id}:`, jobError);
            options.onError?.(jobError as Error);
          }
        }

        // Check for open jobs to bid on
        const openJobs = await this.jobs.listOpenJobs();
        for (const job of openJobs) {
          if (options.filter && !options.filter(job)) continue;
          console.log(`[${this.account}] Open job available: #${job.id} "${job.title}" (${job.amount})`);
        }
      } catch (error) {
        console.error(`[${this.account}] Loop error:`, error);
        options.onError?.(error as Error);
      }

      await new Promise(resolve => setTimeout(resolve, interval));
    }
  }
}
