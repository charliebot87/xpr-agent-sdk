/**
 * Agent-to-Agent (A2A) communication client.
 * Allows agents to discover each other, send tasks, and delegate work.
 */

import { ChainClient } from './chain.js';

export interface A2AMessage {
  from: string;
  to: string;
  task_type: string;
  payload: Record<string, unknown>;
  timestamp: number;
}

export interface A2ATask {
  id: string;
  from: string;
  to: string;
  type: string;
  status: 'pending' | 'accepted' | 'working' | 'completed' | 'failed' | 'cancelled';
  payload: Record<string, unknown>;
  result?: Record<string, unknown>;
  createdAt: number;
  updatedAt: number;
}

export interface AgentCapability {
  account: string;
  name: string;
  description: string;
  capabilities: string[];
  endpoint: string;
  trustScore: number;
}

export class A2AClient {
  private chain: ChainClient;
  private account: string;

  constructor(chain: ChainClient, account: string) {
    this.chain = chain;
    this.account = account;
  }

  /**
   * Discover another agent's capabilities.
   */
  async discover(targetAgent: string): Promise<AgentCapability | null> {
    const rows = await this.chain.getTableRows(
      'agents', 'agents', 'agents',
      { lowerBound: targetAgent, upperBound: targetAgent, limit: 1 }
    );
    
    if (rows.length === 0) return null;

    const agent = rows[0] as Record<string, unknown>;
    return {
      account: agent.account as string,
      name: agent.name as string,
      description: agent.description as string,
      capabilities: ((agent.capabilities as string) || '').split(',').map(s => s.trim()),
      endpoint: agent.endpoint as string,
      trustScore: agent.trust_score as number,
    };
  }

  /**
   * Send a task to another agent via A2A protocol.
   */
  async sendTask(
    targetAgent: string,
    taskType: string,
    payload: Record<string, unknown>
  ): Promise<string> {
    // Discover target first to get their endpoint
    const target = await this.discover(targetAgent);
    if (!target) throw new Error(`Agent ${targetAgent} not found in registry`);
    if (!target.endpoint) throw new Error(`Agent ${targetAgent} has no A2A endpoint`);

    // Send via their A2A endpoint
    const res = await fetch(`${target.endpoint}/a2a/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Agent-Account': this.account,
      },
      body: JSON.stringify({
        from: this.account,
        type: taskType,
        payload,
      }),
    });

    if (!res.ok) throw new Error(`A2A send failed: ${res.status}`);
    const data = await res.json();
    return data.task_id;
  }

  /**
   * Get the status of a previously sent task.
   */
  async getTask(targetAgent: string, taskId: string): Promise<A2ATask | null> {
    const target = await this.discover(targetAgent);
    if (!target?.endpoint) return null;

    const res = await fetch(`${target.endpoint}/a2a/tasks/${taskId}`, {
      headers: { 'X-Agent-Account': this.account },
    });

    if (!res.ok) return null;
    return res.json();
  }

  /**
   * Delegate a sub-task from an escrow job to another agent.
   */
  async delegateJob(
    targetAgent: string,
    jobId: number,
    description: string,
    budget: string
  ): Promise<string> {
    return this.chain.transact([{
      account: 'agents',
      name: 'delegatejob',
      authorization: [{ actor: this.account, permission: 'active' }],
      data: {
        from_agent: this.account,
        to_agent: targetAgent,
        job_id: jobId,
        description,
        budget,
      },
    }]);
  }

  /**
   * Search for agents with specific capabilities.
   */
  async searchAgents(capability?: string, minTrust?: number): Promise<AgentCapability[]> {
    const rows = await this.chain.getTableRows(
      'agents', 'agents', 'agents',
      { limit: 100 }
    );

    return rows
      .map((r: Record<string, unknown>) => ({
        account: r.account as string,
        name: r.name as string,
        description: r.description as string,
        capabilities: ((r.capabilities as string) || '').split(',').map(s => s.trim()),
        endpoint: r.endpoint as string,
        trustScore: r.trust_score as number,
      }))
      .filter(a => !minTrust || a.trustScore >= minTrust)
      .filter(a => !capability || a.capabilities.some(c => c.toLowerCase().includes(capability.toLowerCase())));
  }
}
