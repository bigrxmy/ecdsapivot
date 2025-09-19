import React, { useState, useRef, useEffect } from 'react';
import { 
  Zap, 
  Target, 
  Play, 
  Pause, 
  Square, 
  Upload, 
  Download, 
  Settings, 
  AlertTriangle,
  Key,
  Clock,
  TrendingUp,
  Shield,
  Cpu,
  HardDrive
} from 'lucide-react';
import { 
  AttackConfig, 
  AttackResult, 
  AttackProgress, 
  BruteForceConfig,
  DictionaryAttackConfig,
  KeyspaceAnalysis,
  AttackVector
} from '../types/attackaio';
import { AttackAIO, analyzeKeyspace, getAttackVectors } from '../utils/attackaio';
import { AnalysisResult } from '../types/bitcoin';

interface Props {
  onAnalysisComplete: (results: AnalysisResult[]) => void;
}

const AttackAIOCrypto: React.FC<Props> = ({ onAnalysisComplete }) => {
  const [activeAttack, setActiveAttack] = useState<'brute_force' | 'dictionary' | 'pollard_rho' | 'baby_giant'>('brute_force');
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState<AttackProgress>({
    current: '',
    attempts: 0,
    rate: 0,
    eta: 0,
    percentage: 0
  });
  const [result, setResult] = useState<AttackResult | null>(null);
  const [keyspaceAnalysis, setKeyspaceAnalysis] = useState<KeyspaceAnalysis | null>(null);
  
  // Brute Force Config
  const [bruteForceConfig, setBruteForceConfig] = useState<BruteForceConfig>({
    startKey: '1',
    endKey: 'fffff',
    targetAddress: '',
    compressed: false,
    threads: 4
  });
  
  // Dictionary Config
  const [dictionaryConfig, setDictionaryConfig] = useState<DictionaryAttackConfig>({
    wordlist: [],
    targetAddress: '',
    variations: true,
    compressed: false
  });
  
  // Advanced Config
  const [advancedConfig, setAdvancedConfig] = useState({
    targetPublicKey: '',
    maxIterations: 1000000,
    batchSize: 10000
  });

  const attackAIORef = useRef<AttackAIO>(new AttackAIO());
  const abortControllerRef = useRef<AbortController | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (bruteForceConfig.startKey && bruteForceConfig.endKey) {
      try {
        const analysis = analyzeKeyspace(
          bruteForceConfig.startKey.padStart(64, '0'),
          bruteForceConfig.endKey.padStart(64, '0')
        );
        setKeyspaceAnalysis(analysis);
      } catch (error) {
        setKeyspaceAnalysis(null);
      }
    }
  }, [bruteForceConfig.startKey, bruteForceConfig.endKey]);

  const handleStartAttack = async () => {
    if (isRunning) return;

    setIsRunning(true);
    setIsPaused(false);
    setResult(null);
    abortControllerRef.current = new AbortController();

    try {
      let attackResult: AttackResult;

      switch (activeAttack) {
        case 'brute_force':
          if (!bruteForceConfig.targetAddress) {
            throw new Error('Target address is required for brute force attack');
          }
          attackResult = await attackAIORef.current.bruteForcePuzzle(
            bruteForceConfig,
            setProgress,
            abortControllerRef.current.signal
          );
          break;

        case 'dictionary':
          if (!dictionaryConfig.targetAddress || dictionaryConfig.wordlist.length === 0) {
            throw new Error('Target address and wordlist are required for dictionary attack');
          }
          attackResult = await attackAIORef.current.dictionaryAttack(
            dictionaryConfig,
            setProgress,
            abortControllerRef.current.signal
          );
          break;

        case 'pollard_rho':
          if (!advancedConfig.targetPublicKey) {
            throw new Error('Target public key is required for Pollard\'s Rho attack');
          }
          attackResult = await attackAIORef.current.pollardRho(
            advancedConfig.targetPublicKey,
            setProgress,
            abortControllerRef.current.signal
          );
          break;

        case 'baby_giant':
          if (!advancedConfig.targetPublicKey) {
            throw new Error('Target public key is required for Baby-step Giant-step attack');
          }
          attackResult = await attackAIORef.current.babyGiantStep(
            advancedConfig.targetPublicKey,
            setProgress,
            abortControllerRef.current.signal
          );
          break;

        default:
          throw new Error('Unknown attack method');
      }

      setResult(attackResult);
      
      onAnalysisComplete([{
        type: attackResult.found ? 'recovery' : 'error',
        timestamp: Date.now(),
        data: attackResult,
        message: attackResult.found 
          ? `Private key found using ${attackResult.method}!`
          : `Attack completed without finding the key (${attackResult.attempts} attempts)`
      }]);

    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        onAnalysisComplete([{
          type: 'error',
          timestamp: Date.now(),
          data: { error: error.message },
          message: `Attack failed: ${error.message}`
        }]);
      }
    } finally {
      setIsRunning(false);
      setIsPaused(false);
      abortControllerRef.current = null;
    }
  };

  const handleStopAttack = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    attackAIORef.current.stop();
    setIsRunning(false);
    setIsPaused(false);
  };

  const handlePauseResume = () => {
    setIsPaused(!isPaused);
    // Note: Actual pause/resume would require more complex state management
  };

  const handleWordlistUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const words = content.split('\n').filter(line => line.trim()).map(line => line.trim());
      setDictionaryConfig(prev => ({ ...prev, wordlist: words }));
    };
    reader.readAsText(file);
  };

  const loadExampleConfigs = () => {
    switch (activeAttack) {
      case 'brute_force':
        setBruteForceConfig({
          startKey: '1',
          endKey: 'fffff',
          targetAddress: '1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2',
          compressed: false,
          threads: 4
        });
        break;
      case 'dictionary':
        setDictionaryConfig({
          wordlist: ['password', 'bitcoin', 'satoshi', 'blockchain', 'crypto', '123456', 'admin'],
          targetAddress: '1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2',
          variations: true,
          compressed: false
        });
        break;
      case 'pollard_rho':
      case 'baby_giant':
        setAdvancedConfig({
          targetPublicKey: '04d0de0aaeaefad02b8bdc8a01a1b8b11c696bd3d66a2c5f10780d95b7df42645cd85228a6fb29940e858e7e55842ae2bd115d1ed7cc0e82d934e929c97648cb0a',
          maxIterations: 1000000,
          batchSize: 10000
        });
        break;
    }
  };

  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${seconds.toFixed(1)}s`;
    if (seconds < 3600) return `${(seconds / 60).toFixed(1)}m`;
    if (seconds < 86400) return `${(seconds / 3600).toFixed(1)}h`;
    return `${(seconds / 86400).toFixed(1)}d`;
  };

  const formatNumber = (num: number): string => {
    if (num >= 1e9) return `${(num / 1e9).toFixed(1)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(1)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`;
    return num.toString();
  };

  const getDifficultyColor = (difficulty: KeyspaceAnalysis['difficulty']) => {
    switch (difficulty) {
      case 'TRIVIAL': return 'text-green-400';
      case 'EASY': return 'text-blue-400';
      case 'MEDIUM': return 'text-yellow-400';
      case 'HARD': return 'text-orange-400';
      case 'IMPOSSIBLE': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const attackVectors = getAttackVectors();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">AttackAIO Crypto Suite</h2>
        <p className="text-gray-300">
          Advanced cryptographic attack toolkit for Bitcoin private key recovery and analysis.
        </p>
      </div>

      {/* Attack Method Selection */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { id: 'brute_force' as const, label: 'Brute Force', icon: Zap },
          { id: 'dictionary' as const, label: 'Dictionary', icon: Target },
          { id: 'pollard_rho' as const, label: 'Pollard\'s Rho', icon: TrendingUp },
          { id: 'baby_giant' as const, label: 'Baby-Giant', icon: Shield }
        ].map((method) => {
          const Icon = method.icon;
          return (
            <button
              key={method.id}
              onClick={() => setActiveAttack(method.id)}
              className={`p-4 rounded-lg border transition-all duration-200 ${
                activeAttack === method.id
                  ? 'bg-purple-600/20 border-purple-500 text-purple-300'
                  : 'bg-slate-700/30 border-slate-600 text-gray-300 hover:bg-slate-700/50'
              }`}
            >
              <Icon className="w-6 h-6 mx-auto mb-2" />
              <div className="text-sm font-medium">{method.label}</div>
            </button>
          );
        })}
      </div>

      {/* Configuration Panel */}
      <div className="bg-slate-700/30 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Attack Configuration</h3>
          <button
            onClick={loadExampleConfigs}
            className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white text-sm rounded-lg transition-colors duration-200"
          >
            Load Example
          </button>
        </div>

        {/* Brute Force Config */}
        {activeAttack === 'brute_force' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Start Key (Hex)</label>
                <input
                  type="text"
                  value={bruteForceConfig.startKey}
                  onChange={(e) => setBruteForceConfig(prev => ({ ...prev, startKey: e.target.value }))}
                  placeholder="1"
                  className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">End Key (Hex)</label>
                <input
                  type="text"
                  value={bruteForceConfig.endKey}
                  onChange={(e) => setBruteForceConfig(prev => ({ ...prev, endKey: e.target.value }))}
                  placeholder="fffff"
                  className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Target Address</label>
              <input
                type="text"
                value={bruteForceConfig.targetAddress}
                onChange={(e) => setBruteForceConfig(prev => ({ ...prev, targetAddress: e.target.value }))}
                placeholder="Enter Bitcoin address..."
                className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-sm"
              />
            </div>
            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={bruteForceConfig.compressed}
                  onChange={(e) => setBruteForceConfig(prev => ({ ...prev, compressed: e.target.checked }))}
                  className="rounded bg-slate-600 border-slate-500 text-purple-600 focus:ring-purple-500"
                />
                <span className="text-sm text-gray-300">Compressed Address</span>
              </label>
              <div className="flex items-center space-x-2">
                <Cpu className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-300">Threads:</span>
                <input
                  type="number"
                  value={bruteForceConfig.threads}
                  onChange={(e) => setBruteForceConfig(prev => ({ ...prev, threads: parseInt(e.target.value) || 1 }))}
                  min="1"
                  max="16"
                  className="w-16 px-2 py-1 bg-slate-700/50 border border-slate-600 rounded text-white text-sm"
                />
              </div>
            </div>
          </div>
        )}

        {/* Dictionary Config */}
        {activeAttack === 'dictionary' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Target Address</label>
              <input
                type="text"
                value={dictionaryConfig.targetAddress}
                onChange={(e) => setDictionaryConfig(prev => ({ ...prev, targetAddress: e.target.value }))}
                placeholder="Enter Bitcoin address..."
                className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Wordlist</label>
              <div className="flex items-center space-x-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt"
                  onChange={handleWordlistUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg transition-colors duration-200"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Wordlist
                </button>
                <span className="text-sm text-gray-400">
                  {dictionaryConfig.wordlist.length} words loaded
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={dictionaryConfig.variations}
                  onChange={(e) => setDictionaryConfig(prev => ({ ...prev, variations: e.target.checked }))}
                  className="rounded bg-slate-600 border-slate-500 text-purple-600 focus:ring-purple-500"
                />
                <span className="text-sm text-gray-300">Generate Variations</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={dictionaryConfig.compressed}
                  onChange={(e) => setDictionaryConfig(prev => ({ ...prev, compressed: e.target.checked }))}
                  className="rounded bg-slate-600 border-slate-500 text-purple-600 focus:ring-purple-500"
                />
                <span className="text-sm text-gray-300">Compressed Address</span>
              </label>
            </div>
          </div>
        )}

        {/* Advanced Algorithms Config */}
        {(activeAttack === 'pollard_rho' || activeAttack === 'baby_giant') && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Target Public Key</label>
              <input
                type="text"
                value={advancedConfig.targetPublicKey}
                onChange={(e) => setAdvancedConfig(prev => ({ ...prev, targetPublicKey: e.target.value }))}
                placeholder="Enter uncompressed public key (04...)"
                className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-sm"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Max Iterations</label>
                <input
                  type="number"
                  value={advancedConfig.maxIterations}
                  onChange={(e) => setAdvancedConfig(prev => ({ ...prev, maxIterations: parseInt(e.target.value) || 1000000 }))}
                  className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Batch Size</label>
                <input
                  type="number"
                  value={advancedConfig.batchSize}
                  onChange={(e) => setAdvancedConfig(prev => ({ ...prev, batchSize: parseInt(e.target.value) || 10000 }))}
                  className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Keyspace Analysis */}
      {keyspaceAnalysis && activeAttack === 'brute_force' && (
        <div className="bg-slate-700/30 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-white mb-3">Keyspace Analysis</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-800/50 rounded-lg p-3">
              <div className="text-sm text-gray-400 mb-1">Total Keys</div>
              <div className="text-lg font-bold text-white">
                {keyspaceAnalysis.totalKeys.toString()}
              </div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-3">
              <div className="text-sm text-gray-400 mb-1">Estimated Time</div>
              <div className="text-lg font-bold text-white">
                {formatTime(keyspaceAnalysis.estimatedTime)}
              </div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-3">
              <div className="text-sm text-gray-400 mb-1">Difficulty</div>
              <div className={`text-lg font-bold ${getDifficultyColor(keyspaceAnalysis.difficulty)}`}>
                {keyspaceAnalysis.difficulty}
              </div>
            </div>
          </div>
          <div className="mt-3 text-sm text-gray-300">
            {keyspaceAnalysis.recommendation}
          </div>
        </div>
      )}

      {/* Control Panel */}
      <div className="flex items-center justify-center space-x-4">
        {!isRunning ? (
          <button
            onClick={handleStartAttack}
            className="flex items-center px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors duration-200"
          >
            <Play className="w-5 h-5 mr-2" />
            Start Attack
          </button>
        ) : (
          <>
            <button
              onClick={handlePauseResume}
              className="flex items-center px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors duration-200"
            >
              {isPaused ? <Play className="w-4 h-4 mr-2" /> : <Pause className="w-4 h-4 mr-2" />}
              {isPaused ? 'Resume' : 'Pause'}
            </button>
            <button
              onClick={handleStopAttack}
              className="flex items-center px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors duration-200"
            >
              <Square className="w-4 h-4 mr-2" />
              Stop
            </button>
          </>
        )}
      </div>

      {/* Progress Display */}
      {isRunning && (
        <div className="bg-slate-700/30 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Attack Progress</h3>
          
          <div className="space-y-4">
            <div className="w-full bg-slate-700 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-purple-600 to-red-600 h-3 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(progress.percentage, 100)}%` }}
              />
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-800/50 rounded-lg p-3">
                <div className="text-sm text-gray-400 mb-1">Progress</div>
                <div className="text-lg font-bold text-white">
                  {progress.percentage.toFixed(2)}%
                </div>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-3">
                <div className="text-sm text-gray-400 mb-1">Attempts</div>
                <div className="text-lg font-bold text-white">
                  {formatNumber(progress.attempts)}
                </div>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-3">
                <div className="text-sm text-gray-400 mb-1">Rate</div>
                <div className="text-lg font-bold text-white">
                  {formatNumber(progress.rate)}/s
                </div>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-3">
                <div className="text-sm text-gray-400 mb-1">ETA</div>
                <div className="text-lg font-bold text-white">
                  {formatTime(progress.eta)}
                </div>
              </div>
            </div>
            
            <div className="bg-slate-800/50 rounded-lg p-3">
              <div className="text-sm text-gray-400 mb-1">Current Key</div>
              <div className="font-mono text-sm text-white break-all">
                {progress.current}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Results Display */}
      {result && (
        <div className={`rounded-lg p-6 ${result.found ? 'bg-green-900/20 border border-green-700/50' : 'bg-red-900/20 border border-red-700/50'}`}>
          <h3 className={`text-lg font-semibold mb-4 ${result.found ? 'text-green-400' : 'text-red-400'}`}>
            Attack {result.found ? 'Successful' : 'Completed'}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="bg-slate-800/50 rounded-lg p-3">
              <div className="text-sm text-gray-400 mb-1">Method</div>
              <div className="text-white font-medium">{result.method.replace('_', ' ').toUpperCase()}</div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-3">
              <div className="text-sm text-gray-400 mb-1">Attempts</div>
              <div className="text-white font-medium">{formatNumber(result.attempts)}</div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-3">
              <div className="text-sm text-gray-400 mb-1">Time Elapsed</div>
              <div className="text-white font-medium">{formatTime(result.timeElapsed / 1000)}</div>
            </div>
          </div>
          
          {result.found && result.privateKey && (
            <div className="space-y-3">
              <div className="bg-slate-800/50 rounded-lg p-3">
                <div className="text-sm text-gray-400 mb-1">Private Key (Hex)</div>
                <div className="font-mono text-sm text-green-300 break-all">{result.privateKey}</div>
              </div>
              {result.publicKey && (
                <div className="bg-slate-800/50 rounded-lg p-3">
                  <div className="text-sm text-gray-400 mb-1">Public Key</div>
                  <div className="font-mono text-sm text-green-300 break-all">{result.publicKey}</div>
                </div>
              )}
              {result.address && (
                <div className="bg-slate-800/50 rounded-lg p-3">
                  <div className="text-sm text-gray-400 mb-1">Address</div>
                  <div className="font-mono text-sm text-green-300 break-all">{result.address}</div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Attack Vectors Information */}
      <div className="bg-slate-700/30 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Available Attack Vectors</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {attackVectors.map((vector, index) => (
            <div key={index} className="bg-slate-800/50 rounded-lg p-4">
              <h4 className="font-semibold text-white mb-2">{vector.name}</h4>
              <p className="text-sm text-gray-300 mb-2">{vector.description}</p>
              <div className="space-y-1 text-xs text-gray-400">
                <div><strong>Complexity:</strong> {vector.complexity}</div>
                <div><strong>Success Rate:</strong> {vector.successRate}%</div>
                <div><strong>Est. Time:</strong> {vector.estimatedTime}</div>
                <div><strong>Requirements:</strong> {vector.requirements.join(', ')}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Security Warning */}
      <div className="bg-red-900/20 border border-red-700/50 rounded-lg p-4">
        <div className="flex items-start">
          <AlertTriangle className="w-6 h-6 text-red-400 mr-3 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="text-red-400 font-semibold mb-2">Critical Security Warning</h3>
            <p className="text-red-200 text-sm">
              This tool is for educational and authorized security testing only. Using these attacks 
              against addresses you don't own is illegal. The computational requirements for breaking 
              properly generated Bitcoin private keys are astronomically high and not feasible with 
              current technology.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttackAIOCrypto;