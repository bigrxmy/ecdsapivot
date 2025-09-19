export interface AttackConfig {
  method: 'brute_force' | 'dictionary' | 'rainbow_table' | 'birthday_attack' | 'pollard_rho' | 'baby_giant';
  target: string;
  keyspace: {
    start: string;
    end: string;
    step: string;
  };
  threads: number;
  batchSize: number;
  timeout: number;
}

export interface AttackResult {
  found: boolean;
  privateKey?: string;
  publicKey?: string;
  address?: string;
  attempts: number;
  timeElapsed: number;
  method: string;
}

export interface AttackProgress {
  current: string;
  attempts: number;
  rate: number; // keys per second
  eta: number; // estimated time remaining in seconds
  percentage: number;
}

export interface BruteForceConfig {
  startKey: string;
  endKey: string;
  targetAddress: string;
  compressed: boolean;
  threads: number;
}

export interface DictionaryAttackConfig {
  wordlist: string[];
  targetAddress: string;
  variations: boolean; // apply common variations
  compressed: boolean;
}

export interface RainbowTableConfig {
  tableFile: File | null;
  targetHash: string;
  chainLength: number;
  tableSize: number;
}

export interface BirthdayAttackConfig {
  targetBits: number;
  sampleSize: number;
  iterations: number;
}

export interface PollardRhoConfig {
  targetPublicKey: string;
  iterations: number;
  walks: number;
}

export interface BabyGiantConfig {
  targetPublicKey: string;
  babySteps: number;
  giantSteps: number;
}

export interface KeyspaceAnalysis {
  totalKeys: bigint;
  estimatedTime: number;
  difficulty: 'TRIVIAL' | 'EASY' | 'MEDIUM' | 'HARD' | 'IMPOSSIBLE';
  recommendation: string;
}

export interface AttackVector {
  name: string;
  description: string;
  complexity: string;
  successRate: number;
  estimatedTime: string;
  requirements: string[];
}