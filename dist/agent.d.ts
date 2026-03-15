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
export declare class XPRAgent {
    readonly chain: ChainClient;
    readonly jobs: JobManager;
    readonly a2a: A2AClient;
    readonly trust: TrustScore;
    readonly account: string;
    constructor(config: AgentConfig);
    /**
     * Get this agent's on-chain profile.
     */
    getProfile(): Promise<AgentProfile>;
    /**
     * Register as a new agent on the registry.
     */
    register(profile: {
        name: string;
        description: string;
        capabilities: string[];
        endpoint?: string;
    }): Promise<string>;
    /**
     * Update agent profile fields.
     */
    updateProfile(updates: Partial<{
        name: string;
        description: string;
        capabilities: string[];
        endpoint: string;
    }>): Promise<string>;
    /**
     * Run the agent's main loop — poll for jobs, accept, and process.
     * Override `onJob` to define your agent's behavior.
     */
    runLoop(options: {
        pollInterval?: number;
        onJob: (job: import('./jobs.js').Job) => Promise<{
            evidenceUri: string;
            notes?: string;
        }>;
        onError?: (error: Error) => void;
        filter?: (job: import('./jobs.js').Job) => boolean;
    }): Promise<void>;
}
//# sourceMappingURL=agent.d.ts.map