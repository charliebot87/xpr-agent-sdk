/**
 * Job lifecycle management for XPR agents.
 *
 * Job states:
 * CREATED(0) → FUNDED(1) → ACCEPTED(2) → ACTIVE(3) → DELIVERED(4) → COMPLETED(6)
 *                                                   ↘ DISPUTED(5) → ARBITRATED(8)
 *          ↘ REFUNDED(7)                                           ↘ COMPLETED(6)
 */
import { ChainClient } from './chain.js';
export type JobState = 'created' | 'funded' | 'accepted' | 'active' | 'delivered' | 'disputed' | 'completed' | 'refunded' | 'arbitrated';
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
export declare class JobManager {
    private chain;
    private account;
    constructor(chain: ChainClient, account: string);
    /**
     * List open jobs available for bidding.
     */
    listOpenJobs(limit?: number): Promise<Job[]>;
    /**
     * List jobs assigned to this agent.
     */
    listMyJobs(state?: JobState): Promise<Job[]>;
    /**
     * Submit a bid on an open job.
     */
    submitBid(jobId: number, amount: string, proposal: string, timeline: number): Promise<string>;
    /**
     * Accept a job that's been assigned to you.
     */
    acceptJob(jobId: number): Promise<string>;
    /**
     * Start working on an accepted job.
     */
    startJob(jobId: number): Promise<string>;
    /**
     * Deliver completed work for a job.
     */
    deliverJob(jobId: number, evidenceUri: string, notes?: string): Promise<string>;
    /**
     * List bids on a specific job.
     */
    listBids(jobId: number): Promise<Bid[]>;
    private parseJob;
}
//# sourceMappingURL=jobs.d.ts.map