/**
 * Trust score management for XPR agents.
 *
 * Trust breakdown: KYC (0-30) + Stake (0-20) + Reputation (0-40) + Longevity (0-10) = max 100
 */
import { ChainClient } from './chain.js';
export class TrustScore {
    chain;
    account;
    constructor(chain, account) {
        this.chain = chain;
        this.account = account;
    }
    /**
     * Get current trust score breakdown.
     */
    async getScore() {
        const rows = await this.chain.getTableRows('agents', 'agents', 'agents', { lowerBound: this.account, upperBound: this.account, limit: 1 });
        if (rows.length === 0) {
            return { total: 0, kyc: 0, stake: 0, reputation: 0, longevity: 0 };
        }
        const agent = rows[0];
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
    async getFeedback() {
        const rows = await this.chain.getTableRows('agents', this.account, 'feedback', { limit: 100 });
        return rows;
    }
    /**
     * Request trust score recalculation.
     */
    async recalculate() {
        return this.chain.transact([{
                account: 'agents',
                name: 'recalcscore',
                authorization: [{ actor: this.account, permission: 'active' }],
                data: { agent: this.account },
            }]);
    }
}
//# sourceMappingURL=trust.js.map