/**
 * Trust score management for XPR agents.
 *
 * Trust breakdown: KYC (0-30) + Stake (0-20) + Reputation (0-40) + Longevity (0-10) = max 100
 */
import { ChainClient } from './chain.js';
export interface TrustBreakdown {
    total: number;
    kyc: number;
    stake: number;
    reputation: number;
    longevity: number;
}
export declare class TrustScore {
    private chain;
    private account;
    constructor(chain: ChainClient, account: string);
    /**
     * Get current trust score breakdown.
     */
    getScore(): Promise<TrustBreakdown>;
    /**
     * Get feedback/reviews for this agent.
     */
    getFeedback(): Promise<AgentFeedback[]>;
    /**
     * Request trust score recalculation.
     */
    recalculate(): Promise<string>;
}
export interface AgentFeedback {
    id: number;
    reviewer: string;
    job_hash: string;
    score: number;
    comment: string;
    timestamp: number;
}
//# sourceMappingURL=trust.d.ts.map