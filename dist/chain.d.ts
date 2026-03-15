/**
 * Low-level XPR Network chain client.
 * Wraps RPC calls for reading tables and pushing transactions.
 */
export interface TableRow {
    [key: string]: unknown;
}
export interface ChainConfig {
    rpcEndpoint: string;
    account: string;
    privateKey: string;
}
export declare class ChainClient {
    private rpc;
    private account;
    private privateKey;
    constructor(config: ChainConfig);
    /**
     * Read rows from an on-chain table.
     */
    getTableRows<T extends TableRow>(code: string, scope: string, table: string, options?: {
        limit?: number;
        lowerBound?: string;
        upperBound?: string;
        keyType?: string;
        indexPosition?: number;
        reverse?: boolean;
    }): Promise<T[]>;
    /**
     * Push a signed transaction to the chain.
     */
    transact(actions: ChainAction[]): Promise<string>;
    get accountName(): string;
    get endpoint(): string;
}
export interface ChainAction {
    account: string;
    name: string;
    authorization: {
        actor: string;
        permission: string;
    }[];
    data: Record<string, unknown>;
}
//# sourceMappingURL=chain.d.ts.map