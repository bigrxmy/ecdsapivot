import CryptoJS from 'crypto-js';
import { ECDSASignature, DuplicateNonce, PrivateKeyResult } from '../types/bitcoin';

// Secp256k1 curve parameters
const N = BigInt('0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141');
const P = BigInt('0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFC2F');

// Mock transaction analysis (in real implementation, this would connect to Bitcoin RPC)
export const analyzeTransaction = async (txid: string, inputIndex: number): Promise<ECDSASignature> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Mock data - in real implementation, this would parse actual Bitcoin transactions
  const mockSignature: ECDSASignature = {
    txid,
    inputIndex,
    r: generateMockHex(64),
    s: generateMockHex(64),
    z: generateMockHex(64),
    publicKey: generateMockHex(130), // Uncompressed public key
    x: generateMockHex(64)
  };
  
  return mockSignature;
};

export const findDuplicateNonces = (signatures: ECDSASignature[]): DuplicateNonce[] => {
  const rGroups: { [r: string]: ECDSASignature[] } = {};
  
  // Group signatures by r value
  signatures.forEach(sig => {
    if (!rGroups[sig.r]) {
      rGroups[sig.r] = [];
    }
    rGroups[sig.r].push(sig);
  });
  
  // Find groups with multiple signatures (duplicate nonces)
  const duplicates: DuplicateNonce[] = [];
  Object.entries(rGroups).forEach(([r, sigs]) => {
    if (sigs.length > 1) {
      duplicates.push({ r, signatures: sigs });
    }
  });
  
  return duplicates;
};

export const recoverPrivateKey = (
  r: string,
  s1: string,
  s2: string,
  z1: string,
  z2: string,
  publicKey: string
): PrivateKeyResult | null => {
  try {
    const rBig = BigInt('0x' + r);
    const s1Big = BigInt('0x' + s1);
    const s2Big = BigInt('0x' + s2);
    const z1Big = BigInt('0x' + z1);
    const z2Big = BigInt('0x' + z2);
    
    // Calculate k (nonce) using: k = (z1 - z2) / (s1 - s2) mod n
    const numerator = (z1Big - z2Big + N) % N;
    const denominator = (s1Big - s2Big + N) % N;
    const denominatorInv = modInverse(denominator, N);
    const k = (numerator * denominatorInv) % N;
    
    // Calculate private key using: d = (s1 * k - z1) / r mod n
    const numerator2 = (s1Big * k - z1Big + N) % N;
    const rInv = modInverse(rBig, N);
    const privateKey = (numerator2 * rInv) % N;
    
    // Verify the recovered key (simplified verification)
    if (privateKey > 0n && privateKey < N) {
      return {
        privateKey: privateKey.toString(16).padStart(64, '0'),
        publicKey: publicKey,
        type: 'private'
      };
    }
    
    return null;
  } catch (error) {
    console.error('Private key recovery failed:', error);
    return null;
  }
};

// Extended Euclidean Algorithm for modular inverse
function modInverse(a: bigint, m: bigint): bigint {
  if (a < 0n) a = ((a % m) + m) % m;
  
  let [oldR, r] = [a, m];
  let [oldS, s] = [1n, 0n];
  
  while (r !== 0n) {
    const quotient = oldR / r;
    [oldR, r] = [r, oldR - quotient * r];
    [oldS, s] = [s, oldS - quotient * s];
  }
  
  if (oldR > 1n) throw new Error('Modular inverse does not exist');
  if (oldS < 0n) oldS += m;
  
  return oldS;
}

function generateMockHex(length: number): string {
  const chars = '0123456789abcdef';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

// Hash function for Bitcoin message signing
export const hashMessage = (message: string): string => {
  const hash = CryptoJS.SHA256(CryptoJS.SHA256(message));
  return hash.toString(CryptoJS.enc.Hex);
};

// Validate hex string
export const isValidHex = (hex: string, expectedLength?: number): boolean => {
  const hexRegex = /^[0-9a-fA-F]+$/;
  if (!hexRegex.test(hex)) return false;
  if (expectedLength && hex.length !== expectedLength) return false;
  return true;
};

// Convert private key to different formats
export const formatPrivateKey = (privateKey: string): {
  hex: string;
  wif: string;
  wifCompressed: string;
} => {
  // This is a simplified implementation
  // In a real application, you'd use proper Bitcoin libraries
  return {
    hex: privateKey,
    wif: `5${privateKey.substring(0, 50)}`, // Mock WIF format
    wifCompressed: `K${privateKey.substring(0, 50)}` // Mock compressed WIF
  };
};