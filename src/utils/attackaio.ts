import CryptoJS from 'crypto-js';
import { 
  AttackConfig, 
  AttackResult, 
  AttackProgress, 
  BruteForceConfig,
  DictionaryAttackConfig,
  KeyspaceAnalysis,
  AttackVector
} from '../types/attackaio';

// Secp256k1 curve parameters
const N = BigInt('0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141');
const P = BigInt('0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFC2F');
const G = {
  x: BigInt('0x79BE667EF9DCBBAC55A06295CE870B07029BFCDB2DCE28D959F2815B16F81798'),
  y: BigInt('0x483ADA7726A3C4655DA4FBFC0E1108A8FD17B448A68554199C47D08FFB10D4B8')
};

// Base58 alphabet for Bitcoin addresses
const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

export class AttackAIO {
  private isRunning = false;
  private shouldStop = false;
  private currentProgress: AttackProgress = {
    current: '',
    attempts: 0,
    rate: 0,
    eta: 0,
    percentage: 0
  };

  // Brute Force Attack
  async bruteForcePuzzle(
    config: BruteForceConfig,
    onProgress: (progress: AttackProgress) => void,
    signal?: AbortSignal
  ): Promise<AttackResult> {
    this.isRunning = true;
    this.shouldStop = false;
    
    const startTime = Date.now();
    const startKey = BigInt('0x' + config.startKey);
    const endKey = BigInt('0x' + config.endKey);
    const targetAddress = config.targetAddress;
    
    let attempts = 0;
    let current = startKey;
    const batchSize = Math.min(10000, Number(endKey - startKey) / 100);
    
    while (current <= endKey && !this.shouldStop && !signal?.aborted) {
      const batchEnd = current + BigInt(batchSize) > endKey ? endKey : current + BigInt(batchSize);
      
      for (let key = current; key <= batchEnd && !this.shouldStop; key++) {
        attempts++;
        
        try {
          const privateKeyHex = key.toString(16).padStart(64, '0');
          const publicKey = this.privateKeyToPublicKey(privateKeyHex, config.compressed);
          const address = this.publicKeyToAddress(publicKey, config.compressed);
          
          if (address === targetAddress) {
            this.isRunning = false;
            return {
              found: true,
              privateKey: privateKeyHex,
              publicKey: publicKey,
              address: address,
              attempts,
              timeElapsed: Date.now() - startTime,
              method: 'brute_force'
            };
          }
          
          // Update progress every 1000 attempts
          if (attempts % 1000 === 0) {
            const elapsed = (Date.now() - startTime) / 1000;
            const rate = attempts / elapsed;
            const remaining = Number(endKey - key);
            const eta = remaining / rate;
            const percentage = Number((key - startKey) * 100n / (endKey - startKey));
            
            this.currentProgress = {
              current: privateKeyHex,
              attempts,
              rate,
              eta,
              percentage
            };
            
            onProgress(this.currentProgress);
          }
        } catch (error) {
          // Continue on error
        }
      }
      
      current = batchEnd + 1n;
      
      // Small delay to prevent UI blocking
      await new Promise(resolve => setTimeout(resolve, 1));
    }
    
    this.isRunning = false;
    return {
      found: false,
      attempts,
      timeElapsed: Date.now() - startTime,
      method: 'brute_force'
    };
  }

  // Dictionary Attack
  async dictionaryAttack(
    config: DictionaryAttackConfig,
    onProgress: (progress: AttackProgress) => void,
    signal?: AbortSignal
  ): Promise<AttackResult> {
    this.isRunning = true;
    this.shouldStop = false;
    
    const startTime = Date.now();
    let attempts = 0;
    const totalWords = config.wordlist.length;
    
    for (let i = 0; i < totalWords && !this.shouldStop && !signal?.aborted; i++) {
      const word = config.wordlist[i];
      const variations = config.variations ? this.generateVariations(word) : [word];
      
      for (const variation of variations) {
        attempts++;
        
        try {
          const privateKeyHex = this.hashToPrivateKey(variation);
          const publicKey = this.privateKeyToPublicKey(privateKeyHex, config.compressed);
          const address = this.publicKeyToAddress(publicKey, config.compressed);
          
          if (address === config.targetAddress) {
            this.isRunning = false;
            return {
              found: true,
              privateKey: privateKeyHex,
              publicKey: publicKey,
              address: address,
              attempts,
              timeElapsed: Date.now() - startTime,
              method: 'dictionary'
            };
          }
        } catch (error) {
          // Continue on error
        }
      }
      
      // Update progress
      if (i % 100 === 0) {
        const elapsed = (Date.now() - startTime) / 1000;
        const rate = attempts / elapsed;
        const eta = (totalWords - i) / (i / elapsed);
        const percentage = (i / totalWords) * 100;
        
        this.currentProgress = {
          current: word,
          attempts,
          rate,
          eta,
          percentage
        };
        
        onProgress(this.currentProgress);
      }
      
      await new Promise(resolve => setTimeout(resolve, 1));
    }
    
    this.isRunning = false;
    return {
      found: false,
      attempts,
      timeElapsed: Date.now() - startTime,
      method: 'dictionary'
    };
  }

  // Pollard's Rho Algorithm (simplified implementation)
  async pollardRho(
    targetPublicKey: string,
    onProgress: (progress: AttackProgress) => void,
    signal?: AbortSignal
  ): Promise<AttackResult> {
    this.isRunning = true;
    this.shouldStop = false;
    
    const startTime = Date.now();
    let attempts = 0;
    const maxIterations = 1000000;
    
    // Pollard's Rho implementation for ECDLP
    const targetPoint = this.parsePublicKey(targetPublicKey);
    let x = this.generateRandomPoint();
    let y = x;
    
    for (let i = 0; i < maxIterations && !this.shouldStop && !signal?.aborted; i++) {
      attempts++;
      
      // Floyd's cycle detection
      x = this.rhoFunction(x);
      y = this.rhoFunction(this.rhoFunction(y));
      
      if (this.pointsEqual(x.point, y.point)) {
        // Collision detected, attempt to solve
        const privateKey = this.solvePollardCollision(x, y, targetPoint);
        if (privateKey) {
          const publicKey = this.privateKeyToPublicKey(privateKey, false);
          
          if (publicKey === targetPublicKey) {
            this.isRunning = false;
            return {
              found: true,
              privateKey,
              publicKey,
              attempts,
              timeElapsed: Date.now() - startTime,
              method: 'pollard_rho'
            };
          }
        }
      }
      
      // Check if we found the target directly
      if (this.pointsEqual(x.point, targetPoint)) {
        this.isRunning = false;
        return {
          found: true,
          privateKey: x.scalar.toString(16).padStart(64, '0'),
          publicKey: targetPublicKey,
          attempts,
          timeElapsed: Date.now() - startTime,
          method: 'pollard_rho'
        };
      }
      
      if (i % 10000 === 0) {
        const elapsed = (Date.now() - startTime) / 1000;
        const rate = attempts / elapsed;
        const eta = (maxIterations - i) / rate;
        const percentage = (i / maxIterations) * 100;
        
        this.currentProgress = {
          current: x.scalar.toString(16).padStart(64, '0'),
          attempts,
          rate,
          eta,
          percentage
        };
        
        onProgress(this.currentProgress);
      }
      
      await new Promise(resolve => setTimeout(resolve, 1));
    }
    
    this.isRunning = false;
    return {
      found: false,
      attempts,
      timeElapsed: Date.now() - startTime,
      method: 'pollard_rho'
    };
  }

