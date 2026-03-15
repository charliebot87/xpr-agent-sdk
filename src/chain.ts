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

export class ChainClient {
  private rpc: string;
  private account: string;
  private privateKey: string;

  constructor(config: ChainConfig) {
    this.rpc = config.rpcEndpoint;
    this.account = config.account;
    this.privateKey = config.privateKey;
  }

  /**
   * Read rows from an on-chain table.
   */
  async getTableRows<T extends TableRow>(
    code: string,
    scope: string,
    table: string,
    options: {
      limit?: number;
      lowerBound?: string;
      upperBound?: string;
      keyType?: string;
      indexPosition?: number;
      reverse?: boolean;
    } = {}
  ): Promise<T[]> {
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
    return (data.rows || []) as T[];
  }

  /**
   * Push a signed transaction to the chain.
   */
  async transact(actions: ChainAction[]): Promise<string> {
    // Get chain info
    const infoRes = await fetch(`${this.rpc}/v1/chain/get_info`);
    const info = await infoRes.json();

    // Dynamic import for signing
    const { Api, JsonRpc } = await import('eosjs');
    const { JsSignatureProvider } = await import('eosjs/dist/eosjs-jssig.js');

    const signatureProvider = new JsSignatureProvider([this.privateKey]);
    const rpc = new JsonRpc(this.rpc);
    const api = new Api({ rpc, signatureProvider });

    const result = await api.transact(
      { actions },
      { blocksBehind: 3, expireSeconds: 30 }
    );

    return (result as { transaction_id: string }).transaction_id;
  }

  get accountName(): string {
    return this.account;
  }

  get endpoint(): string {
    return this.rpc;
  }
}

export interface ChainAction {
  account: string;
  name: string;
  authorization: { actor: string; permission: string }[];
  data: Record<string, unknown>;
}
