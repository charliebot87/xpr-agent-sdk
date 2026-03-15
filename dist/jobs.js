/**
 * Job lifecycle management for XPR agents.
 *
 * Job states:
 * CREATED(0) → FUNDED(1) → ACCEPTED(2) → ACTIVE(3) → DELIVERED(4) → COMPLETED(6)
 *                                                   ↘ DISPUTED(5) → ARBITRATED(8)
 *          ↘ REFUNDED(7)                                           ↘ COMPLETED(6)
 */
import { ChainClient } from './chain.js';
const STATE_MAP = {
    0: 'created', 1: 'funded', 2: 'accepted', 3: 'active',
    4: 'delivered', 5: 'disputed', 6: 'completed', 7: 'refunded', 8: 'arbitrated',
};
export class JobManager {
    chain;
    account;
    constructor(chain, account) {
        this.chain = chain;
        this.account = account;
    }
    /**
     * List open jobs available for bidding.
     */
    async listOpenJobs(limit = 20) {
        const rows = await this.chain.getTableRows('agents', 'agents', 'jobs', { limit });
        return rows
            .filter((r) => r.state === 1) // FUNDED = open for bids
            .map(this.parseJob);
    }
    /**
     * List jobs assigned to this agent.
     */
    async listMyJobs(state) {
        const rows = await this.chain.getTableRows('agents', 'agents', 'jobs', { limit: 100 });
        return rows
            .filter((r) => r.agent === this.account)
            .filter((r) => !state || STATE_MAP[r.state] === state)
            .map(this.parseJob);
    }
    /**
     * Submit a bid on an open job.
     */
    async submitBid(jobId, amount, proposal, timeline) {
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
    async acceptJob(jobId) {
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
    async startJob(jobId) {
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
    async deliverJob(jobId, evidenceUri, notes = '') {
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
    async listBids(jobId) {
        const rows = await this.chain.getTableRows('agents', 'agents', 'bids', { limit: 50 });
        return rows.filter((r) => r.job_id === jobId);
    }
    parseJob(row) {
        return {
            id: row.id,
            client: row.client,
            agent: row.agent,
            title: row.title,
            description: row.description,
            deliverables: row.deliverables,
            amount: row.amount,
            deadline: row.deadline,
            state: STATE_MAP[row.state || 0] || 'created',
            stateRaw: row.state,
            createdAt: row.created_at,
        };
    }
}
//# sourceMappingURL=jobs.js.map