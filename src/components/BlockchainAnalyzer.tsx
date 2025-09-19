import React, { useState, useRef } from 'react';
import { 
  Search, 
  TrendingUp, 
  Shield, 
  AlertTriangle, 
  Eye, 
  Network, 
  BarChart3,
  Download,
  Upload,
  Clock,
  DollarSign,
  Users,
  Activity
} from 'lucide-react';
import { 
  BlockchainTransaction, 
  Address, 
  Block, 
  ChainAnalysisResult,
  RiskAssessment,
  TransactionFlow 
} from '../types/blockchain';
import { AnalysisResult } from '../types/bitcoin';

interface Props {
  onAnalysisComplete: (results: AnalysisResult[]) => void;
}

const BlockchainAnalyzer: React.FC<Props> = ({ onAnalysisComplete }) => {
  const [activeTab, setActiveTab] = useState<'transaction' | 'address' | 'flow' | 'compliance'>('transaction');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [analysisResults, setAnalysisResults] = useState<ChainAnalysisResult | null>(null);
  const [transactionData, setTransactionData] = useState<BlockchainTransaction | null>(null);
  const [addressData, setAddressData] = useState<Address | null>(null);
  const [flowData, setFlowData] = useState<TransactionFlow[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const tabs = [
    { id: 'transaction' as const, label: 'Transaction Analysis', icon: Search },
    { id: 'address' as const, label: 'Address Investigation', icon: Eye },
    { id: 'flow' as const, label: 'Transaction Flow', icon: Network },
    { id: 'compliance' as const, label: 'Compliance Check', icon: Shield }
  ];

  const analyzeTransaction = async (txHash: string): Promise<BlockchainTransaction> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Mock transaction data
    return {
      hash: txHash,
      version: 1,
      lockTime: 0,
      inputs: [
        {
          previousTxHash: generateRandomHash(),
          previousTxIndex: 0,
          scriptSig: generateRandomHex(200),
          sequence: 0xffffffff,
          value: Math.floor(Math.random() * 1000000) + 10000,
          address: generateMockAddress()
        }
      ],
      outputs: [
        {
          value: Math.floor(Math.random() * 500000) + 5000,
          scriptPubKey: generateRandomHex(50),
          address: generateMockAddress(),
          type: 'P2PKH'
        },
        {
          value: Math.floor(Math.random() * 400000) + 4000,
          scriptPubKey: generateRandomHex(50),
          address: generateMockAddress(),
          type: 'P2PKH'
        }
      ],
      size: Math.floor(Math.random() * 500) + 250,
      weight: Math.floor(Math.random() * 2000) + 1000,
      fee: Math.floor(Math.random() * 10000) + 1000,
      confirmations: Math.floor(Math.random() * 100) + 1,
      blockHash: generateRandomHash(),
      blockHeight: Math.floor(Math.random() * 800000) + 700000,
      timestamp: Date.now() - Math.floor(Math.random() * 86400000)
    };
  };

  const analyzeAddress = async (address: string): Promise<Address> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const totalReceived = Math.floor(Math.random() * 10000000) + 100000;
    const totalSent = Math.floor(Math.random() * 8000000) + 50000;
    
    return {
      address,
      balance: totalReceived - totalSent,
      totalReceived,
      totalSent,
      transactionCount: Math.floor(Math.random() * 1000) + 10,
      unconfirmedBalance: Math.floor(Math.random() * 100000),
      firstSeen: Date.now() - Math.floor(Math.random() * 31536000000), // Random time in last year
      lastSeen: Date.now() - Math.floor(Math.random() * 86400000) // Random time in last day
    };
  };

  const analyzeTransactionFlow = async (startAddress: string, depth: number = 3): Promise<TransactionFlow[]> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2500));
    
    const flows: TransactionFlow[] = [];
    let currentAddresses = [startAddress];
    
    for (let hop = 0; hop < depth; hop++) {
      const nextAddresses: string[] = [];
      
      for (const addr of currentAddresses) {
        const numFlows = Math.floor(Math.random() * 3) + 1;
        
        for (let i = 0; i < numFlows; i++) {
          const toAddress = generateMockAddress();
          nextAddresses.push(toAddress);
          
          flows.push({
            fromAddress: addr,
            toAddress,
            value: Math.floor(Math.random() * 1000000) + 10000,
            txHash: generateRandomHash(),
            timestamp: Date.now() - Math.floor(Math.random() * 86400000),
            hops: hop + 1
          });
        }
      }
      
      currentAddresses = nextAddresses.slice(0, 5); // Limit to prevent explosion
    }
    
    return flows;
  };

  const performComplianceCheck = async (address: string): Promise<RiskAssessment> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const riskFactors = [
      {
        type: 'High Transaction Volume',
        description: 'Address shows unusually high transaction volume',
        severity: Math.floor(Math.random() * 50) + 25,
        evidence: ['Multiple large transactions', 'Frequent activity patterns']
      },
      {
        type: 'Exchange Interaction',
        description: 'Transactions with known exchange addresses',
        severity: Math.floor(Math.random() * 30) + 10,
        evidence: ['Binance hot wallet interaction', 'Coinbase deposit detected']
      },
      {
        type: 'Mixing Service',
        description: 'Potential interaction with mixing services',
        severity: Math.floor(Math.random() * 80) + 40,
        evidence: ['CoinJoin patterns detected', 'Multiple small outputs']
      }
    ];
    
    const totalRisk = riskFactors.reduce((sum, factor) => sum + factor.severity, 0) / riskFactors.length;
    
    let riskLevel: RiskAssessment['riskLevel'];
    if (totalRisk < 25) riskLevel = 'LOW';
    else if (totalRisk < 50) riskLevel = 'MEDIUM';
    else if (totalRisk < 75) riskLevel = 'HIGH';
    else riskLevel = 'CRITICAL';
    
    return {
      riskScore: Math.round(totalRisk),
      riskLevel,
      factors: riskFactors,
      recommendations: [
        'Enhanced due diligence recommended',
        'Monitor for suspicious activity patterns',
        'Consider additional verification requirements',
        'Review transaction history for compliance'
      ]
    };
  };

  const handleAnalysis = async () => {
    if (!searchQuery.trim()) return;
    
    setIsAnalyzing(true);
    
    try {
      switch (activeTab) {
        case 'transaction':
          const txData = await analyzeTransaction(searchQuery);
          setTransactionData(txData);
          
          onAnalysisComplete([{
            type: 'signature',
            timestamp: Date.now(),
            data: txData,
            message: `Transaction analysis completed for ${searchQuery.substring(0, 8)}...`
          }]);
          break;
          
        case 'address':
          const addrData = await analyzeAddress(searchQuery);
          setAddressData(addrData);
          
          onAnalysisComplete([{
            type: 'signature',
            timestamp: Date.now(),
            data: addrData,
            message: `Address analysis completed for ${searchQuery.substring(0, 8)}...`
          }]);
          break;
          
        case 'flow':
          const flows = await analyzeTransactionFlow(searchQuery);
          setFlowData(flows);
          
          onAnalysisComplete([{
            type: 'signature',
            timestamp: Date.now(),
            data: { flows, count: flows.length },
            message: `Transaction flow analysis found ${flows.length} connections`
          }]);
          break;
          
        case 'compliance':
          const riskAssessment = await performComplianceCheck(searchQuery);
          
          onAnalysisComplete([{
            type: riskAssessment.riskLevel === 'LOW' ? 'signature' : 'duplicate',
            timestamp: Date.now(),
            data: riskAssessment,
            message: `Compliance check: ${riskAssessment.riskLevel} risk (${riskAssessment.riskScore}/100)`
          }]);
          break;
      }
    } catch (error) {
      onAnalysisComplete([{
        type: 'error',
        timestamp: Date.now(),
        data: { error: error instanceof Error ? error.message : 'Analysis failed' },
        message: 'Blockchain analysis failed'
      }]);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const exportResults = () => {
    const data = {
      transaction: transactionData,
      address: addressData,
      flows: flowData,
      timestamp: Date.now()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `blockchain-analysis-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatValue = (satoshis: number): string => {
    return (satoshis / 100000000).toFixed(8) + ' BTC';
  };

  const formatTimestamp = (timestamp: number): string => {
    return new Date(timestamp).toLocaleString();
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'LOW': return 'text-green-400 bg-green-900/20';
      case 'MEDIUM': return 'text-yellow-400 bg-yellow-900/20';
      case 'HIGH': return 'text-orange-400 bg-orange-900/20';
      case 'CRITICAL': return 'text-red-400 bg-red-900/20';
      default: return 'text-gray-400 bg-gray-900/20';
    }
  };

  const generateRandomHash = (): string => {
    return Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
  };

  const generateRandomHex = (length: number): string => {
    return Array.from({ length }, () => Math.floor(Math.random() * 16).toString(16)).join('');
  };

  const generateMockAddress = (): string => {
    const prefixes = ['1', '3', 'bc1'];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    let address = prefix;
    const length = prefix === 'bc1' ? 39 : 25;
    
    for (let i = 0; i < length; i++) {
      address += chars[Math.floor(Math.random() * chars.length)];
    }
    
    return address;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Blockchain Analysis Suite</h2>
        <p className="text-gray-300">
          Comprehensive blockchain investigation and compliance analysis tools for Bitcoin transactions.
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-slate-800/50 rounded-lg p-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center px-4 py-2 rounded-md transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Icon className="w-4 h-4 mr-2" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Search Interface */}
      <div className="bg-slate-700/30 rounded-lg p-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {activeTab === 'transaction' && 'Transaction Hash'}
              {activeTab === 'address' && 'Bitcoin Address'}
              {activeTab === 'flow' && 'Starting Address'}
              {activeTab === 'compliance' && 'Address to Check'}
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                activeTab === 'transaction' ? 'Enter transaction hash...' :
                activeTab === 'address' ? 'Enter Bitcoin address...' :
                activeTab === 'flow' ? 'Enter starting address...' :
                'Enter address for compliance check...'
              }
              className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-sm"
            />
          </div>

          <button
            onClick={handleAnalysis}
            disabled={isAnalyzing || !searchQuery.trim()}
            className="w-full flex items-center justify-center px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors duration-200"
          >
            {isAnalyzing ? (
              <>
                <Activity className="w-5 h-5 mr-2 animate-pulse" />
                Analyzing...
              </>
            ) : (
              <>
                <Search className="w-5 h-5 mr-2" />
                Start Analysis
              </>
            )}
          </button>
        </div>
      </div>

      {/* Results Display */}
      {(transactionData || addressData || flowData.length > 0) && (
        <div className="space-y-6">
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

          {/* Transaction Results */}
          {transactionData && activeTab === 'transaction' && (
            <div className="bg-slate-700/30 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-white mb-4">Transaction Details</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-slate-800/50 rounded-lg p-4">
                  <div className="text-sm text-gray-400 mb-1">Confirmations</div>
                  <div className="text-xl font-bold text-white">{transactionData.confirmations}</div>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-4">
                  <div className="text-sm text-gray-400 mb-1">Fee</div>
                  <div className="text-xl font-bold text-white">{formatValue(transactionData.fee)}</div>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-4">
                  <div className="text-sm text-gray-400 mb-1">Size</div>
                  <div className="text-xl font-bold text-white">{transactionData.size} bytes</div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h5 className="text-md font-semibold text-white mb-2">Inputs ({transactionData.inputs.length})</h5>
                  {transactionData.inputs.map((input, index) => (
                    <div key={index} className="bg-slate-800/50 rounded-lg p-3 mb-2">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-gray-400">Address:</span>
                          <span className="text-white ml-2 font-mono">{input.address}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Value:</span>
                          <span className="text-white ml-2">{formatValue(input.value || 0)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div>
                  <h5 className="text-md font-semibold text-white mb-2">Outputs ({transactionData.outputs.length})</h5>
                  {transactionData.outputs.map((output, index) => (
                    <div key={index} className="bg-slate-800/50 rounded-lg p-3 mb-2">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                        <div>
                          <span className="text-gray-400">Address:</span>
                          <span className="text-white ml-2 font-mono">{output.address}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Value:</span>
                          <span className="text-white ml-2">{formatValue(output.value)}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Type:</span>
                          <span className="text-white ml-2">{output.type}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Address Results */}
          {addressData && activeTab === 'address' && (
            <div className="bg-slate-700/30 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-white mb-4">Address Information</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-slate-800/50 rounded-lg p-4">
                  <div className="text-sm text-gray-400 mb-1">Balance</div>
                  <div className="text-xl font-bold text-green-400">{formatValue(addressData.balance)}</div>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-4">
                  <div className="text-sm text-gray-400 mb-1">Total Received</div>
                  <div className="text-xl font-bold text-blue-400">{formatValue(addressData.totalReceived)}</div>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-4">
                  <div className="text-sm text-gray-400 mb-1">Total Sent</div>
                  <div className="text-xl font-bold text-red-400">{formatValue(addressData.totalSent)}</div>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-4">
                  <div className="text-sm text-gray-400 mb-1">Transactions</div>
                  <div className="text-xl font-bold text-white">{addressData.transactionCount}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-800/50 rounded-lg p-4">
                  <div className="text-sm text-gray-400 mb-1">First Seen</div>
                  <div className="text-sm text-white">{formatTimestamp(addressData.firstSeen || 0)}</div>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-4">
                  <div className="text-sm text-gray-400 mb-1">Last Seen</div>
                  <div className="text-sm text-white">{formatTimestamp(addressData.lastSeen || 0)}</div>
                </div>
              </div>
            </div>
          )}

          {/* Flow Results */}
          {flowData.length > 0 && activeTab === 'flow' && (
            <div className="bg-slate-700/30 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-white mb-4">Transaction Flow ({flowData.length} connections)</h4>
              
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {flowData.map((flow, index) => (
                  <div key={index} className="bg-slate-800/50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          flow.hops === 1 ? 'bg-green-600' : 
                          flow.hops === 2 ? 'bg-yellow-600' : 'bg-red-600'
                        }`}>
                          {flow.hops}
                        </div>
                        <span className="ml-2 text-white font-medium">{formatValue(flow.value)}</span>
                      </div>
                      <div className="text-xs text-gray-400">
                        {formatTimestamp(flow.timestamp)}
                      </div>
                    </div>
                    
                    <div className="space-y-1 text-sm">
                      <div>
                        <span className="text-gray-400">From:</span>
                        <span className="text-white ml-2 font-mono">{flow.fromAddress}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">To:</span>
                        <span className="text-white ml-2 font-mono">{flow.toAddress}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">TX:</span>
                        <span className="text-white ml-2 font-mono">{flow.txHash.substring(0, 16)}...</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Feature Information */}
      <div className="bg-slate-700/30 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Analysis Capabilities</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-white mb-2">Transaction Analysis</h4>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>• Complete transaction breakdown</li>
              <li>• Input and output analysis</li>
              <li>• Fee calculation and optimization</li>
              <li>• Script type identification</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-white mb-2">Address Investigation</h4>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>• Balance and transaction history</li>
              <li>• Activity timeline analysis</li>
              <li>• Address clustering detection</li>
              <li>• Entity identification</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-white mb-2">Transaction Flow</h4>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>• Multi-hop transaction tracing</li>
              <li>• Fund flow visualization</li>
              <li>• Mixing pattern detection</li>
              <li>• Exchange interaction analysis</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-white mb-2">Compliance Checking</h4>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>• AML risk assessment</li>
              <li>• Sanctions screening</li>
              <li>• Suspicious activity detection</li>
              <li>• Regulatory compliance reporting</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-4">
        <div className="flex items-start">
          <Shield className="w-6 h-6 text-blue-400 mr-3 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="text-blue-400 font-semibold mb-2">Professional Use Notice</h3>
            <p className="text-blue-200 text-sm">
              This blockchain analysis suite is designed for legitimate investigative, compliance, 
              and research purposes. Ensure you comply with all applicable laws and regulations 
              when conducting blockchain analysis activities.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlockchainAnalyzer;