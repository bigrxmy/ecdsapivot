import React, { useState, useRef } from 'react';
import { Shield, Upload, Play, Pause, Download, AlertTriangle, Info, CheckCircle, XCircle } from 'lucide-react';
import { DenovoAnalysisResult, DenovoBatchResult, DenovoConfig, DenovoVulnerability } from '../types/denovo';
import { analyzeDenovoTransaction, analyzeDenovoBatch } from '../utils/denovoAnalysis';
import { AnalysisResult } from '../types/bitcoin';

interface Props {
  onAnalysisComplete: (results: AnalysisResult[]) => void;
}

const DenovoAnalyzer: React.FC<Props> = ({ onAnalysisComplete }) => {
  const [activeMode, setActiveMode] = useState<'single' | 'batch'>('single');
  const [txid, setTxid] = useState('');
  const [batchFile, setBatchFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentResult, setCurrentResult] = useState<DenovoAnalysisResult | null>(null);
  const [batchResults, setBatchResults] = useState<DenovoBatchResult | null>(null);
  const [config, setConfig] = useState<DenovoConfig>({
    enableWeakNonceDetection: true,
    enableBiasedNonceDetection: true,
    enableMalleabilityCheck: true,
    enableLowSCheck: true,
    batchSize: 100,
    timeoutMs: 30000
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const handleSingleAnalysis = async () => {
    if (!txid.trim()) return;

    setIsAnalyzing(true);
    setCurrentResult(null);
    abortControllerRef.current = new AbortController();

    try {
      const result = await analyzeDenovoTransaction(txid.trim(), config, abortControllerRef.current.signal);
      setCurrentResult(result);
      
      onAnalysisComplete([{
        type: 'signature',
        timestamp: Date.now(),
        data: result,
        message: `Denovo analysis completed for ${txid.substring(0, 8)}... - Risk Score: ${result.riskScore}/100`
      }]);
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        onAnalysisComplete([{
          type: 'error',
          timestamp: Date.now(),
          data: { error: error.message },
          message: `Denovo analysis failed: ${error.message}`
        }]);
      }
    } finally {
      setIsAnalyzing(false);
      abortControllerRef.current = null;
    }
  };

  const handleBatchAnalysis = async () => {
    if (!batchFile) return;

    setIsAnalyzing(true);
    setBatchResults(null);
    setProgress(0);
    abortControllerRef.current = new AbortController();

    try {
      const fileContent = await batchFile.text();
      const txids = fileContent.split('\n').filter(line => line.trim()).map(line => line.trim());
      
      const result = await analyzeDenovoBatch(
        txids,
        config,
        abortControllerRef.current.signal,
        (current, total) => {
          setProgress((current / total) * 100);
        }
      );
      
      setBatchResults(result);
      
      onAnalysisComplete([{
        type: 'signature',
        timestamp: Date.now(),
        data: result,
        message: `Batch analysis completed: ${result.analyzedTransactions}/${result.totalTransactions} transactions, ${result.totalVulnerabilities} vulnerabilities found`
      }]);
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        onAnalysisComplete([{
          type: 'error',
          timestamp: Date.now(),
          data: { error: error.message },
          message: `Batch analysis failed: ${error.message}`
        }]);
      }
    } finally {
      setIsAnalyzing(false);
      setProgress(0);
      abortControllerRef.current = null;
    }
  };

  const handlePauseResume = () => {
    setIsPaused(!isPaused);
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsAnalyzing(false);
    setIsPaused(false);
    setProgress(0);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setBatchFile(file);
    }
  };

  const exportResults = () => {
    const data = currentResult || batchResults;
    if (!data) return;

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `denovo-analysis-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getSeverityColor = (severity: DenovoVulnerability['severity']) => {
    switch (severity) {
      case 'LOW': return 'text-blue-400 bg-blue-900/20';
      case 'MEDIUM': return 'text-yellow-400 bg-yellow-900/20';
      case 'HIGH': return 'text-orange-400 bg-orange-900/20';
      case 'CRITICAL': return 'text-red-400 bg-red-900/20';
      default: return 'text-gray-400 bg-gray-900/20';
    }
  };

  const getRiskScoreColor = (score: number) => {
    if (score >= 80) return 'text-red-400';
    if (score >= 60) return 'text-orange-400';
    if (score >= 40) return 'text-yellow-400';
    return 'text-green-400';
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Denovo Vulnerability Scanner</h2>
        <p className="text-gray-300">
          Advanced Bitcoin transaction analysis for ECDSA vulnerabilities, weak nonces, and signature malleability.
        </p>
      </div>

      {/* Mode Selection */}
      <div className="flex space-x-4">
        <button
          onClick={() => setActiveMode('single')}
          className={`px-4 py-2 rounded-lg transition-colors duration-200 ${
            activeMode === 'single'
              ? 'bg-purple-600 text-white'
              : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
          }`}
        >
          Single Transaction
        </button>
        <button
          onClick={() => setActiveMode('batch')}
          className={`px-4 py-2 rounded-lg transition-colors duration-200 ${
            activeMode === 'batch'
              ? 'bg-purple-600 text-white'
              : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
          }`}
        >
          Batch Analysis
        </button>
      </div>

      {/* Configuration Panel */}
      <div className="bg-slate-700/30 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-white mb-3">Analysis Configuration</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={config.enableWeakNonceDetection}
              onChange={(e) => setConfig(prev => ({ ...prev, enableWeakNonceDetection: e.target.checked }))}
              className="rounded bg-slate-600 border-slate-500 text-purple-600 focus:ring-purple-500"
            />
            <span className="text-sm text-gray-300">Weak Nonce Detection</span>
          </label>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={config.enableBiasedNonceDetection}
              onChange={(e) => setConfig(prev => ({ ...prev, enableBiasedNonceDetection: e.target.checked }))}
              className="rounded bg-slate-600 border-slate-500 text-purple-600 focus:ring-purple-500"
            />
            <span className="text-sm text-gray-300">Biased Nonce Detection</span>
          </label>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={config.enableMalleabilityCheck}
              onChange={(e) => setConfig(prev => ({ ...prev, enableMalleabilityCheck: e.target.checked }))}
              className="rounded bg-slate-600 border-slate-500 text-purple-600 focus:ring-purple-500"
            />
            <span className="text-sm text-gray-300">Malleability Check</span>
          </label>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={config.enableLowSCheck}
              onChange={(e) => setConfig(prev => ({ ...prev, enableLowSCheck: e.target.checked }))}
              className="rounded bg-slate-600 border-slate-500 text-purple-600 focus:ring-purple-500"
            />
            <span className="text-sm text-gray-300">Low-S Enforcement</span>
          </label>
        </div>
      </div>

      {/* Single Transaction Mode */}
      {activeMode === 'single' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Transaction ID
            </label>
            <input
              type="text"
              value={txid}
              onChange={(e) => setTxid(e.target.value)}
              placeholder="Enter Bitcoin transaction ID..."
              className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <button
            onClick={handleSingleAnalysis}
            disabled={isAnalyzing || !txid.trim()}
            className="w-full flex items-center justify-center px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors duration-200"
          >
            {isAnalyzing ? (
              <>
                <Shield className="w-5 h-5 mr-2 animate-pulse" />
                Analyzing...
              </>
            ) : (
              <>
                <Shield className="w-5 h-5 mr-2" />
                Analyze Transaction
              </>
            )}
          </button>
        </div>
      )}

      {/* Batch Analysis Mode */}
      {activeMode === 'batch' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Transaction List File
            </label>
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex items-center justify-center px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-gray-300 hover:bg-slate-700 transition-colors duration-200"
                >
                  <Upload className="w-5 h-5 mr-2" />
                  {batchFile ? batchFile.name : 'Select file with transaction IDs'}
                </button>
              </div>
            </div>
          </div>

          {isAnalyzing && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm text-gray-300">
                <span>Progress: {progress.toFixed(1)}%</span>
                <div className="flex space-x-2">
                  <button
                    onClick={handlePauseResume}
                    className="flex items-center px-3 py-1 bg-slate-600 hover:bg-slate-700 text-white rounded transition-colors duration-200"
                  >
                    {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={handleStop}
                    className="flex items-center px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded transition-colors duration-200"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div
                  className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          <button
            onClick={handleBatchAnalysis}
            disabled={isAnalyzing || !batchFile}
            className="w-full flex items-center justify-center px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors duration-200"
          >
            {isAnalyzing ? (
              <>
                <Shield className="w-5 h-5 mr-2 animate-pulse" />
                Analyzing Batch...
              </>
            ) : (
              <>
                <Shield className="w-5 h-5 mr-2" />
                Start Batch Analysis
              </>
            )}
          </button>
        </div>
      )}

      {/* Results Display */}
      {(currentResult || batchResults) && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-white">Analysis Results</h3>
            <button
              onClick={exportResults}
              className="flex items-center px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg transition-colors duration-200"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </button>
          </div>

          {/* Single Transaction Results */}
          {currentResult && (
            <div className="bg-slate-700/30 rounded-lg p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-semibold text-white">Transaction Analysis</h4>
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${getRiskScoreColor(currentResult.riskScore)}`}>
                  Risk Score: {currentResult.riskScore}/100
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-800/50 rounded-lg p-4">
                  <div className="text-sm text-gray-400 mb-1">Transaction ID</div>
                  <div className="font-mono text-xs text-white break-all">
                    {currentResult.transaction.txid}
                  </div>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-4">
                  <div className="text-sm text-gray-400 mb-1">Signatures</div>
                  <div className="text-xl font-bold text-white">
                    {currentResult.signatures.length}
                  </div>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-4">
                  <div className="text-sm text-gray-400 mb-1">Vulnerabilities</div>
                  <div className="text-xl font-bold text-red-400">
                    {currentResult.vulnerabilities.length}
                  </div>
                </div>
              </div>

              {currentResult.vulnerabilities.length > 0 && (
                <div>
                  <h5 className="text-lg font-semibold text-white mb-3">Detected Vulnerabilities</h5>
                  <div className="space-y-3">
                    {currentResult.vulnerabilities.map((vuln, index) => (
                      <div key={index} className={`border rounded-lg p-4 ${getSeverityColor(vuln.severity)}`}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center">
                            <AlertTriangle className="w-5 h-5 mr-2" />
                            <span className="font-medium">{vuln.type.replace('_', ' ')}</span>
                          </div>
                          <span className="px-2 py-1 rounded text-xs font-medium bg-current bg-opacity-20">
                            {vuln.severity}
                          </span>
                        </div>
                        <p className="text-sm mb-2">{vuln.description}</p>
                        <div className="text-xs space-y-1">
                          <div><strong>Exploitability:</strong> {vuln.exploitability}</div>
                          <div><strong>Recommendation:</strong> {vuln.recommendation}</div>
                          <div><strong>Affected Signatures:</strong> {vuln.affectedSignatures.length}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Batch Results */}
          {batchResults && (
            <div className="bg-slate-700/30 rounded-lg p-6 space-y-4">
              <h4 className="text-lg font-semibold text-white">Batch Analysis Summary</h4>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-800/50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-white">{batchResults.analyzedTransactions}</div>
                  <div className="text-sm text-gray-400">Analyzed</div>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-red-400">{batchResults.totalVulnerabilities}</div>
                  <div className="text-sm text-gray-400">Vulnerabilities</div>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-blue-400">
                    {((batchResults.analyzedTransactions / batchResults.totalTransactions) * 100).toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-400">Success Rate</div>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-green-400">
                    {(batchResults.processingTime / 1000).toFixed(1)}s
                  </div>
                  <div className="text-sm text-gray-400">Processing Time</div>
                </div>
              </div>

              {Object.keys(batchResults.vulnerabilityBreakdown).length > 0 && (
                <div>
                  <h5 className="text-lg font-semibold text-white mb-3">Vulnerability Breakdown</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(batchResults.vulnerabilityBreakdown).map(([type, count]) => (
                      <div key={type} className="bg-slate-800/50 rounded-lg p-3 flex justify-between items-center">
                        <span className="text-gray-300">{type.replace('_', ' ')}</span>
                        <span className="text-white font-bold">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Information Panel */}
      <div className="bg-slate-700/30 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-white mb-2">Denovo Analysis Features</h3>
        <ul className="text-gray-300 text-sm space-y-1">
          <li>• <strong>Weak Nonce Detection:</strong> Identifies predictable or low-entropy nonces</li>
          <li>• <strong>Biased Nonce Detection:</strong> Detects statistical bias in nonce generation</li>
          <li>• <strong>Duplicate Nonce Detection:</strong> Finds reused nonces across signatures</li>
          <li>• <strong>Signature Malleability:</strong> Checks for malleable signature formats</li>
          <li>• <strong>Low-S Enforcement:</strong> Verifies BIP 146 compliance</li>
          <li>• <strong>Batch Processing:</strong> Analyze thousands of transactions efficiently</li>
        </ul>
      </div>
    </div>
  );
};

export default DenovoAnalyzer;