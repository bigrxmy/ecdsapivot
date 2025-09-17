import React, { useState } from 'react';
import { Search, Loader2, AlertCircle } from 'lucide-react';
import { AnalysisResult } from '../types/bitcoin';
import { analyzeTransaction } from '../utils/bitcoinAnalysis';

interface Props {
  onAnalysisComplete: (results: AnalysisResult[]) => void;
}

const TransactionAnalyzer: React.FC<Props> = ({ onAnalysisComplete }) => {
  const [txid, setTxid] = useState('');
  const [inputIndex, setInputIndex] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState('');

  const handleAnalyze = async () => {
    if (!txid.trim()) {
      setError('Please enter a transaction ID');
      return;
    }

    setIsAnalyzing(true);
    setError('');

    try {
      const result = await analyzeTransaction(txid.trim(), inputIndex);
      onAnalysisComplete([{
        type: 'signature',
        timestamp: Date.now(),
        data: result,
        message: `Analyzed transaction ${txid.substring(0, 8)}... input ${inputIndex}`
      }]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Analysis failed';
      setError(errorMessage);
      onAnalysisComplete([{
        type: 'error',
        timestamp: Date.now(),
        data: { error: errorMessage },
        message: `Failed to analyze transaction: ${errorMessage}`
      }]);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Transaction Analysis</h2>
        <p className="text-gray-300">
          Extract ECDSA signature components from Bitcoin transaction inputs for cryptographic analysis.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Transaction ID (TXID)
          </label>
          <input
            type="text"
            value={txid}
            onChange={(e) => setTxid(e.target.value)}
            placeholder="Enter Bitcoin transaction ID..."
            className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Input Index
          </label>
          <input
            type="number"
            value={inputIndex}
            onChange={(e) => setInputIndex(parseInt(e.target.value) || 0)}
            min="0"
            className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>

        {error && (
          <div className="flex items-center p-4 bg-red-900/20 border border-red-700/50 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-400 mr-3" />
            <span className="text-red-300">{error}</span>
          </div>
        )}

        <button
          onClick={handleAnalyze}
          disabled={isAnalyzing || !txid.trim()}
          className="w-full flex items-center justify-center px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors duration-200"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Search className="w-5 h-5 mr-2" />
              Analyze Transaction
            </>
          )}
        </button>
      </div>

      <div className="bg-slate-700/30 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-white mb-2">How it works</h3>
        <ul className="text-gray-300 text-sm space-y-1">
          <li>• Extracts ECDSA signature components (r, s) from transaction inputs</li>
          <li>• Computes message hash (z) for signature verification</li>
          <li>• Identifies public key and address information</li>
          <li>• Prepares data for duplicate nonce detection</li>
        </ul>
      </div>
    </div>
  );
};

export default TransactionAnalyzer;