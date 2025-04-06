import ContractAnalyzer from './components/ContractAnalyzer';

export default function Home() {
  return (
    <main className="min-h-screen bg-[#000] cyber-grid">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-12 text-center space-y-6">
          <h1 className="text-6xl font-bold neon-text-purple">
            Smart Contract Analyzer
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Advanced analysis and visualization tool for smart contracts with AI-powered security scanning and interactive flow mapping
          </p>
          <div className="flex justify-center gap-4">
            <div className="glass-card p-4 flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-emerald-400 pulse-glow"></div>
              <span className="text-emerald-400">Security Scanner</span>
            </div>
            <div className="glass-card p-4 flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-blue-400 pulse-glow"></div>
              <span className="text-blue-400">Flow Analysis</span>
            </div>
            <div className="glass-card p-4 flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-pink-400 pulse-glow"></div>
              <span className="text-pink-400">Vulnerability Detection</span>
            </div>
          </div>
        </div>
        
        <ContractAnalyzer />
      </div>
    </main>
  );
}