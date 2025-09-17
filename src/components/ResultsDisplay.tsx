import React from 'react';
import { Trash2, Clock, CheckCircle, AlertTriangle, Key, Search } from 'lucide-react';
import { AnalysisResult } from '../types/bitcoin';

interface Props {
  results: AnalysisResult[];
  onClear: () => void;
}

const ResultsDisplay: React.FC<Props> = ({ results, onClear }) => {
  const getIcon = (type: AnalysisResult['type']) => {
    switch (type) {
      case 'signature':
        return <Search className="w-5 h-5 text-blue-400" />;
      case 'duplicate':
        return <AlertTriangle className="w-5 h-5 text-amber-400" />;
      case 'recovery':
        return <Key className="w-5 h-5 text-green-400" />;
      case 'error':
        return <AlertTriangle className="w-5 h-5 text-red-400" />;
      default:
        return <CheckCircle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getTypeColor = (type: AnalysisResult['type']) => {
    switch (type) {
      case 'signature':
        return 'text-blue-400 bg-blue-900/20 border-blue-700/50';
      case 'duplicate':
        return 'text-amber-400 bg-amber-900/20 border-amber-700/50';
      case 'recovery':
        return 'text-green-400 bg-green-900/20 border-green-700/50';
      case 'error':
        return 'text-red-400 bg-red-900/20 border-red-700/50';
      default:
        return 'text-gray-400 bg-gray-900/20 border-gray-700/50';
    }
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const renderResultData = (result: AnalysisResult) => {
    switch (result.type) {
      case 'signature':
        return (
          <div className="space-y-2 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-gray-400">R:</span>
                <div className="font-mono text-xs text-white break-all">
                  {result.data.r?.substring(0, 32)}...
                </div>
              </div>
              <div>
                <span className="text-gray-400">S:</span>
                <div className="font-mono text-xs text-white break-all">
                  {result.data.s?.substring(0, 32)}...
                </div>
              </div>
            </div>
          </div>
        );
      
      case 'duplicate':
        return (
          <div className="text-sm">
            <span className="text-gray-400">Found:</span>
            <span className="text-white ml-2">{result.data.count} duplicate groups</span>
          </div>
        );
      
      case 'recovery':
        return (
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-gray-400">Private Key:</span>
              <div className="font-mono text-xs text-green-300 break-all">
                {result.data.privateKey?.substring(0, 32)}...
              </div>
            </div>
          </div>
        );
      
      case 'error':
        return (
          <div className="text-sm text-red-300">
            {result.data.error}
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6 h-fit">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-white">Analysis Results</h3>
        {results.length > 0 && (
          <button
            onClick={onClear}
            className="flex items-center px-3 py-1 bg-slate-600 hover:bg-slate-700 text-white rounded-lg transition-colors duration-200"
          >
            <Trash2 className="w-4 h-4 mr-1" />
            Clear
          </button>
        )}
      </div>

      {results.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-slate-700/50 rounded-full flex items-center justify-center">
            <Search className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-400">No analysis results yet</p>
          <p className="text-gray-500 text-sm mt-1">
            Start by analyzing a transaction or detecting duplicate nonces
          </p>
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {results.slice().reverse().map((result, index) => (
            <div
              key={results.length - 1 - index}
              className={`border rounded-lg p-4 ${getTypeColor(result.type)}`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center">
                  {getIcon(result.type)}
                  <span className="ml-2 font-medium capitalize">
                    {result.type}
                  </span>
                </div>
                <div className="flex items-center text-xs text-gray-400">
                  <Clock className="w-3 h-3 mr-1" />
                  {formatTimestamp(result.timestamp)}
                </div>
              </div>
              
              <p className="text-sm mb-3">{result.message}</p>
              
              {renderResultData(result)}
            </div>
          ))}
        </div>
      )}

      {results.length > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-700">
          <div className="flex justify-between text-sm text-gray-400">
            <span>Total Results: {results.length}</span>
            <span>
              Success: {results.filter(r => r.type !== 'error').length} | 
              Errors: {results.filter(r => r.type === 'error').length}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultsDisplay;