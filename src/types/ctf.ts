export interface CTFChallenge {
  id: string;
  name: string;
  category: 'RSA' | 'AES' | 'ECDSA' | 'Hash' | 'Classical' | 'Misc';
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Expert';
  description: string;
  points: number;
  solved: boolean;
}

export interface RSAChallenge {
  n: string;
  e: string;
  c: string;
  p?: string;
  q?: string;
  d?: string;
  phi?: string;
}

export interface AESChallenge {
  ciphertext: string;
  key?: string;
  iv?: string;
  mode: 'ECB' | 'CBC' | 'CTR' | 'GCM';
  padding?: 'PKCS7' | 'None';
}

export interface ECDSAChallenge {
  publicKey: string;
  signature: string;
  message: string;
  curve: 'secp256k1' | 'secp256r1' | 'secp384r1';
}

export interface HashChallenge {
  hash: string;
  algorithm: 'MD5' | 'SHA1' | 'SHA256' | 'SHA512';
  salt?: string;
  iterations?: number;
}

export interface ClassicalChallenge {
  ciphertext: string;
  cipher: 'Caesar' | 'Vigenere' | 'Playfair' | 'Rail Fence' | 'Substitution';
  key?: string;
}

export interface CTFSolution {
  challengeId: string;
  solution: string;
  method: string;
  steps: string[];
  timeToSolve: number;
  flag?: string;
}

export interface AttackResult {
  success: boolean;
  result?: any;
  error?: string;
  method: string;
  timeElapsed: number;
}

export interface FrequencyAnalysis {
  frequencies: { [char: string]: number };
  mostCommon: string[];
  indexOfCoincidence: number;
  possibleLanguage: string;
}

export interface RSAFactorization {
  n: bigint;
  factors: bigint[];
  method: 'trial_division' | 'pollard_rho' | 'quadratic_sieve' | 'fermat';
  timeElapsed: number;
}

export interface CryptoAttack {
  name: string;
  description: string;
  category: string;
  difficulty: string;
  requirements: string[];
  execute: (params: any) => Promise<AttackResult>;
}