import React, { useState } from 'react';
import { Key, Loader2, AlertCircle, Copy } from 'lucide-react';
import { AnalysisResult } from '../types/bitcoin';
import { recoverPrivateKey } from '../utils/bitcoinAnalysis';

interface Props {
  onAnalysisComplete: (results: AnalysisResult[]) => void;
}

interface SignaturePair {
  r: string;
  s1: string;
  s2: string;
  z1: string;
  z2: string;
  publicKey: string;
}

const PrivateKeyRecovery: React.FC<Props> = ({ onAnalysisComplete }) => {
  const [signaturePair, setSignaturePair] = useState<SignaturePair>({
    r: '',
    s1: '',
    s2: '',
    z1: '',
    z2: '',
    publicKey: ''
  });
  const [isRecovering, setIsRecovering] = useState(false);
  const [recoveredKey, setRecoveredKey] = useState('');

  const handleInputChange = (field: keyof SignaturePair, value: string) => {
    setSignaturePair(prev => ({ ...prev, [field]: value }));
  };

  const handleRecover = async () => {
    const { r, s1, s2, z1, z2, publicKey } = signaturePair;
    
    if (!r || !s1 || !s2 || !z1 || !z2 || !publicKey) {
      onAnalysisComplete([{
        type: 'error',
        timestamp: Date.now(),
        data: { error: 'All fields are required' },
        message: 'Please fill in all signature parameters'
      }]);
      return;
    }

    setIsRecovering(true);
    setRecoveredKey('');

    try {
      const result = recoverPrivateKey(r, s1, s2, z1, z2, publicKey);
      
      if (result) {
        setRecoveredKey(result.privateKey);
        onAnalysisComplete([{
          type: 'recovery',
          timestamp: Date.now(),
          data: result,
          message: `Successfully recovered private key`
        }]);
      } else {
        onAnalysisComplete([{
          type: 'error',
          timestamp: Date.now(),
          data: { error: 'Recovery failed' },
          message: 'Could not recover private key from provided signatures'
        }]);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Recovery failed';
      onAnalysisComplete([{
        type: 'error',
        timestamp: Date.now(),
        data: { error: errorMessage },
        message: `Private key recovery failed: ${errorMessage}`
      }]);
    } finally {
      setIsRecovering(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const loadExampleData = () => {
    setSignaturePair({
      r: '00d47ce4c025c35ec440bc81d99834a624875161a26bf56ef7fdc0f5d52f843ad1',
      s1: '44e1ff2dfd8102cf7a47c21d5c9fd5701610d04953c6836596b4fe9dd2f53e3e',
      s2: '9a5f1c75e461d7ceb1cf3cab9013eb2dc85b6d0da8c3c6e27e3a5a5b3faa5bab',
      z1: '4f434e415354455220524f434b532121',
      z2: '4f434e4153544552204c4f434b532121',
      publicKey: '04d0de0aaeaefad02b8bdc8a01a1b8b11c696bd3d66a2c5f10780d95b7df42645cd85228a6fb29940e858e7e55842ae2bd115d1ed7cc0e82d934e929c97648cb0a'
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Private Key Recovery</h2>
        <p className="text-gray-300">
          Recover private keys from ECDSA signatures that reuse the same nonce (k value).
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex justify-end">
          <button
            onClick={loadExampleData}
            className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white text-sm rounded-lg transition-colors duration-200"
          >
            Load Example Data
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              R Value (shared nonce commitment)
            </label>
            <input
              type="text"
              value={signaturePair.r}
              onChange={(e) => handleInputChange('r', e.target.value)}
              placeholder="Enter r value..."
              className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm font-mono"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Public Key
            </label>
            <input
              type="text"
              value={signaturePair.publicKey}
              onChange={(e) => handleInputChange('publicKey', e.target.value)}
              placeholder="Enter public key..."
              className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm font-mono"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Signature 1</h3>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">S1 Value</label>
              <input
                type="text"
                value={signaturePair.s1}
                onChange={(e) => handleInputChange('s1', e.target.value)}
                placeholder="Enter s1 value..."
                className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm font-mono"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Z1 (Message Hash)</label>
              <input
                type="text"
                value={signaturePair.z1}
                onChange={(e) => handleInputChange('z1', e.target.value)}
                placeholder="Enter z1 value..."
                className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm font-mono"
              />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Signature 2</h3>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">S2 Value</label>
              <input
                type="text"
                value={signaturePair.s2}
                onChange={(e) => handleInputChange('s2', e.target.value)}
                placeholder="Enter s2 value..."
                className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm font-mono"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Z2 (Message Hash)</label>
              <input
                type="text"
                value={signaturePair.z2}
                onChange={(e) => handleInputChange('z2', e.target.value)}
                placeholder="Enter z2 value..."
                className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm font-mono"
              />
            </div>
          </div>
        </div>

        {recoveredKey && (
          <div className="bg-green-900/20 border border-green-700/50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-green-400 font-semibold">Recovered Private Key</h3>
              <button
                onClick={() => copyToClipboard(recoveredKey)}
                className="flex items-center px-3 py-1 bg-green-700/50 hover:bg-green-700 text-green-300 rounded text-sm transition-colors duration-200"
              >
                <Copy className="w-4 h-4 mr-1" />
                Copy
              </button>
            </div>
            <div className="bg-slate-800/50 rounded p-3 font-mono text-sm text-green-300 break-all">
              {recoveredKey}
            </div>
          </div>
        )}

        <button
          onClick={handleRecover}
          disabled={isRecovering}
          className="w-full flex items-center justify-center px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors duration-200"
        >
          {isRecovering ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Recovering...
            </>
          ) : (
            <>
              <Key className="w-5 h-5 mr-2" />
              Recover Private Key
            </>
          )}
        </button>
      </div>

      <div className="bg-slate-700/30 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-white mb-2">Recovery Algorithm</h3>
        <ul className="text-gray-300 text-sm space-y-1">
          <li>• Uses the formula: k = (z1 - z2) / (s1 - s2) mod n</li>
          <li>• Recovers private key: d = (s1 * k - z1) / r mod n</li>
          <li>• Verifies the recovered key matches the public key</li>
          <li>• Works only when the same nonce k is used for different messages</li>
        </ul>
      </div>

      <div className="bg-red-900/20 border border-red-700/50 rounded-lg p-4">
        <div className="flex items-start">
          <AlertCircle className="w-6 h-6 text-red-400 mr-3 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="text-red-400 font-semibold mb-2">Critical Warning</h3>
            <p className="text-red-200 text-sm">
              This tool can recover actual private keys. Only use it on transactions you own or have 
              explicit permission to analyze. Unauthorized access to Bitcoin funds is illegal.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivateKeyRecovery;