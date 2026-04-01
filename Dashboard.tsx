import React, { useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Download, CheckCircle2, Circle, Loader2, Bug } from 'lucide-react';
import { PHASE_NAMES } from '../constants';
import { PhaseContent, PhaseName } from '../types';

interface DashboardProps {
  phases: Record<PhaseName, PhaseContent>;
  activePhase: PhaseName | null;
  setActivePhase: (p: PhaseName) => void;
  fullRawOutput: string;
}

export function Dashboard({ phases, activePhase, setActivePhase, fullRawOutput }: DashboardProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  // Auto-scroll when active phase content updates
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [phases, activePhase]);

  const getPhaseIcon = (status: string) => {
    switch (status) {
      case 'running': return <Loader2 className="w-4 h-4 animate-spin shrink-0" />;
      case 'done': return <CheckCircle2 className="w-4 h-4 text-success shrink-0" />;
      case 'bug': return <Bug className="w-4 h-4 text-warning shrink-0" />;
      default: return <Circle className="w-4 h-4 text-text-muted shrink-0" />;
    }
  };

  const currentPhaseContent = activePhase ? phases[activePhase].content : '';

  const handleCopy = () => {
    navigator.clipboard.writeText(fullRawOutput);
  };

  const handleDownload = () => {
    const blob = new Blob([fullRawOutput], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'qa-report.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  function MarkdownRenderer({ content }: { content: string }) {
    return (
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ node, inline, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || '');
            return !inline && match ? (
              <div className="relative group my-4 rounded-lg overflow-hidden border border-border">
               <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                 <button
                   onClick={() => navigator.clipboard.writeText(String(children).replace(/\n$/, ''))}
                   className="p-1.5 bg-surface/80 hover:bg-surface border border-border rounded text-text-muted hover:text-text-primary backdrop-blur-sm"
                   title="Copy code"
                 >
                   <Copy className="w-3.5 h-3.5" />
                 </button>
               </div>
                <SyntaxHighlighter
                  {...props}
                  style={vscDarkPlus as any}
                  language={match[1]}
                  PreTag="div"
                  showLineNumbers
                  customStyle={{ margin: 0, padding: '1rem', background: '#0d1117', fontSize: '0.875rem' }}
                >
                  {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
              </div>
            ) : (
              <code {...props} className="bg-surface border border-border text-text-primary px-1.5 py-0.5 rounded text-sm font-mono">
                {children}
              </code>
            );
          },
          h1: ({children}) => <h1 className="text-2xl font-bold mt-6 mb-4 text-white border-b border-border pb-2 block w-full">{children}</h1>,
          h2: ({children}) => <h2 className="text-xl font-bold mt-5 mb-3 text-white border-b border-border pb-1">{children}</h2>,
          h3: ({children}) => <h3 className="text-lg font-bold mt-4 mb-2 text-white">{children}</h3>,
          p: ({children}) => <p className="mb-4 leading-relaxed text-text-primary">{children}</p>,
          ul: ({children}) => <ul className="list-disc pl-6 mb-4 space-y-1 text-text-primary">{children}</ul>,
          ol: ({children}) => <ol className="list-decimal pl-6 mb-4 space-y-1 text-text-primary">{children}</ol>,
          li: ({children}) => <li className="pl-1">{children}</li>,
          blockquote: ({children}) => <blockquote className="border-l-4 border-accent pl-4 my-4 italic text-text-muted bg-surface/50 py-2 rounded-r">{children}</blockquote>,
          a: ({children, href}) => <a href={href} className="text-accent hover:underline" target="_blank" rel="noreferrer">{children}</a>,
          strong: ({children}) => <strong className="font-bold text-white">{children}</strong>,
        }}
      >
        {content}
      </ReactMarkdown>
    );
  }

  // Calculate percentage of phases completed 
  const completedPhases = Object.values(phases).filter(p => p.status === 'done' || p.status === 'bug').length;
  const progressPct = Object.keys(phases).length ? (completedPhases / Object.keys(phases).length) * 100 : 0;

  return (
    <div className="h-full flex flex-col bg-surface overflow-hidden">
      {/* Tab Bar */}
      <div className="bg-background border-b border-border flex flex-wrap gap-1 p-2 items-center z-10">
        {PHASE_NAMES.map((name, i) => {
          const p = phases[name];
          const isActive = activePhase === name;
          return (
            <button
              key={name}
              onClick={() => p.status !== 'pending' && setActivePhase(name)}
              disabled={p.status === 'pending'}
              className={`
                relative px-3 py-2 rounded-md text-xs font-semibold tracking-wide transition-all
                flex items-center gap-2 overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed
                ${isActive ? 'bg-surface text-white border border-border shadow-sm' : 'text-text-muted hover:text-white hover:bg-surface/50'}
              `}
            >
              {getPhaseIcon(p.status)}
              {name}
              {p.status === 'pending' && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.05] to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
              )}
            </button>
          );
        })}

        <div className="ml-auto flex items-center gap-2 px-2">
          <span className="text-xs font-mono text-text-muted">{completedPhases}/7</span>
          <div className="w-16 h-1 bg-border rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-accent"
              initial={{ width: 0 }}
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>

        <div className="flex items-center border-l border-border ml-2 pl-2 gap-1 gap-1">
          <button onClick={handleCopy} title="Copy Full" className="p-1.5 text-text-muted hover:text-white hover:bg-surface border border-transparent hover:border-border rounded transition-colors"><Copy className="w-4 h-4"/></button>
          <button onClick={handleDownload} title="Download .md" className="p-1.5 text-text-muted hover:text-white hover:bg-surface border border-transparent hover:border-border rounded transition-colors"><Download className="w-4 h-4"/></button>
        </div>
      </div>

      {/* Content Area */}
      <div 
        ref={contentRef}
        className="flex-1 overflow-y-auto p-6 lg:p-10 scroll-smooth relative relative"
      >
        <AnimatePresence mode="wait">
          {activePhase ? (
            <motion.div
              key={activePhase}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="max-w-4xl mx-auto pb-20"
            >
              <MarkdownRenderer content={currentPhaseContent} />
              {phases[activePhase].status === 'running' && (
                <span className="inline-block w-2.5 h-4 bg-accent ml-1 animate-pulse align-middle" />
              )}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="h-full flex items-center justify-center text-text-muted"
            >
              <div className="text-center">
                <p className="text-lg mb-2">Ready to run</p>
                <p className="text-sm font-mono opacity-60">Waiting for agent to start phase 1...</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {activePhase === 'SCRIBE' && phases['SCRIBE'].status === 'done' && (
           <div className="max-w-4xl mx-auto rounded-xl p-6 border text-center mt-12 bg-background border-border">
             <h3 className="text-xl font-bold text-white mb-2">Automated CI/CD Feedback Generated</h3>
             <p className="text-text-muted">The QA agent has completely processed the requested feature. See details in the phases above.</p>
           </div>
        )}
      </div>
    </div>
  );
}
