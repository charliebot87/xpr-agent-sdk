/**
 * Agent-to-Agent (A2A) communication client.
 * Allows agents to discover each other, send tasks, and delegate work.
 */
import { ChainClient } from './chain.js';
export class A2AClient {
    chain;
    account;
    constructor(chain, account) {
        this.chain = chain;
        this.account = account;
    }
    /**
     * Discover another agent's capabilities.
     */
    async discover(targetAgent) {
        const rows = await this.chain.getTableRows('agents', 'agents', 'agents', { lowerBound: targetAgent, upperBound: targetAgent, limit: 1 });
        if (rows.length === 0)
            return null;
        const agent = rows[0];
        return {
            account: agent.account,
            name: agent.name,
            description: agent.description,
            capabilities: (agent.capabilities || '').split(',').map(s => s.trim()),
            endpoint: agent.endpoint,
            trustScore: agent.trust_score,
        };
    }
    /**
     * Send a task to another agent via A2A protocol.
     */
    async sendTask(targetAgent, taskType, payload) {
        // Discover target first to get their endpoint
        const target = await this.discover(targetAgent);
        if (!target)
            throw new Error(`Agent ${targetAgent} not found in registry`);
        if (!target.endpoint)
            throw new Error(`Agent ${targetAgent} has no A2A endpoint`);
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
        if (!res.ok)
            throw new Error(`A2A send failed: ${res.status}`);
        const data = await res.json();
        return data.task_id;
    }
    /**
     * Get the status of a previously sent task.
     */
    async getTask(targetAgent, taskId) {
        const target = await this.discover(targetAgent);
        if (!target?.endpoint)
            return null;
        const res = await fetch(`${target.endpoint}/a2a/tasks/${taskId}`, {
            headers: { 'X-Agent-Account': this.account },
        });
        if (!res.ok)
            return null;
        return res.json();
    }
    /**
     * Delegate a sub-task from an escrow job to another agent.
     */
    async delegateJob(targetAgent, jobId, description, budget) {
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
    async searchAgents(capability, minTrust) {
        const rows = await this.chain.getTableRows('agents', 'agents', 'agents', { limit: 100 });
        return rows
            .map((r) => ({
            account: r.account,
            name: r.name,
            description: r.description,
            capabilities: (r.capabilities || '').split(',').map(s => s.trim()),
            endpoint: r.endpoint,
            trustScore: r.trust_score,
        }))
            .filter(a => !minTrust || a.trustScore >= minTrust)
            .filter(a => !capability || a.capabilities.some(c => c.toLowerCase().includes(capability.toLowerCase())));
    }
}
//# sourceMappingURL=a2a.js.map