  // Baby-step Giant-step Algorithm
  async babyGiantStep(
    targetPublicKey: string,
    onProgress: (progress: AttackProgress) => void,
    signal?: AbortSignal
  ): Promise<AttackResult> {
    this.isRunning = true;
    this.shouldStop = false;
    
    const startTime = Date.now();
    let attempts = 0;
    const m = Math.floor(Math.sqrt(Number(N))); // Optimal baby steps
    
    // Baby steps phase
    const babySteps = new Map<string, number>();
    const targetPoint = this.parsePublicKey(targetPublicKey);
    
    for (let j = 0; j < m && !this.shouldStop && !signal?.aborted; j++) {
      attempts++;
      
      // Calculate j * G
      const point = this.scalarMultiply(G, BigInt(j));
      const pointStr = `${point.x.toString(16)},${point.y.toString(16)}`;
      babySteps.set(pointStr, j);
      
      if (j % 10000 === 0) {
        const elapsed = (Date.now() - startTime) / 1000;
        const rate = attempts / elapsed;
        const eta = (m - j) / rate;
        const percentage = (j / m) * 50; // 50% for baby steps
        
        this.currentProgress = {
          current: `Baby step ${j}`,
          attempts,
          rate,
          eta,
          percentage
        };
        
        onProgress(this.currentProgress);
      }
    }
    
    // Giant steps phase
    const gamma = this.scalarMultiply(G, BigInt(m));
    let y = targetPoint;
    
    for (let i = 0; i < m && !this.shouldStop && !signal?.aborted; i++) {
      attempts++;
      
      const yStr = `${y.x.toString(16)},${y.y.toString(16)}`;
      
      if (babySteps.has(yStr)) {
        const j = babySteps.get(yStr)!;
        const privateKey = (BigInt(i) * BigInt(m) + BigInt(j)) % N;
        
        // Verify the solution
        const verifyPoint = this.scalarMultiply(G, privateKey);
        if (this.pointsEqual(verifyPoint, targetPoint)) {
          this.isRunning = false;
          return {
            found: true,
            privateKey: privateKey.toString(16).padStart(64, '0'),
            publicKey: targetPublicKey,
            attempts,
            timeElapsed: Date.now() - startTime,
            method: 'baby_giant'
          };
        }
      }
      
      y = this.pointSubtract(y, gamma);
      
      if (i % 1000 === 0) {
        const elapsed = (Date.now() - startTime) / 1000;
        const rate = attempts / elapsed;
        const eta = (m - i) / rate;
        const percentage = 50 + (i / m) * 50; // 50% + giant steps progress
        
        this.currentProgress = {
          current: `Giant step ${i}`,
          attempts,
          rate,
          eta,
          percentage
        };
        
        onProgress(this.currentProgress);
      }
    }
    
    this.isRunning = false;
    return {
      found: false,
      attempts,
      timeElapsed: Date.now() - startTime,
      method: 'baby_giant'
    };
  }

