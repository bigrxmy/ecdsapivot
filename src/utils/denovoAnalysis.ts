import { 
  DenovoTransaction, 
  DenovoSignature, 
  DenovoVulnerability, 
  DenovoAnalysisResult, 
  DenovoBatchResult, 
  DenovoConfig 
} from '../types/denovo';

// Secp256k1 curve parameters
const N = BigInt('0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141');
const HALF_N = N / 2n;

export const analyzeDenovoTransaction = async (
  txid: string, 
  config: DenovoConfig,
  signal?: AbortSignal
): Promise<DenovoAnalysisResult> => {
  const startTime = Date.now();
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  if (signal?.aborted) {
    throw new Error('Analysis aborted');
  }

  // Mock transaction data - in real implementation, this would fetch from Bitcoin RPC
  const transaction = generateMockTransaction(txid);
  const signatures = extractSignatures(transaction);
  const vulnerabilities = await detectVulnerabilities(signatures, config);
  const riskScore = calculateRiskScore(vulnerabilities);

  return {
    transaction,
    signatures,
    vulnerabilities,
    riskScore,
    analysisTime: Date.now() - startTime
  };
};

export const analyzeDenovoBatch = async (
  txids: string[],
  config: DenovoConfig,
  signal?: AbortSignal,
  onProgress?: (current: number, total: number) => void
): Promise<DenovoBatchResult> => {
  const startTime = Date.now();
  const results: DenovoAnalysisResult[] = [];
  const vulnerabilityBreakdown: Record<string, number> = {};
  const riskDistribution: Record<string, number> = { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 };

  for (let i = 0; i < txids.length; i++) {
    if (signal?.aborted) {
      throw new Error('Batch analysis aborted');
    }

    try {
      const result = await analyzeDenovoTransaction(txids[i], config, signal);
      results.push(result);

      // Update statistics
      result.vulnerabilities.forEach(vuln => {
        vulnerabilityBreakdown[vuln.type] = (vulnerabilityBreakdown[vuln.type] || 0) + 1;
        riskDistribution[vuln.severity]++;
      });

      onProgress?.(i + 1, txids.length);
      
      // Small delay to prevent overwhelming the system
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error(`Failed to analyze transaction ${txids[i]}:`, error);
    }
  }

  const totalVulnerabilities = Object.values(vulnerabilityBreakdown).reduce((sum, count) => sum + count, 0);

  return {
    totalTransactions: txids.length,
    analyzedTransactions: results.length,
    totalVulnerabilities,
    vulnerabilityBreakdown,
    riskDistribution,
    processingTime: Date.now() - startTime
  };
};

const generateMockTransaction = (txid: string): DenovoTransaction => {
  const inputCount = Math.floor(Math.random() * 3) + 1;
  const outputCount = Math.floor(Math.random() * 3) + 1;

  return {
    txid,
    version: 1,
    locktime: 0,
    inputs: Array.from({ length: inputCount }, (_, i) => ({
      txid: generateRandomHex(64),
      vout: i,
      scriptSig: generateRandomHex(Math.floor(Math.random() * 200) + 100),
      sequence: 0xffffffff,
      witness: Math.random() > 0.5 ? [generateRandomHex(144), generateRandomHex(66)] : undefined,
      prevout: {
        scriptPubKey: generateRandomHex(50),
        value: Math.floor(Math.random() * 1000000) + 10000
      }
    })),
    outputs: Array.from({ length: outputCount }, () => ({
      value: Math.floor(Math.random() * 1000000) + 10000,
      scriptPubKey: generateRandomHex(50),
      address: generateMockAddress()
    })),
    size: Math.floor(Math.random() * 1000) + 250,
    weight: Math.floor(Math.random() * 4000) + 1000
  };
};

const extractSignatures = (transaction: DenovoTransaction): DenovoSignature[] => {
  const signatures: DenovoSignature[] = [];

  transaction.inputs.forEach((input, index) => {
    // Extract signature from scriptSig or witness
    const r = generateRandomHex(64);
    const s = generateRandomHex(64);
    const z = generateRandomHex(64);
    const publicKey = generateRandomHex(66);

    signatures.push({
      txid: transaction.txid,
      inputIndex: index,
      r,
      s,
      z,
      publicKey,
      address: generateMockAddress(),
      scriptType: getRandomScriptType(),
      sigHashType: Math.random() > 0.9 ? 0x03 : 0x01, // Mostly SIGHASH_ALL
      isLowS: BigInt('0x' + s) <= HALF_N,
      isDER: Math.random() > 0.05 // 95% are DER encoded
    });
  });

  return signatures;
};

const detectVulnerabilities = async (
  signatures: DenovoSignature[], 
  config: DenovoConfig
): Promise<DenovoVulnerability[]> => {
  const vulnerabilities: DenovoVulnerability[] = [];

  // Check for duplicate nonces
  if (config.enableWeakNonceDetection) {
    const duplicateNonces = findDuplicateNonces(signatures);
    if (duplicateNonces.length > 0) {
      vulnerabilities.push({
        type: 'DUPLICATE_NONCE',
        severity: 'CRITICAL',
        description: 'Multiple signatures found using the same nonce value, allowing private key recovery.',
        affectedSignatures: duplicateNonces,
        exploitability: 'High - Private keys can be recovered with simple mathematical operations.',
        recommendation: 'Ensure proper nonce generation with cryptographically secure randomness.'
      });
    }
  }

  // Check for weak nonces
  if (config.enableWeakNonceDetection) {
    const weakNonces = detectWeakNonces(signatures);
    if (weakNonces.length > 0) {
      vulnerabilities.push({
        type: 'WEAK_NONCE',
        severity: 'HIGH',
        description: 'Signatures detected with predictable or low-entropy nonces.',
        affectedSignatures: weakNonces,
        exploitability: 'Medium - Requires computational effort but feasible with modern hardware.',
        recommendation: 'Use hardware security modules or proven cryptographic libraries for nonce generation.'
      });
    }
  }

  // Check for biased nonces
  if (config.enableBiasedNonceDetection) {
    const biasedNonces = detectBiasedNonces(signatures);
    if (biasedNonces.length > 0) {
      vulnerabilities.push({
        type: 'BIASED_NONCE',
        severity: 'MEDIUM',
        description: 'Statistical bias detected in nonce generation patterns.',
        affectedSignatures: biasedNonces,
        exploitability: 'Low - Requires large sample sizes and advanced statistical analysis.',
        recommendation: 'Review nonce generation algorithm for proper entropy distribution.'
      });
    }
  }

  // Check for signature malleability
  if (config.enableMalleabilityCheck) {
    const malleableSignatures = detectMalleableSignatures(signatures);
    if (malleableSignatures.length > 0) {
      vulnerabilities.push({
        type: 'MALLEABLE_SIGNATURE',
        severity: 'LOW',
        description: 'Signatures that can be modified without invalidating them.',
        affectedSignatures: malleableSignatures,
        exploitability: 'Low - Can cause transaction ID changes but no fund loss.',
        recommendation: 'Implement BIP 146 (Low S values) and proper signature validation.'
      });
    }
  }

  // Check for Low-S enforcement
  if (config.enableLowSCheck) {
    const highSSignatures = signatures.filter(sig => !sig.isLowS);
    if (highSSignatures.length > 0) {
      vulnerabilities.push({
        type: 'LOW_S_NOT_ENFORCED',
        severity: 'LOW',
        description: 'Signatures found with high S values, violating BIP 146.',
        affectedSignatures: highSSignatures,
        exploitability: 'Very Low - Mainly affects transaction malleability.',
        recommendation: 'Enforce BIP 146 by rejecting signatures with high S values.'
      });
    }
  }

  return vulnerabilities;
};

const findDuplicateNonces = (signatures: DenovoSignature[]): DenovoSignature[] => {
  const rValues = new Map<string, DenovoSignature[]>();
  
  signatures.forEach(sig => {
    if (!rValues.has(sig.r)) {
      rValues.set(sig.r, []);
    }
    rValues.get(sig.r)!.push(sig);
  });

  const duplicates: DenovoSignature[] = [];
  rValues.forEach(sigs => {
    if (sigs.length > 1) {
      duplicates.push(...sigs);
    }
  });

  return duplicates;
};

const detectWeakNonces = (signatures: DenovoSignature[]): DenovoSignature[] => {
  // Simulate weak nonce detection
  return signatures.filter(sig => {
    const r = BigInt('0x' + sig.r);
    // Check for small r values (weak nonces)
    return r < BigInt('0x1000000000000000000000000000000000000000000000000000000000000000');
  });
};

const detectBiasedNonces = (signatures: DenovoSignature[]): DenovoSignature[] => {
  // Simulate biased nonce detection
  const biasedSignatures: DenovoSignature[] = [];
  
  signatures.forEach(sig => {
    const r = sig.r;
    // Check for patterns in the first few bytes
    const firstBytes = r.substring(0, 8);
    const pattern = /^(00|ff|aa|55)/i;
    if (pattern.test(firstBytes)) {
      biasedSignatures.push(sig);
    }
  });

  return biasedSignatures;
};

const detectMalleableSignatures = (signatures: DenovoSignature[]): DenovoSignature[] => {
  return signatures.filter(sig => !sig.isLowS || !sig.isDER);
};

const calculateRiskScore = (vulnerabilities: DenovoVulnerability[]): number => {
  let score = 0;
  
  vulnerabilities.forEach(vuln => {
    switch (vuln.severity) {
      case 'CRITICAL':
        score += 40;
        break;
      case 'HIGH':
        score += 25;
        break;
      case 'MEDIUM':
        score += 15;
        break;
      case 'LOW':
        score += 5;
        break;
    }
  });

  return Math.min(score, 100);
};

const getRandomScriptType = (): DenovoSignature['scriptType'] => {
  const types: DenovoSignature['scriptType'][] = ['P2PKH', 'P2PK', 'P2SH', 'P2WPKH', 'P2WSH', 'P2TR'];
  return types[Math.floor(Math.random() * types.length)];
};

const generateRandomHex = (length: number): string => {
  const chars = '0123456789abcdef';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
};

const generateMockAddress = (): string => {
  const prefixes = ['1', '3', 'bc1'];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  let address = prefix;
  const length = prefix === 'bc1' ? 39 : 25;
  
  for (let i = 0; i < length; i++) {
    address += chars[Math.floor(Math.random() * chars.length)];
  }
  
  return address;
};

// Utility functions for nonce analysis
export const analyzeNonceEntropy = (nonces: string[]): {
  entropy: number;
  patterns: string[];
  recommendations: string[];
} => {
  const entropy = calculateShannonEntropy(nonces.join(''));
  const patterns = detectPatterns(nonces);
  const recommendations = generateEntropyRecommendations(entropy, patterns);

  return { entropy, patterns, recommendations };
};

const calculateShannonEntropy = (data: string): number => {
  const frequency: { [key: string]: number } = {};
  
  for (const char of data) {
    frequency[char] = (frequency[char] || 0) + 1;
  }

  const length = data.length;
  let entropy = 0;

  for (const count of Object.values(frequency)) {
    const probability = count / length;
    entropy -= probability * Math.log2(probability);
  }

  return entropy;
};

const detectPatterns = (nonces: string[]): string[] => {
  const patterns: string[] = [];
  
  // Check for repeated prefixes
  const prefixes = nonces.map(n => n.substring(0, 8));
  const prefixCounts = prefixes.reduce((acc, prefix) => {
    acc[prefix] = (acc[prefix] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  Object.entries(prefixCounts).forEach(([prefix, count]) => {
    if (count > 1) {
      patterns.push(`Repeated prefix: ${prefix} (${count} times)`);
    }
  });

  return patterns;
};

const generateEntropyRecommendations = (entropy: number, patterns: string[]): string[] => {
  const recommendations: string[] = [];

  if (entropy < 3.5) {
    recommendations.push('Low entropy detected - use a cryptographically secure random number generator');
  }

  if (patterns.length > 0) {
    recommendations.push('Patterns detected in nonce generation - review randomness source');
  }

  if (entropy > 3.8 && patterns.length === 0) {
    recommendations.push('Good entropy and no obvious patterns detected');
  }

  return recommendations;
};