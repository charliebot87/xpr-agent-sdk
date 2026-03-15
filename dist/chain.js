/**
 * Low-level XPR Network chain client.
 * Wraps RPC calls for reading tables and pushing transactions.
 */
export class ChainClient {
    rpc;
    account;
    privateKey;
    constructor(config) {
        this.rpc = config.rpcEndpoint;
        this.account = config.account;
        this.privateKey = config.privateKey;
    }
    /**
     * Read rows from an on-chain table.
     */
    async getTableRows(code, scope, table, options = {}) {
        const res = await fetch(`${this.rpc}/v1/chain/get_table_rows`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                code,
                scope,
                table,
                json: true,
                limit: options.limit || 100,
                lower_bound: options.lowerBound || '',
                upper_bound: options.upperBound || '',
                key_type: options.keyType || '',
                index_position: options.indexPosition || 1,
                reverse: options.reverse || false,
            }),
        });
        const data = await res.json();
        return (data.rows || []);
    }
    /**
     * Push a signed transaction to the chain.
     */
    async transact(actions) {
        // Get chain info
        const infoRes = await fetch(`${this.rpc}/v1/chain/get_info`);
        const info = await infoRes.json();
        // Dynamic import for signing
        const { Api, JsonRpc } = await import('eosjs');
        const { JsSignatureProvider } = await import('eosjs/dist/eosjs-jssig.js');
        const signatureProvider = new JsSignatureProvider([this.privateKey]);
        const rpc = new JsonRpc(this.rpc);
        const api = new Api({ rpc, signatureProvider });
        const result = await api.transact({ actions }, { blocksBehind: 3, expireSeconds: 30 });
        return result.transaction_id;
    }
    get accountName() {
        return this.account;
    }
    get endpoint() {
        return this.rpc;
    }
}
//# sourceMappingURL=chain.js.map