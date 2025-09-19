export interface BlockchainTransaction {
  hash: string;
  version: number;
  lockTime: number;
  inputs: TransactionInput[];
  outputs: TransactionOutput[];
  size: number;
  weight: number;
  fee: number;
  confirmations: number;
  blockHash?: string;
  blockHeight?: number;
  timestamp?: number;
}

export interface TransactionInput {
  previousTxHash: string;
  previousTxIndex: number;
  scriptSig: string;
  sequence: number;
  witness?: string[];
  value?: number;
  address?: string;
}

export interface TransactionOutput {
  value: number;
  scriptPubKey: string;
  address?: string;
  type: 'P2PKH' | 'P2SH' | 'P2WPKH' | 'P2WSH' | 'P2TR' | 'OP_RETURN';
}

export interface Block {
  hash: string;
  height: number;
  version: number;
  previousBlockHash: string;
  merkleRoot: string;
  timestamp: number;
  bits: string;
  nonce: number;
  difficulty: number;
  size: number;
  weight: number;
  transactionCount: number;
  transactions: BlockchainTransaction[];
}

export interface Address {
  address: string;
  balance: number;
  totalReceived: number;
  totalSent: number;
  transactionCount: number;
  unconfirmedBalance: number;
  firstSeen?: number;
  lastSeen?: number;
}

export interface UTXO {
  txHash: string;
  outputIndex: number;
  value: number;
  address: string;
  scriptPubKey: string;
  confirmations: number;
  spendable: boolean;
}

export interface BlockchainStats {
  blockHeight: number;
  difficulty: number;
  hashRate: number;
  totalSupply: number;
  circulatingSupply: number;
  marketCap?: number;
  price?: number;
  memPoolSize: number;
  averageBlockTime: number;
}

export interface NetworkInfo {
  network: 'mainnet' | 'testnet' | 'regtest';
  version: string;
  protocolVersion: number;
  connections: number;
  blocks: number;
  timeOffset: number;
  warnings: string[];
}

export interface MempoolTransaction {
  txid: string;
  size: number;
  fee: number;
  feeRate: number;
  time: number;
  height: number;
  descendantCount: number;
  descendantSize: number;
  descendantFees: number;
  ancestorCount: number;
  ancestorSize: number;
  ancestorFees: number;
}

export interface BlockchainAnalysis {
  transactionFlow: TransactionFlow[];
  addressClustering: AddressCluster[];
  riskAssessment: RiskAssessment;
  complianceFlags: ComplianceFlag[];
}

export interface TransactionFlow {
  fromAddress: string;
  toAddress: string;
  value: number;
  txHash: string;
  timestamp: number;
  hops: number;
}

export interface AddressCluster {
  clusterId: string;
  addresses: string[];
  totalBalance: number;
  transactionCount: number;
  riskScore: number;
  labels: string[];
}

export interface RiskAssessment {
  riskScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  factors: RiskFactor[];
  recommendations: string[];
}

export interface RiskFactor {
  type: string;
  description: string;
  severity: number;
  evidence: string[];
}

export interface ComplianceFlag {
  type: 'AML' | 'SANCTIONS' | 'SUSPICIOUS_ACTIVITY' | 'HIGH_RISK_JURISDICTION';
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  details: string;
}

export interface ChainAnalysisResult {
  summary: {
    totalTransactions: number;
    totalValue: number;
    uniqueAddresses: number;
    timeRange: {
      start: number;
      end: number;
    };
  };
  patterns: PatternDetection[];
  anomalies: AnomalyDetection[];
  compliance: ComplianceAnalysis;
}

export interface PatternDetection {
  type: 'MIXING' | 'TUMBLING' | 'EXCHANGE' | 'GAMBLING' | 'MINING' | 'HOARDING';
  confidence: number;
  description: string;
  transactions: string[];
  addresses: string[];
}

export interface AnomalyDetection {
  type: 'UNUSUAL_AMOUNT' | 'RAPID_SUCCESSION' | 'ROUND_NUMBERS' | 'TIME_PATTERN';
  score: number;
  description: string;
  evidence: any;
}

export interface ComplianceAnalysis {
  amlRisk: number;
  sanctionsRisk: number;
  jurisdictionRisk: number;
  overallCompliance: 'COMPLIANT' | 'SUSPICIOUS' | 'HIGH_RISK';
  recommendations: string[];
}