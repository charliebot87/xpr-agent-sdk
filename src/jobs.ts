/**
 * Job lifecycle management for XPR agents.
 * 
 * Job states:
 * CREATED(0) → FUNDED(1) → ACCEPTED(2) → ACTIVE(3) → DELIVERED(4) → COMPLETED(6)
 *                                                   ↘ DISPUTED(5) → ARBITRATED(8)
 *          ↘ REFUNDED(7)                                           ↘ COMPLETED(6)
 */

import { ChainClient } from './chain.js';

export type JobState = 
  | 'created' | 'funded' | 'accepted' | 'active' 
  | 'delivered' | 'disputed' | 'completed' | 'refunded' | 'arbitrated';

const STATE_MAP: Record<number, JobState> = {
  0: 'created', 1: 'funded', 2: 'accepted', 3: 'active',
  4: 'delivered', 5: 'disputed', 6: 'completed', 7: 'refunded', 8: 'arbitrated',
};

export interface Job {
  id: number;
  client: string;
  agent: string;
  title: string;
  description: string;
  deliverables: string;
  amount: string;
  deadline: number;
  state: JobState;
  stateRaw: number;
  createdAt: number;
}

export interface Bid {
  id: number;
  job_id: number;
  agent: string;
  amount: string;
  proposal: string;
  timeline: number;
  timestamp: number;
}

export interface Milestone {
  id: number;
  job_id: number;
  title: string;
  description: string;
  amount: string;
  status: string;
}

export class JobManager {
  private chain: ChainClient;
  private account: string;

  constructor(chain: ChainClient, account: string) {
    this.chain = chain;
    this.account = account;
  }

  /**
   * List open jobs available for bidding.
   */
  async listOpenJobs(limit = 20): Promise<Job[]> {
    const rows = await this.chain.getTableRows(
      'agents', 'agents', 'jobs',
      { limit }
    );
    return rows
      .filter((r: Record<string, unknown>) => r.state === 1) // FUNDED = open for bids
      .map(this.parseJob);
  }

  /**
   * List jobs assigned to this agent.
   */
  async listMyJobs(state?: JobState): Promise<Job[]> {
    const rows = await this.chain.getTableRows(
      'agents', 'agents', 'jobs',
      { limit: 100 }
    );
    return rows
      .filter((r: Record<string, unknown>) => r.agent === this.account)
      .filter((r: Record<string, unknown>) => !state || STATE_MAP[r.state as number] === state)
      .map(this.parseJob);
  }

  /**
   * Submit a bid on an open job.
   */
  async submitBid(jobId: number, amount: string, proposal: string, timeline: number): Promise<string> {
    return this.chain.transact([{
      account: 'agents',
      name: 'submitbid',
      authorization: [{ actor: this.account, permission: 'active' }],
      data: {
        agent: this.account,
        job_id: jobId,
        amount,
        proposal,
        timeline,
      },
    }]);
  }

  /**
   * Accept a job that's been assigned to you.
   */
  async acceptJob(jobId: number): Promise<string> {
    return this.chain.transact([{
      account: 'agents',
      name: 'acceptjob',
      authorization: [{ actor: this.account, permission: 'active' }],
      data: {
        agent: this.account,
        job_id: jobId,
      },
    }]);
  }

  /**
   * Start working on an accepted job.
   */
  async startJob(jobId: number): Promise<string> {
    return this.chain.transact([{
      account: 'agents',
      name: 'startjob',
      authorization: [{ actor: this.account, permission: 'active' }],
      data: {
        agent: this.account,
        job_id: jobId,
      },
    }]);
  }

  /**
   * Deliver completed work for a job.
   */
  async deliverJob(jobId: number, evidenceUri: string, notes: string = ''): Promise<string> {
    return this.chain.transact([{
      account: 'agents',
      name: 'deliverjob',
      authorization: [{ actor: this.account, permission: 'active' }],
      data: {
        agent: this.account,
        job_id: jobId,
        evidence_uri: evidenceUri,
        notes,
      },
    }]);
  }

  /**
   * List bids on a specific job.
   */
  async listBids(jobId: number): Promise<Bid[]> {
    const rows = await this.chain.getTableRows(
      'agents', 'agents', 'bids',
      { limit: 50 }
    );
    return rows.filter((r: Record<string, unknown>) => r.job_id === jobId) as unknown as Bid[];
  }

  private parseJob(row: Record<string, unknown>): Job {
    return {
      id: row.id as number,
      client: row.client as string,
      agent: row.agent as string,
      title: row.title as string,
      description: row.description as string,
      deliverables: row.deliverables as string,
      amount: row.amount as string,
      deadline: row.deadline as number,
      state: STATE_MAP[(row.state as number) || 0] || 'created',
      stateRaw: row.state as number,
      createdAt: row.created_at as number,
    };
  }
}
