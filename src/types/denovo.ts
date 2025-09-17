export interface DenovoTransaction {
  txid: string;
  version: number;
  locktime: number;
  inputs: DenovoInput[];
  outputs: DenovoOutput[];
  size: number;
  weight: number;
  fee?: number;
}

export interface DenovoInput {
  txid: string;
  vout: number;
  scriptSig: string;
  sequence: number;
  witness?: string[];
  prevout?: {
    scriptPubKey: string;
    value: number;
  };
}

export interface DenovoOutput {
  value: number;
  scriptPubKey: string;
  address?: string;
}

export interface DenovoSignature {
  txid: string;
  inputIndex: number;
  r: string;
  s: string;
  z: string;
  publicKey: string;
  address: string;
  scriptType: 'P2PKH' | 'P2PK' | 'P2SH' | 'P2WPKH' | 'P2WSH' | 'P2TR';
  sigHashType: number;
  isLowS: boolean;
  isDER: boolean;
}

export interface DenovoVulnerability {
  type: 'DUPLICATE_NONCE' | 'WEAK_NONCE' | 'BIASED_NONCE' | 'LOW_S_NOT_ENFORCED' | 'MALLEABLE_SIGNATURE';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  affectedSignatures: DenovoSignature[];
  exploitability: string;
  recommendation: string;
}

export interface DenovoAnalysisResult {
  transaction: DenovoTransaction;
  signatures: DenovoSignature[];
  vulnerabilities: DenovoVulnerability[];
  riskScore: number;
  analysisTime: number;
}

export interface DenovoBatchResult {
  totalTransactions: number;
  analyzedTransactions: number;
  totalVulnerabilities: number;
  vulnerabilityBreakdown: Record<string, number>;
  riskDistribution: Record<string, number>;
  processingTime: number;
}

export interface DenovoConfig {
  enableWeakNonceDetection: boolean;
  enableBiasedNonceDetection: boolean;
  enableMalleabilityCheck: boolean;
  enableLowSCheck: boolean;
  batchSize: number;
  timeoutMs: number;
}