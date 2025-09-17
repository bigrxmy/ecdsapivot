export interface TransactionInput {
  txid: string;
  vout: number;
  scriptSig: {
    asm: string;
    hex: string;
  };
}

export interface TransactionOutput {
  value: number;
  scriptPubKey: {
    asm: string;
    hex: string;
    type: string;
    addresses?: string[];
  };
}

export interface Transaction {
  txid: string;
  version: number;
  locktime: number;
  vin: TransactionInput[];
  vout: TransactionOutput[];
  hex: string;
}

export interface ECDSASignature {
  txid: string;
  inputIndex: number;
  r: string;
  s: string;
  z: string; // message hash
  publicKey: string;
  x: string; // x coordinate of public key
}

export interface DuplicateNonce {
  r: string;
  signatures: ECDSASignature[];
}

export interface AnalysisResult {
  type: 'signature' | 'duplicate' | 'recovery' | 'error';
  timestamp: number;
  data: any;
  message: string;
}

export interface PrivateKeyResult {
  privateKey: string;
  publicKey: string;
  address?: string;
  type: 'nonce' | 'private';
}