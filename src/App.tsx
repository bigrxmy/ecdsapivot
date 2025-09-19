import React, { useState } from 'react';
import { Shield, Key, Search, AlertTriangle, CheckCircle } from 'lucide-react';
import TransactionAnalyzer from './components/TransactionAnalyzer';
import DuplicateNonceDetector from './components/DuplicateNonceDetector';
import PrivateKeyRecovery from './components/PrivateKeyRecovery';
import DenovoAnalyzer from './components/DenovoAnalyzer';
import ResultsDisplay from './components/ResultsDisplay';
import { AnalysisResult } from './types/bitcoin';

function App() {
  const [activeTab, setActiveTab] = useState<'analyze' | 'detect' | 'recover' | 'denovo'>('analyze');
  const [results, setResults] = useState<AnalysisResult[]>([]);

  const tabs = [
    { id: 'analyze' as const, label: 'Transaction Analysis', icon: Search },
    { id: 'detect' as const, label: 'Duplicate Nonce Detection', icon: AlertTriangle },
    { id: 'recover' as const, label: 'Private Key Recovery', icon: Key },
    { id: 'denovo' as const, label: 'Denovo Scanner', icon: Shield },
  ];

  const handleAnalysisComplete = (newResults: AnalysisResult[]) => {
    setResults(prev => [...prev, ...newResults]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Shield className="w-12 h-12 text-purple-400 mr-3" />
            <h1 className="text-4xl font-bold text-white">Bitcoin ECDSA Analyzer</h1>
          </div>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto">
            Advanced cryptographic analysis tool for Bitcoin transactions, ECDSA signature analysis, 
            and private key recovery from duplicate nonce usage.
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex justify-center mb-8">
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-1 border border-slate-700">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center px-6 py-3 rounded-md transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-purple-600 text-white shadow-lg'
                      : 'text-gray-300 hover:text-white hover:bg-slate-700/50'
                  }`}
                >
                  <Icon className="w-5 h-5 mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6">
              {activeTab === 'analyze' && (
                <TransactionAnalyzer onAnalysisComplete={handleAnalysisComplete} />
              )}
              {activeTab === 'detect' && (
                <DuplicateNonceDetector onAnalysisComplete={handleAnalysisComplete} />
              )}
              {activeTab === 'recover' && (
                <PrivateKeyRecovery onAnalysisComplete={handleAnalysisComplete} />
              )}
              {activeTab === 'denovo' && (
                <DenovoAnalyzer onAnalysisComplete={handleAnalysisComplete} />
              )}
            </div>
          </div>

          <div className="lg:col-span-1">
            <ResultsDisplay results={results} onClear={() => setResults([])} />
          </div>
        </div>

        {/* Security Warning */}
        <div className="mt-8 bg-amber-900/20 border border-amber-700/50 rounded-lg p-4">
          <div className="flex items-start">
            <AlertTriangle className="w-6 h-6 text-amber-400 mr-3 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-amber-400 font-semibold mb-2">Security Notice</h3>
              <p className="text-amber-200 text-sm">
                This tool is for educational and research purposes only. Never use recovered private keys 
                to access funds that don't belong to you. Always ensure you have proper authorization 
                before analyzing any Bitcoin transactions.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;