  // Kangaroo Algorithm (Pollard's Lambda)
  async kangarooAttack(
    targetPublicKey: string,
    lowerBound: bigint,
    upperBound: bigint,
    onProgress: (progress: AttackProgress) => void,
    signal?: AbortSignal
  ): Promise<AttackResult> {
    this.isRunning = true;
    this.shouldStop = false;
    
    const startTime = Date.now();
    let attempts = 0;
    const range = upperBound - lowerBound;
    const expectedJumps = Math.floor(Math.sqrt(Number(range)));
    
    // Tame kangaroo
    let tameX = lowerBound + range / 2n;
    let tameY = this.scalarMultiply(G, tameX);
    
    // Wild kangaroo
    const targetPoint = this.parsePublicKey(targetPublicKey);
    let wildY = targetPoint;
    let wildX = 0n;
    
    const jumpSizes = this.generateJumpSizes();
    const tameTraps = new Map<string, bigint>();
    
    // Tame kangaroo phase
    for (let i = 0; i < expectedJumps && !this.shouldStop && !signal?.aborted; i++) {
      const jump = jumpSizes[Number(tameY.x % BigInt(jumpSizes.length))];
      tameX += BigInt(jump);
      tameY = this.pointAdd(tameY, this.scalarMultiply(G, BigInt(jump)));
      
      const trapKey = `${tameY.x.toString(16)},${tameY.y.toString(16)}`;
      tameTraps.set(trapKey, tameX);
      attempts++;
    }
    
    // Wild kangaroo phase
    for (let i = 0; i < expectedJumps * 2 && !this.shouldStop && !signal?.aborted; i++) {
      const jump = jumpSizes[Number(wildY.x % BigInt(jumpSizes.length))];
      wildX += BigInt(jump);
      wildY = this.pointAdd(wildY, this.scalarMultiply(G, BigInt(jump)));
      
      const trapKey = `${wildY.x.toString(16)},${wildY.y.toString(16)}`;
      
      if (tameTraps.has(trapKey)) {
        const tamePos = tameTraps.get(trapKey)!;
        const privateKey = (tamePos - wildX) % N;
        
        if (privateKey > 0n && privateKey >= lowerBound && privateKey <= upperBound) {
          const verifyPoint = this.scalarMultiply(G, privateKey);
          if (this.pointsEqual(verifyPoint, targetPoint)) {
            this.isRunning = false;
            return {
              found: true,
              privateKey: privateKey.toString(16).padStart(64, '0'),
              publicKey: targetPublicKey,
              attempts,
              timeElapsed: Date.now() - startTime,
              method: 'kangaroo'
            };
          }
        }
      }
      
      attempts++;
      
      if (i % 1000 === 0) {
        const elapsed = (Date.now() - startTime) / 1000;
        const rate = attempts / elapsed;
        const eta = (expectedJumps * 2 - i) / rate;
        const percentage = (i / (expectedJumps * 2)) * 100;
        
        this.currentProgress = {
          current: `Wild kangaroo ${i}`,
          attempts,
          rate,
          eta,
          percentage
        };
        
        onProgress(this.currentProgress);
      }
    }
    
    this.isRunning = false;
    return {
      found: false,
      attempts,
      timeElapsed: Date.now() - startTime,
      method: 'kangaroo'
    };
  }

  // Utility functions
  private privateKeyToPublicKey(privateKeyHex: string, compressed: boolean = false): string {
    const privateKey = BigInt('0x' + privateKeyHex);
    const point = this.scalarMultiply(G, privateKey);
    
    if (compressed) {
      const prefix = point.y % 2n === 0n ? '02' : '03';
      return `${prefix}${point.x.toString(16).padStart(64, '0')}`;
    } else {
      return `04${point.x.toString(16).padStart(64, '0')}${point.y.toString(16).padStart(64, '0')}`;
    }
  }

  private publicKeyToAddress(publicKeyHex: string, compressed: boolean = false): string {
    // Simplified address generation using RIPEMD160(SHA256(pubkey))
    const pubkeyBytes = this.hexToBytes(publicKeyHex);
    const sha256Hash = CryptoJS.SHA256(CryptoJS.lib.WordArray.create(pubkeyBytes));
    const ripemd160Hash = CryptoJS.RIPEMD160(sha256Hash);
    
    // Add version byte (0x00 for mainnet P2PKH)
    const versionedHash = '00' + ripemd160Hash.toString();
    
    // Double SHA256 for checksum
    const hash1 = CryptoJS.SHA256(CryptoJS.enc.Hex.parse(versionedHash));
    const hash2 = CryptoJS.SHA256(hash1);
    const checksum = hash2.toString().substring(0, 8);
    
    // Combine and encode in Base58
    const fullHash = versionedHash + checksum;
    return this.base58Encode(this.hexToBytes(fullHash));
  }

