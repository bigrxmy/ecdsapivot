// Bitcoin Block Analysis Utilities
export interface BlockTransaction {
  txid: string;
  version: number;
  inputs: TransactionInput[];
  outputs: TransactionOutput[];
  locktime: number;
  hex: string;
}

export interface TransactionInput {
  prev_tx: string;
  vout: number;
  scriptSig: string;
  sequence: string;
}

export interface TransactionOutput {
  amount: number;
  scriptPubKey: string;
}

export interface SignatureData {
  txid: string;
  inputIndex: number;
  r: string;
  s: string;
  z: string;
}

export function reverseHex(h: string): string {
  const result = [];
  for (let i = h.length - 2; i >= 0; i -= 2) {
    result.push(h.slice(i, i + 2));
  }
  return result.join('');
}

export function varintHex(n: number): string {
  if (n < 0xfd) {
    return n.toString(16).padStart(2, '0');
  } else if (n <= 0xffff) {
    return 'fd' + n.toString(16).padStart(4, '0');
  } else if (n <= 0xffffffff) {
    return 'fe' + n.toString(16).padStart(8, '0');
  } else {
    return 'ff' + n.toString(16).padStart(16, '0');
  }
}

export function readVarint(s: string): [number, number] {
  const i = parseInt(s.slice(0, 2), 16);
  if (i < 0xfd) {
    return [i, 2];
  } else if (i === 0xfd) {
    return [parseInt(s.slice(2, 6), 16), 6];
  } else if (i === 0xfe) {
    return [parseInt(s.slice(2, 10), 16), 10];
  } else {
    return [parseInt(s.slice(2, 18), 16), 18];
  }
}

export function parseSignature(scriptSig: string): { r: string; s: string } | null {
  if (!scriptSig) return null;
  
  const length = parseInt(scriptSig.slice(0, 2), 16);
  const sig = scriptSig.slice(2, 2 + length * 2);
  
  if (sig.slice(0, 2) !== '30') return null;
  
  let pointer = 4; // after 30 and length
  
  if (sig.slice(pointer, pointer + 2) === '02') {
    const rLen = parseInt(sig.slice(pointer + 2, pointer + 4), 16);
    pointer += 4;
    const r = sig.slice(pointer, pointer + rLen * 2);
    pointer += rLen * 2;
    
    if (sig.slice(pointer, pointer + 2) === '02') {
      const sLen = parseInt(sig.slice(pointer + 2, pointer + 4), 16);
      pointer += 4;
      const s = sig.slice(pointer, pointer + sLen * 2);
      return { r, s };
    }
  }
  
  return null;
}

export async function doubleSha256(hex: string): Promise<string> {
  const bytes = new Uint8Array(hex.match(/.{2}/g)!.map(byte => parseInt(byte, 16)));
  const hash1 = await crypto.subtle.digest('SHA-256', bytes);
  const hash2 = await crypto.subtle.digest('SHA-256', hash1);
  return Array.from(new Uint8Array(hash2))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export class BitcoinTransaction {
  hex: string;
  version: number;
  inputCount: number;
  inputs: TransactionInput[];
  outputCount: number;
  outputs: TransactionOutput[];
  locktime: number;
  prevScriptPubKeys: string[] = [];

  constructor(hexData: string) {
    this.hex = hexData;
    this.version = parseInt(hexData.slice(0, 8), 16);
    
    let pointer = 8;
    const [inputCount, inputCountBytes] = readVarint(hexData.slice(pointer));
    this.inputCount = inputCount;
    pointer += inputCountBytes;
    
    this.inputs = [];
    for (let i = 0; i < this.inputCount; i++) {
      const prevTx = hexData.slice(pointer, pointer + 64);
      pointer += 64;
      const vout = parseInt(hexData.slice(pointer, pointer + 8), 16);
      pointer += 8;
      const [scriptLen, scriptLenBytes] = readVarint(hexData.slice(pointer));
      pointer += scriptLenBytes;
      const scriptSig = hexData.slice(pointer, pointer + scriptLen * 2);
      pointer += scriptLen * 2;
      const sequence = hexData.slice(pointer, pointer + 8);
      pointer += 8;
      
      this.inputs.push({ prev_tx: prevTx, vout, scriptSig, sequence });
    }
    
    const [outputCount, outputCountBytes] = readVarint(hexData.slice(pointer));
    this.outputCount = outputCount;
    pointer += outputCountBytes;
    
    this.outputs = [];
    for (let i = 0; i < this.outputCount; i++) {
      const amount = parseInt(hexData.slice(pointer, pointer + 16), 16);
      pointer += 16;
      const [scriptLen, scriptLenBytes] = readVarint(hexData.slice(pointer));
      pointer += scriptLenBytes;
      const scriptPubKey = hexData.slice(pointer, pointer + scriptLen * 2);
      pointer += scriptLen * 2;
      
      this.outputs.push({ amount, scriptPubKey });
    }
    
    this.locktime = parseInt(hexData.slice(pointer, pointer + 8), 16);
  }

  async sighash(inputIndex: number): Promise<string> {
    let h = this.version.toString(16).padStart(8, '0');
    h += varintHex(this.inputCount);
    
    for (let j = 0; j < this.inputs.length; j++) {
      const inp = this.inputs[j];
      h += inp.prev_tx;
      h += inp.vout.toString(16).padStart(8, '0');
      
      if (j === inputIndex) {
        const script = this.prevScriptPubKeys[j];
        const l = script.length / 2;
        h += varintHex(l);
        h += script;
      } else {
        h += '00';
      }
      h += inp.sequence;
    }
    
    h += varintHex(this.outputCount);
    for (const out of this.outputs) {
      h += out.amount.toString(16).padStart(16, '0');
      const l = out.scriptPubKey.length / 2;
      h += varintHex(l);
      h += out.scriptPubKey;
    }
    
    h += this.locktime.toString(16).padStart(8, '0');
    h += '01000000';
    
    return await doubleSha256(h);
  }
}

export async function getTxids(blockHash: string): Promise<string[]> {
  const url = `https://blockstream.info/api/block/${blockHash}/txids`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch txids: ${response.statusText}`);
  }
  return await response.json();
}

export async function getRawTx(txid: string): Promise<string> {
  const url = `https://blockstream.info/api/tx/${txid}/hex`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch raw transaction: ${response.statusText}`);
  }
  return await response.text();
}

export async function getScriptPubKey(prevTxid: string, vout: number): Promise<string> {
  const raw = await getRawTx(prevTxid);
  const tx = new BitcoinTransaction(raw);
  return tx.outputs[vout].scriptPubKey;
}

export async function analyzeBlock(
  blockHash: string,
  onProgress?: (current: number, total: number, txid: string) => void
): Promise<SignatureData[]> {
  const txids = await getTxids(blockHash);
  const signatures: SignatureData[] = [];
  
  for (let txIndex = 0; txIndex < txids.length; txIndex++) {
    const txid = txids[txIndex];
    onProgress?.(txIndex + 1, txids.length, txid);
    
    try {
      const raw = await getRawTx(txid);
      const tx = new BitcoinTransaction(raw);
      
      // Fetch previous scriptPubKeys
      for (const inp of tx.inputs) {
        const prevTx = reverseHex(inp.prev_tx);
        const vout = inp.vout;
        try {
          const spk = await getScriptPubKey(prevTx, vout);
          tx.prevScriptPubKeys.push(spk);
        } catch (error) {
          console.warn(`Failed to get scriptPubKey for ${prevTx}:${vout}`);
          tx.prevScriptPubKeys.push('');
        }
      }
      
      // Extract signatures from each input
      for (let i = 0; i < tx.inputCount; i++) {
        const rs = parseSignature(tx.inputs[i].scriptSig);
        if (rs && tx.prevScriptPubKeys[i]) {
          try {
            const z = await tx.sighash(i);
            signatures.push({
              txid,
              inputIndex: i,
              r: rs.r,
              s: rs.s,
              z
            });
          } catch (error) {
            console.warn(`Failed to compute sighash for ${txid}:${i}`);
          }
        }
      }
    } catch (error) {
      console.warn(`Failed to analyze transaction ${txid}:`, error);
    }
    
    // Add small delay to prevent rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  return signatures;
}