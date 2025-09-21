import React, { useState } from 'react';
import { Search, Loader2, Download, AlertCircle, Clock, Hash } from 'lucide-react';
import { AnalysisResult } from '../types/bitcoin';
import { analyzeBlock, SignatureData } from '../utils/blockAnalysis';

interface Props {
  onAnalysisComplete: (results: AnalysisResult[]) => void;
}

const BlockAnalyzer: React.FC<Props> = ({ onAnalysisComplete }) => {
  const [blockHash, setBlockHash] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, txid: '' });
  const [signatures, setSignatures] = useState<SignatureData[]>([]);
  const [error, setError] = useState('');

  const handleAnalyze = async () => {
    if (!blockHash.trim()) {
      setError('Please enter a block hash');
      return;
    }

    setIsAnalyzing(true);
    setError('');
    setSignatures([]);
    setProgress({ current: 0, total: 0, txid: '' });

    try {
      const results = await analyzeBlock(
        blockHash.trim(),
        (current, total, txid) => {
          setProgress({ current, total, txid });
        }
      );

      setSignatures(results);
      
      onAnalysisComplete([{
        type: 'signature',
        timestamp: Date.now(),
        data: { signatures: results, blockHash: blockHash.trim() },
        message: `Block analysis completed: ${results.length} signatures extracted from ${progress.total} transactions`
      }]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Block analysis failed';
      setError(errorMessage);
      onAnalysisComplete([{
        type: 'error',
        timestamp: Date.now(),
        data: { error: errorMessage },
        message: `Block analysis failed: ${errorMessage}`
      }]);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const exportSignatures = () => {
    if (signatures.length === 0) return;

    const data = signatures.map(sig => ({
      txid: sig.txid,
      input_index: sig.inputIndex,
      r: sig.r,
      s: sig.s,
      z: sig.z
    }));

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `block-signatures-${blockHash.substring(0, 8)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const loadExampleBlock = () => {
    // Block 170 - famous early block with interesting transactions
    setBlockHash('00000000d1145790a8694403d4063f323d499e655c83426834d4ce2f8dd4a607');
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Bitcoin Block Analysis</h2>
        <p className="text-gray-300">
          Analyze entire Bitcoin blocks to extract ECDSA signature components from all transactions.
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex justify-end">
          <button
            onClick={loadExampleBlock}
            className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white text-sm rounded-lg transition-colors duration-200"
          >
            Load Example Block
          </button>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Block Hash
          </label>
          <input
            type="text"
            value={blockHash}
            onChange={(e) => setBlockHash(e.target.value)}
            placeholder="Enter Bitcoin block hash..."
            className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono text-sm"
          />
        </div>

        {error && (
          <div className="flex items-center p-4 bg-red-900/20 border border-red-700/50 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-400 mr-3" />
            <span className="text-red-300">{error}</span>
          </div>
        )}

        {isAnalyzing && (
          <div className="bg-slate-700/30 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white font-medium">Analyzing Block...</span>
              <span className="text-gray-400 text-sm">
                {progress.current}/{progress.total} transactions
              </span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2 mb-2">
              <div
                className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress.total > 0 ? (progress.current / progress.total) * 100 : 0}%` }}
              />
            </div>
            <div className="text-sm text-gray-400">
              Current: {progress.txid.substring(0, 16)}...
            </div>
          </div>
        )}

        <button
          onClick={handleAnalyze}
          disabled={isAnalyzing || !blockHash.trim()}
          className="w-full flex items-center justify-center px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors duration-200"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Analyzing Block...
            </>
          ) : (
            <>
              <Search className="w-5 h-5 mr-2" />
              Analyze Block
            </>
          )}
        </button>
      </div>

      {signatures.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-white">
              Extracted Signatures ({signatures.length})
            </h3>
            <button
              onClick={exportSignatures}
              className="flex items-center px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg transition-colors duration-200"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </button>
          </div>

          <div className="bg-slate-700/30 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-white">{signatures.length}</div>
                <div className="text-sm text-gray-400">Total Signatures</div>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-white">{progress.total}</div>
                <div className="text-sm text-gray-400">Transactions</div>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-white">
                  {new Set(signatures.map(s => s.r)).size}
                </div>
                <div className="text-sm text-gray-400">Unique R Values</div>
              </div>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {signatures.slice(0, 10).map((sig, index) => (
                <div key={index} className="bg-slate-800/50 rounded-lg p-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-400">TX:</span>
                      <span className="text-white ml-2 font-mono">
                        {sig.txid.substring(0, 16)}...
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400">Input:</span>
                      <span className="text-white ml-2">{sig.inputIndex}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">R:</span>
                      <span className="text-white ml-2 font-mono">
                        {sig.r.substring(0, 16)}...
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400">S:</span>
                      <span className="text-white ml-2 font-mono">
                        {sig.s.substring(0, 16)}...
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              {signatures.length > 10 && (
                <div className="text-center text-gray-400 text-sm">
                  ... and {signatures.length - 10} more signatures
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="bg-slate-700/30 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-white mb-2">Block Analysis Features</h3>
        <ul className="text-gray-300 text-sm space-y-1">
          <li>• Fetches all transactions from a Bitcoin block</li>
          <li>• Extracts ECDSA signature components (R, S, Z) from each input</li>
          <li>• Computes proper signature hashes for verification</li>
          <li>• Handles transaction parsing and script analysis</li>
          <li>• Exports results for further analysis</li>
          <li>• Progress tracking for large blocks</li>
        </ul>
      </div>

      <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-4">
        <div className="flex items-start">
          <Hash className="w-6 h-6 text-blue-400 mr-3 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="text-blue-400 font-semibold mb-2">Block Analysis Info</h3>
            <p className="text-blue-200 text-sm">
              This tool analyzes entire Bitcoin blocks by fetching transaction data from the Blockstream API. 
              It extracts ECDSA signature components that can be used for duplicate nonce detection and 
              cryptographic analysis. The analysis may take time for blocks with many transactions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlockAnalyzer;