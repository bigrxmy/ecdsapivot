import React, { useState } from 'react';
import { AlertTriangle, Upload, Loader2 } from 'lucide-react';
import { AnalysisResult, ECDSASignature } from '../types/bitcoin';
import { findDuplicateNonces } from '../utils/bitcoinAnalysis';

interface Props {
  onAnalysisComplete: (results: AnalysisResult[]) => void;
}

const DuplicateNonceDetector: React.FC<Props> = ({ onAnalysisComplete }) => {
  const [signatures, setSignatures] = useState<ECDSASignature[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [fileContent, setFileContent] = useState('');

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setFileContent(content);
      parseSignatureData(content);
    };
    reader.readAsText(file);
  };

  const parseSignatureData = (content: string) => {
    try {
      const lines = content.split('\n').filter(line => line.trim());
      const parsedSignatures: ECDSASignature[] = [];

      for (const line of lines) {
        const parts = line.trim().split(' ');
        if (parts.length >= 6) {
          const [height, txid, i, r, x, ysign] = parts;
          parsedSignatures.push({
            txid,
            inputIndex: parseInt(i),
            r,
            s: '', // Will be filled when analyzing actual transactions
            z: '', // Will be filled when analyzing actual transactions
            publicKey: '',
            x
          });
        }
      }

      setSignatures(parsedSignatures);
    } catch (error) {
      console.error('Error parsing signature data:', error);
    }
  };

  const handleDetectDuplicates = async () => {
    if (signatures.length === 0) {
      return;
    }

    setIsProcessing(true);

    try {
      const duplicates = findDuplicateNonces(signatures);
      
      onAnalysisComplete([{
        type: 'duplicate',
        timestamp: Date.now(),
        data: { duplicates, count: duplicates.length },
        message: `Found ${duplicates.length} duplicate nonce groups`
      }]);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Detection failed';
      onAnalysisComplete([{
        type: 'error',
        timestamp: Date.now(),
        data: { error: errorMessage },
        message: `Duplicate detection failed: ${errorMessage}`
      }]);
    } finally {
      setIsProcessing(false);
    }
  };

  const addManualSignature = () => {
    const newSig: ECDSASignature = {
      txid: '',
      inputIndex: 0,
      r: '',
      s: '',
      z: '',
      publicKey: '',
      x: ''
    };
    setSignatures([...signatures, newSig]);
  };

  const updateSignature = (index: number, field: keyof ECDSASignature, value: string | number) => {
    const updated = [...signatures];
    updated[index] = { ...updated[index], [field]: value };
    setSignatures(updated);
  };

  const removeSignature = (index: number) => {
    setSignatures(signatures.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Duplicate Nonce Detection</h2>
        <p className="text-gray-300">
          Detect reused nonces (k values) in ECDSA signatures, which can lead to private key recovery.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Upload Signature Data File
          </label>
          <div className="flex items-center justify-center w-full">
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-600 border-dashed rounded-lg cursor-pointer bg-slate-700/30 hover:bg-slate-700/50">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-8 h-8 mb-4 text-gray-400" />
                <p className="mb-2 text-sm text-gray-400">
                  <span className="font-semibold">Click to upload</span> signature data
                </p>
                <p className="text-xs text-gray-500">Format: height txid input_index r x y_sign</p>
              </div>
              <input
                type="file"
                className="hidden"
                accept=".txt,.dupe"
                onChange={handleFileUpload}
              />
            </label>
          </div>
        </div>

        {signatures.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">
                Loaded Signatures ({signatures.length})
              </h3>
              <button
                onClick={addManualSignature}
                className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg transition-colors duration-200"
              >
                Add Manual Entry
              </button>
            </div>

            <div className="max-h-64 overflow-y-auto space-y-2">
              {signatures.slice(0, 10).map((sig, index) => (
                <div key={index} className="bg-slate-700/50 rounded-lg p-3">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-400">TXID:</span>
                      <span className="text-white ml-2 font-mono">
                        {sig.txid.substring(0, 16)}...
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400">R:</span>
                      <span className="text-white ml-2 font-mono">
                        {sig.r.substring(0, 16)}...
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
        )}

        <button
          onClick={handleDetectDuplicates}
          disabled={isProcessing || signatures.length === 0}
          className="w-full flex items-center justify-center px-6 py-3 bg-amber-600 hover:bg-amber-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors duration-200"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Detecting...
            </>
          ) : (
            <>
              <AlertTriangle className="w-5 h-5 mr-2" />
              Detect Duplicate Nonces
            </>
          )}
        </button>
      </div>

      <div className="bg-slate-700/30 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-white mb-2">Detection Process</h3>
        <ul className="text-gray-300 text-sm space-y-1">
          <li>• Groups signatures by their r-value (nonce commitment)</li>
          <li>• Identifies signatures with identical r-values but different messages</li>
          <li>• Flags potential private key recovery opportunities</li>
          <li>• Prepares data for the recovery algorithm</li>
        </ul>
      </div>
    </div>
  );
};

export default DuplicateNonceDetector;