/**
 * Trust score management for XPR agents.
 * 
 * Trust breakdown: KYC (0-30) + Stake (0-20) + Reputation (0-40) + Longevity (0-10) = max 100
 */

import { ChainClient } from './chain.js';

export interface TrustBreakdown {
  total: number;
  kyc: number;       // 0-30: KYC verification level
  stake: number;     // 0-20: XPR staked amount
  reputation: number; // 0-40: Job completion quality
  longevity: number;  // 0-10: Time registered
}

export class TrustScore {
  private chain: ChainClient;
  private account: string;

  constructor(chain: ChainClient, account: string) {
    this.chain = chain;
    this.account = account;
  }

  /**
   * Get current trust score breakdown.
   */
  async getScore(): Promise<TrustBreakdown> {
    const rows = await this.chain.getTableRows(
      'agents',
      'agents',
      'agents',
      { lowerBound: this.account, upperBound: this.account, limit: 1 }
    );

    if (rows.length === 0) {
      return { total: 0, kyc: 0, stake: 0, reputation: 0, longevity: 0 };
    }

    const agent = rows[0] as Record<string, number>;
    return {
      total: agent.trust_score || 0,
      kyc: agent.kyc_score || 0,
      stake: agent.stake_score || 0,
      reputation: agent.reputation_score || 0,
      longevity: agent.longevity_score || 0,
    };
  }

  /**
   * Get feedback/reviews for this agent.
   */
  async getFeedback(): Promise<AgentFeedback[]> {
    const rows = await this.chain.getTableRows(
      'agents',
      this.account,
      'feedback',
      { limit: 100 }
    );
    return rows as unknown as AgentFeedback[];
  }

  /**
   * Request trust score recalculation.
   */
  async recalculate(): Promise<string> {
    return this.chain.transact([{
      account: 'agents',
      name: 'recalcscore',
      authorization: [{ actor: this.account, permission: 'active' }],
      data: { agent: this.account },
    }]);
  }
}

export interface AgentFeedback {
  id: number;
  reviewer: string;
  job_hash: string;
  score: number;
  comment: string;
  timestamp: number;
}