  private hexToBytes(hex: string): Uint8Array {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
      bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
    }
    return bytes;
  }

  private base58Encode(bytes: Uint8Array): string {
    let num = BigInt('0x' + Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join(''));
    let encoded = '';
    
    while (num > 0) {
      const remainder = num % 58n;
      num = num / 58n;
      encoded = BASE58_ALPHABET[Number(remainder)] + encoded;
    }
    
    // Add leading zeros
    for (let i = 0; i < bytes.length && bytes[i] === 0; i++) {
      encoded = '1' + encoded;
    }
    
    return encoded;
  }

  private scalarMultiply(point: { x: bigint; y: bigint }, scalar: bigint): { x: bigint; y: bigint } {
    if (scalar === 0n) return { x: 0n, y: 0n };
    if (scalar === 1n) return point;
    
    let result = { x: 0n, y: 0n };
    let addend = point;
    
    while (scalar > 0n) {
      if (scalar & 1n) {
        result = this.pointAdd(result, addend);
      }
      addend = this.pointDouble(addend);
      scalar >>= 1n;
    }
    
    return result;
  }

  private pointAdd(p1: { x: bigint; y: bigint }, p2: { x: bigint; y: bigint }): { x: bigint; y: bigint } {
    if (p1.x === 0n && p1.y === 0n) return p2;
    if (p2.x === 0n && p2.y === 0n) return p1;
    
    if (p1.x === p2.x) {
      if (p1.y === p2.y) {
        return this.pointDouble(p1);
      } else {
        return { x: 0n, y: 0n }; // Point at infinity
      }
    }
    
    const slope = ((p2.y - p1.y) * this.modInverse(p2.x - p1.x, P)) % P;
    const x3 = (slope * slope - p1.x - p2.x) % P;
    const y3 = (slope * (p1.x - x3) - p1.y) % P;
    
    return { 
      x: x3 < 0n ? x3 + P : x3, 
      y: y3 < 0n ? y3 + P : y3 
    };
  }

  private pointDouble(point: { x: bigint; y: bigint }): { x: bigint; y: bigint } {
    if (point.y === 0n) return { x: 0n, y: 0n };
    
    const slope = ((3n * point.x * point.x) * this.modInverse(2n * point.y, P)) % P;
    const x3 = (slope * slope - 2n * point.x) % P;
    const y3 = (slope * (point.x - x3) - point.y) % P;
    
    return { 
      x: x3 < 0n ? x3 + P : x3, 
      y: y3 < 0n ? y3 + P : y3 
    };
  }

  private pointSubtract(p1: { x: bigint; y: bigint }, p2: { x: bigint; y: bigint }): { x: bigint; y: bigint } {
    return this.pointAdd(p1, { x: p2.x, y: P - p2.y });
  }

  private pointsEqual(p1: { x: bigint; y: bigint }, p2: { x: bigint; y: bigint }): boolean {
    return p1.x === p2.x && p1.y === p2.y;
  }

  private modInverse(a: bigint, m: bigint): bigint {
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

  private parsePublicKey(publicKeyHex: string): { x: bigint; y: bigint } {
    if (publicKeyHex.startsWith('04')) {
      const x = BigInt('0x' + publicKeyHex.substring(2, 66));
      const y = BigInt('0x' + publicKeyHex.substring(66, 130));
      return { x, y };
    } else if (publicKeyHex.startsWith('02') || publicKeyHex.startsWith('03')) {
      const x = BigInt('0x' + publicKeyHex.substring(2));
      const isEven = publicKeyHex.startsWith('02');
      const y = this.recoverYFromX(x, isEven);
      return { x, y };
    }
    throw new Error('Unsupported public key format');
  }

  private recoverYFromX(x: bigint, isEven: boolean): bigint {
    // y^2 = x^3 + 7 (mod p)
    const ySq = (x * x * x + 7n) % P;
    let y = this.modSqrt(ySq, P);
    
    if ((y % 2n === 0n) !== isEven) {
      y = P - y;
    }
    
    return y;
  }

  private modSqrt(a: bigint, p: bigint): bigint {
    // Tonelli-Shanks algorithm for computing square roots modulo p
    if (a === 0n) return 0n;
    
    // Simple case for p ≡ 3 (mod 4)
    if (p % 4n === 3n) {
      return this.modPow(a, (p + 1n) / 4n, p);
    }
    
    // General Tonelli-Shanks algorithm would go here
    // For simplicity, using the special case
    return this.modPow(a, (p + 1n) / 4n, p);
  }

  private modPow(base: bigint, exp: bigint, mod: bigint): bigint {
    let result = 1n;
    base = base % mod;
    
    while (exp > 0n) {
      if (exp % 2n === 1n) {
        result = (result * base) % mod;
      }
      exp = exp >> 1n;
      base = (base * base) % mod;
    }
    
    return result;
  }

  private generateRandomPrivateKey(): string {
    const randomBytes = new Uint8Array(32);
    crypto.getRandomValues(randomBytes);
    return Array.from(randomBytes).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  private generateRandomPoint(): { point: { x: bigint; y: bigint }, scalar: bigint } {
    const scalar = BigInt('0x' + this.generateRandomPrivateKey()) % N;
    const point = this.scalarMultiply(G, scalar);
    return { point, scalar };
  }

  private rhoFunction(state: { point: { x: bigint; y: bigint }, scalar: bigint }): { point: { x: bigint; y: bigint }, scalar: bigint } {
    // Pollard's rho function: f(x) = x + G if x is in S1, 2x if x is in S2, x + P if x is in S3
    const partition = state.point.x % 3n;
    
    if (partition === 0n) {
      return {
        point: this.pointAdd(state.point, G),
        scalar: (state.scalar + 1n) % N
      };
    } else if (partition === 1n) {
      return {
        point: this.pointDouble(state.point),
        scalar: (state.scalar * 2n) % N
      };
    } else {
      const targetPoint = this.parsePublicKey('04d0de0aaeaefad02b8bdc8a01a1b8b11c696bd3d66a2c5f10780d95b7df42645cd85228a6fb29940e858e7e55842ae2bd115d1ed7cc0e82d934e929c97648cb0a');
      return {
        point: this.pointAdd(state.point, targetPoint),
        scalar: state.scalar // This would need proper tracking in real implementation
      };
    }
  }

  private solvePollardCollision(
    x: { point: { x: bigint; y: bigint }, scalar: bigint },
    y: { point: { x: bigint; y: bigint }, scalar: bigint },
    target: { x: bigint; y: bigint }
  ): string | null {
    // Solve the collision: if x.scalar * G = y.scalar * G, then (x.scalar - y.scalar) * G = 0
    const diff = (x.scalar - y.scalar) % N;
    if (diff === 0n) return null;
    
    // This is a simplified version - real implementation would be more complex
    return diff.toString(16).padStart(64, '0');
  }

  private generateJumpSizes(): number[] {
    // Generate pseudo-random jump sizes for kangaroo algorithm
    const sizes = [];
    for (let i = 0; i < 256; i++) {
      sizes.push(Math.pow(2, i % 20)); // Powers of 2 up to 2^19
    }
    return sizes;
  }

  private hashToPrivateKey(input: string): string {
    const hash = CryptoJS.SHA256(input);
    return hash.toString();
  }

  private generateVariations(word: string): string[] {
    const variations = [word];
    
    // Common variations
    variations.push(word.toLowerCase());
    variations.push(word.toUpperCase());
    variations.push(word + '123');
    variations.push(word + '1');
    variations.push('123' + word);
    variations.push(word.split('').reverse().join(''));
    
    // Leet speak
    const leetMap: { [key: string]: string } = {
      'a': '4', 'e': '3', 'i': '1', 'o': '0', 's': '5', 't': '7'
    };
    
    let leetWord = word.toLowerCase();
    for (const [char, leet] of Object.entries(leetMap)) {
      leetWord = leetWord.replace(new RegExp(char, 'g'), leet);
    }
    variations.push(leetWord);
    
    return variations;
  }

  // Control methods
  stop(): void {
    this.shouldStop = true;
    this.isRunning = false;
  }

  isAttackRunning(): boolean {
    return this.isRunning;
  }

  getCurrentProgress(): AttackProgress {
    return this.currentProgress;
  }
}
        this.isRunning = false;
        return {
          found: true,
          privateKey: privateKey.toString(16).padStart(64, '0'),
          publicKey: targetPublicKey,
          attempts,
          timeElapsed: Date.now() - startTime,
          method: 'baby_giant'
        };
      }
      
      y = this.pointSubtract(y, gamma);
      
      if (i % 1000 === 0) {
        const elapsed = (Date.now() - startTime) / 1000;
        const rate = attempts / elapsed;
        const eta = (m - i) / rate;
        const percentage = 50 + (i / m) * 50; // 50% + giant steps progress
        
        this.currentProgress = {
          current: `Giant step ${i}`,
          attempts,
          rate,
          eta,
          percentage
        };
        
        onProgress(this.currentProgress);
      }
    }
    
    this.isRunning = false;
    return {
      found: false,
      attempts,
      timeElapsed: Date.now() - startTime,
      method: 'baby_giant'
    };
  }

  // Utility functions
  private privateKeyToPublicKey(privateKeyHex: string): string {
    const privateKey = BigInt('0x' + privateKeyHex);
    const point = this.scalarMultiply(G, privateKey);
    return `04${point.x.toString(16).padStart(64, '0')}${point.y.toString(16).padStart(64, '0')}`;
  }

  private publicKeyToAddress(publicKeyHex: string, compressed: boolean = false): string {
    // Simplified address generation - real implementation would use proper Bitcoin libraries
    const hash = CryptoJS.SHA256(CryptoJS.RIPEMD160(CryptoJS.SHA256(publicKeyHex)));
    return `1${hash.toString().substring(0, 32)}`; // Mock address format
  }

  private scalarMultiply(point: { x: bigint; y: bigint }, scalar: bigint): { x: bigint; y: bigint } {
    // Simplified scalar multiplication - real implementation would be more efficient
    if (scalar === 0n) return { x: 0n, y: 0n };
    if (scalar === 1n) return point;
    
    let result = { x: 0n, y: 0n };
    let addend = point;
    
    while (scalar > 0n) {
      if (scalar & 1n) {
        result = this.pointAdd(result, addend);
      }
      addend = this.pointDouble(addend);
      scalar >>= 1n;
    }
    
    return result;
  }

  private pointAdd(p1: { x: bigint; y: bigint }, p2: { x: bigint; y: bigint }): { x: bigint; y: bigint } {
    if (p1.x === 0n && p1.y === 0n) return p2;
    if (p2.x === 0n && p2.y === 0n) return p1;
    
    const slope = ((p2.y - p1.y) * this.modInverse(p2.x - p1.x, P)) % P;
    const x3 = (slope * slope - p1.x - p2.x) % P;
    const y3 = (slope * (p1.x - x3) - p1.y) % P;
    
    return { x: x3 < 0n ? x3 + P : x3, y: y3 < 0n ? y3 + P : y3 };
  }

  private pointDouble(point: { x: bigint; y: bigint }): { x: bigint; y: bigint } {
    const slope = ((3n * point.x * point.x) * this.modInverse(2n * point.y, P)) % P;
    const x3 = (slope * slope - 2n * point.x) % P;
    const y3 = (slope * (point.x - x3) - point.y) % P;
    
    return { x: x3 < 0n ? x3 + P : x3, y: y3 < 0n ? y3 + P : y3 };
  }

  private pointSubtract(p1: { x: bigint; y: bigint }, p2: { x: bigint; y: bigint }): { x: bigint; y: bigint } {
    return this.pointAdd(p1, { x: p2.x, y: P - p2.y });
  }

  private modInverse(a: bigint, m: bigint): bigint {
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

  private parsePublicKey(publicKeyHex: string): { x: bigint; y: bigint } {
    if (publicKeyHex.startsWith('04')) {
      const x = BigInt('0x' + publicKeyHex.substring(2, 66));
      const y = BigInt('0x' + publicKeyHex.substring(66, 130));
      return { x, y };
    }
    throw new Error('Unsupported public key format');
  }

  private generateRandomPrivateKey(): string {
    const randomBytes = new Uint8Array(32);
    crypto.getRandomValues(randomBytes);
    return Array.from(randomBytes).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  private hashToPrivateKey(input: string): string {
    const hash = CryptoJS.SHA256(input);
    return hash.toString();
  }

  private generateVariations(word: string): string[] {
    const variations = [word];
    
    // Common variations
    variations.push(word.toLowerCase());
    variations.push(word.toUpperCase());
    variations.push(word + '123');
    variations.push(word + '1');
    variations.push('123' + word);
    variations.push(word.split('').reverse().join(''));
    
    // Leet speak
    const leetMap: { [key: string]: string } = {
      'a': '4', 'e': '3', 'i': '1', 'o': '0', 's': '5', 't': '7'
    };
    
    let leetWord = word.toLowerCase();
    for (const [char, leet] of Object.entries(leetMap)) {
      leetWord = leetWord.replace(new RegExp(char, 'g'), leet);
    }
    variations.push(leetWord);
    
    return variations;
  }

  // Control methods
  stop(): void {
    this.shouldStop = true;
    this.isRunning = false;
  }

  isAttackRunning(): boolean {
    return this.isRunning;
  }

  getCurrentProgress(): AttackProgress {
    return this.currentProgress;
  }
}

// Keyspace analysis utilities
export const analyzeKeyspace = (startKey: string, endKey: string): KeyspaceAnalysis => {
  const start = BigInt('0x' + startKey);
  const end = BigInt('0x' + endKey);
  const totalKeys = end - start + 1n;
  
  // Estimate time based on 1M keys/second
  const keysPerSecond = 1000000;
  const estimatedSeconds = Number(totalKeys) / keysPerSecond;
  
  let difficulty: KeyspaceAnalysis['difficulty'];
  let recommendation: string;
  
  if (totalKeys < 1000000n) {
    difficulty = 'TRIVIAL';
    recommendation = 'This keyspace can be searched very quickly.';
  } else if (totalKeys < 1000000000n) {
    difficulty = 'EASY';
    recommendation = 'This keyspace can be searched in reasonable time.';
  } else if (totalKeys < 1000000000000n) {
    difficulty = 'MEDIUM';
    recommendation = 'This keyspace will take significant time to search.';
  } else if (totalKeys < BigInt('0x1000000000000000')) {
    difficulty = 'HARD';
    recommendation = 'This keyspace is very large and may not be practical to search completely.';
  } else {
    difficulty = 'IMPOSSIBLE';
    recommendation = 'This keyspace is too large to search with current technology.';
  }
  
  return {
    totalKeys,
    estimatedTime: estimatedSeconds,
    difficulty,
    recommendation
  };
};

// Get available attack vectors
export const getAttackVectors = (): AttackVector[] => [
  {
    name: 'Brute Force',
    description: 'Systematically try all possible private keys in a range',
    complexity: 'O(n) where n is keyspace size',
    successRate: 100,
    estimatedTime: 'Depends on keyspace size',
    requirements: ['Target address', 'Key range']
  },
  {
    name: 'Dictionary Attack',
    description: 'Try private keys derived from common words and phrases',
    complexity: 'O(n) where n is dictionary size',
    successRate: 5,
    estimatedTime: 'Minutes to hours',
    requirements: ['Target address', 'Word list']
  },
  {
    name: 'Pollard\'s Rho',
    description: 'Probabilistic algorithm for discrete logarithm problem',
    complexity: 'O(√n) expected time',
    successRate: 100,
    estimatedTime: 'Very long for full keyspace',
    requirements: ['Target public key']
  },
  {
    name: 'Baby-step Giant-step',
    description: 'Time-memory tradeoff for discrete logarithm',
    complexity: 'O(√n) time, O(√n) space',
    successRate: 100,
    estimatedTime: 'Long, requires significant memory',
    requirements: ['Target public key', 'Large memory']
  }
];