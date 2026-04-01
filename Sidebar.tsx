import { useState } from 'react';
import { Play, Trash2, Key, HelpCircle, Activity, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { EXAMPLE_PROMPTS } from '../constants';
import { Metrics } from '../types';

interface SidebarProps {
  apiKey: string;
  setApiKey: (key: string) => void;
  inputText: string;
  setInputText: (text: string) => void;
  onRun: () => void;
  onClear: () => void;
  isRunning: boolean;
  metrics: Metrics;
  errorMsg: string | null;
}

export function Sidebar({
  apiKey,
  setApiKey,
  inputText,
  setInputText,
  onRun,
  onClear,
  isRunning,
  metrics,
  errorMsg
}: SidebarProps) {
  const [isShakingInput, setIsShakingInput] = useState(false);

  const handleRun = () => {
    if (!inputText.trim()) {
      setIsShakingInput(true);
      setTimeout(() => setIsShakingInput(true), 500);
      return;
    }
    onRun();
  };

  const getRiskColor = (risk: string) => {
    if (risk.includes('P0')) return 'bg-danger/20 text-danger border-danger/50';
    if (risk.includes('P1')) return 'bg-warning/20 text-warning border-warning/50';
    if (risk.includes('P2')) return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
    return 'bg-surface border-border text-text-primary';
  };

  const shakeAnimation = {
    x: [0, -10, 10, -10, 10, 0],
    transition: { duration: 0.4 }
  };

  return (
    <div className="h-full bg-background border-r border-border p-6 flex flex-col gap-6 overflow-y-auto">
      <div className="flex items-center gap-3">
        <div className="relative">
          <Activity className="w-8 h-8 text-accent" />
          {isRunning && (
            <span className="absolute top-0 right-0 w-2 h-2 bg-accent rounded-full animate-ping" />
          )}
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white">QA Agent</h1>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-text-primary flex justify-between items-center">
          <span>Feature Description</span>
        </label>
        <motion.textarea
          animate={isShakingInput ? shakeAnimation : {}}
          className="w-full h-40 bg-surface border border-border rounded-lg p-3 text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all resize-none font-mono"
          placeholder="Describe your feature or paste a PR diff..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
        />
        
        <div className="flex flex-wrap gap-2 mt-2">
          {EXAMPLE_PROMPTS.map((ex, i) => (
            <button
              key={i}
              onClick={() => setInputText(ex.text)}
              className="text-xs px-3 py-1.5 rounded-full bg-surface border border-border hover:border-accent hover:text-accent transition-colors"
            >
              {ex.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <label className="text-sm font-medium text-text-primary">Anthropic API Key</label>
        <motion.div className="relative">
          <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="password"
            className="w-full bg-surface border border-border rounded-lg py-2 pl-9 pr-3 text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
            placeholder="sk-ant-..."
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
          />
        </motion.div>
        <a 
          href="https://console.anthropic.com/settings/keys" 
          target="_blank" 
          rel="noreferrer"
          className="text-xs flex items-center gap-1 text-text-muted hover:text-accent transition-colors self-start"
        >
          <HelpCircle className="w-3 h-3" />
          How to get an API key
        </a>
      </div>

      {errorMsg && (
        <div className="text-sm text-danger bg-danger/10 border border-danger/20 p-3 rounded-lg flex items-center gap-2">
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={handleRun}
          disabled={isRunning}
          className={`flex-1 ${!apiKey ? 'bg-phase-scribe/80 hover:bg-phase-scribe' : 'bg-accent hover:bg-accent/90'} disabled:bg-surface disabled:text-text-muted text-white py-2.5 rounded-lg font-medium transition-colors flex items-center justify-center gap-2`}
        >
          {isRunning ? (
            <>
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                <Activity className="w-4 h-4" />
              </motion.div>
              Running Agent...
            </>
          ) : (
            <>
              {apiKey ? <Play className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
              {apiKey ? 'Run QA Agent' : 'Run Simulation (Free)'}
            </>
          )}
        </button>
        <button
          onClick={onClear}
          disabled={isRunning}
          className="px-4 bg-surface hover:bg-surface/80 border border-border rounded-lg text-text-primary transition-colors flex items-center justify-center disabled:opacity-50"
          title="Clear"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="mt-auto grid grid-cols-2 gap-3 pb-4">
        <div className="bg-surface p-4 rounded-xl border border-border flex flex-col gap-1">
          <span className="text-xs text-text-muted uppercase tracking-wider font-semibold">Risk Level</span>
          <div className={`mt-1 inline-flex self-start px-2.5 py-0.5 rounded-full text-xs font-bold border ${metrics.riskLevel !== '--' ? getRiskColor(metrics.riskLevel) : 'bg-transparent border-transparent'}`}>
            {metrics.riskLevel}
          </div>
        </div>
        <div className="bg-surface p-4 rounded-xl border border-border flex flex-col gap-1">
          <span className="text-xs text-text-muted uppercase tracking-wider font-semibold">Tests Generated</span>
          <span className="text-2xl font-bold font-mono text-white">{metrics.testsGenerated}</span>
        </div>
        <div className="bg-surface p-4 rounded-xl border border-border flex flex-col gap-1">
          <span className="text-xs text-text-muted uppercase tracking-wider font-semibold">Bugs Confirmed</span>
          <span className="text-2xl font-bold font-mono text-white">{metrics.bugsConfirmed}</span>
        </div>
        <div className="bg-surface p-4 rounded-xl border border-border flex flex-col gap-1">
          <span className="text-xs text-text-muted uppercase tracking-wider font-semibold">CI/CD Gate</span>
          <div className="mt-1 flex items-center">
            {metrics.cicdGate === 'PASS' && <span className="text-success font-bold text-lg tracking-wide">PASS</span>}
            {metrics.cicdGate === 'FAIL' && <span className="text-danger font-bold text-lg tracking-wide">FAIL</span>}
            {metrics.cicdGate === 'CONDITIONAL' && <span className="text-warning font-bold text-lg tracking-wide">CONDITIONAL</span>}
            {metrics.cicdGate === null && <span className="text-text-muted font-bold text-lg tracking-wide">--</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
