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
export declare class A2AClient {
    private chain;
    private account;
    constructor(chain: ChainClient, account: string);
    /**
     * Discover another agent's capabilities.
     */
    discover(targetAgent: string): Promise<AgentCapability | null>;
    /**
     * Send a task to another agent via A2A protocol.
     */
    sendTask(targetAgent: string, taskType: string, payload: Record<string, unknown>): Promise<string>;
    /**
     * Get the status of a previously sent task.
     */
    getTask(targetAgent: string, taskId: string): Promise<A2ATask | null>;
    /**
     * Delegate a sub-task from an escrow job to another agent.
     */
    delegateJob(targetAgent: string, jobId: number, description: string, budget: string): Promise<string>;
    /**
     * Search for agents with specific capabilities.
     */
    searchAgents(capability?: string, minTrust?: number): Promise<AgentCapability[]>;
}
//# sourceMappingURL=a2a.d.ts.map