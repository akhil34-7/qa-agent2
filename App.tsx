import { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { runQAAgentStream } from './lib/anthropic';
import { PHASE_NAMES, SYSTEM_PROMPT } from './constants';
import { Metrics, PhaseContent, PhaseName } from './types';

const INITIAL_PHASES: Record<PhaseName, PhaseContent> = {
  ANALYST: { name: 'ANALYST', content: '', status: 'pending' },
  ARCHITECT: { name: 'ARCHITECT', content: '', status: 'pending' },
  ENGINEER: { name: 'ENGINEER', content: '', status: 'pending' },
  SENTINEL: { name: 'SENTINEL', content: '', status: 'pending' },
  EXECUTOR: { name: 'EXECUTOR', content: '', status: 'pending' },
  HEALER: { name: 'HEALER', content: '', status: 'pending' },
  SCRIBE: { name: 'SCRIBE', content: '', status: 'pending' },
};

function App() {
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('anthropic_api_key') || '');
  const [inputText, setInputText] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [phases, setPhases] = useState<Record<PhaseName, PhaseContent>>(INITIAL_PHASES);
  const [activePhase, setActivePhase] = useState<PhaseName | null>(null);
  const [fullRawOutput, setFullRawOutput] = useState('');
  
  const [metrics, setMetrics] = useState<Metrics>({
    riskLevel: '--',
    testsGenerated: 0,
    bugsConfirmed: 0,
    cicdGate: null
  });

  useEffect(() => {
    localStorage.setItem('anthropic_api_key', apiKey);
  }, [apiKey]);

  const handleClear = useCallback(() => {
    setInputText('');
    setPhases(INITIAL_PHASES);
    setActivePhase(null);
    setFullRawOutput('');
    setErrorMsg(null);
    setMetrics({
      riskLevel: '--',
      testsGenerated: 0,
      bugsConfirmed: 0,
      cicdGate: null
    });
  }, []);

  const handleRun = async () => {
    setIsRunning(true);
    setErrorMsg(null);
    setFullRawOutput('');
    
    // Reset phases
    const reset = { ...INITIAL_PHASES };
    setPhases(reset);
    setActivePhase(null);
    
    setMetrics({ riskLevel: '--', testsGenerated: 0, bugsConfirmed: 0, cicdGate: null });

    let currentPhase: PhaseName | null = null;
    let localFullRaw = '';

    if (!apiKey) {
      // Run simulation if no API key
      const { runQAAgentSimulation } = await import('./lib/simulation');
      await runQAAgentSimulation(
        inputText,
        (chunk: string) => {
          localFullRaw += chunk;
          setFullRawOutput(localFullRaw);

          const phaseMatch = chunk.match(/## PHASE \d [—-] ([A-Z]+)/) || localFullRaw.match(/## PHASE \d [—-] ([A-Z]+)$/m);
          if (phaseMatch) {
            const detectedPhase = phaseMatch[1] as PhaseName;
            if (PHASE_NAMES.includes(detectedPhase) && currentPhase !== detectedPhase) {
              if (currentPhase) {
                setPhases(prev => ({ ...prev, [currentPhase!]: { ...prev[currentPhase!], status: 'done' } }));
              }
              currentPhase = detectedPhase;
              setActivePhase(currentPhase);
              setPhases(prev => ({ ...prev, [detectedPhase]: { ...prev[detectedPhase], status: 'running' } }));
            }
          }

          // Extract metrics
          const riskMatch = localFullRaw.match(/\b(P[0-3])\b/i);
          if (riskMatch) setMetrics(m => ({ ...m, riskLevel: riskMatch[1].toUpperCase() }));
          
          const countMatch = localFullRaw.match(/Generation completed: (\d+)/i);
          const testsFound = countMatch ? parseInt(countMatch[1]) : (localFullRaw.match(/```(typescript|javascript|python|js|ts)/gi) || []).length;
          if (testsFound > 0) setMetrics(m => ({ ...m, testsGenerated: testsFound }));

          const bugs = (localFullRaw.match(/@bug-confirmed/gi) || []).length;
          if (bugs > 0) setMetrics(m => ({ ...m, bugsConfirmed: bugs }));
          if (localFullRaw.includes('CI/CD gate: PASS')) setMetrics(m => ({ ...m, cicdGate: 'PASS' }));
          else if (localFullRaw.includes('CI/CD gate: FAIL')) setMetrics(m => ({ ...m, cicdGate: 'FAIL' }));
          else if (localFullRaw.includes('CI/CD gate: CONDITIONAL')) setMetrics(m => ({ ...m, cicdGate: 'CONDITIONAL' }));

          if (currentPhase) {
            setPhases(prev => ({
              ...prev,
              [currentPhase!]: { ...prev[currentPhase!], content: prev[currentPhase!].content + chunk }
            }));
          }
        },
        () => {
          setIsRunning(false);
          if (currentPhase) {
            setPhases(prev => ({ ...prev, [currentPhase!]: { ...prev[currentPhase!], status: 'done' } }));
          }
        }
      );
      return;
    }

    await runQAAgentStream(
      apiKey,
      inputText,
      SYSTEM_PROMPT,
      (chunk: string) => {
        localFullRaw += chunk;
        setFullRawOutput(localFullRaw);

        // Detect phase header (e.g., ## PHASE 1 — ANALYST)
        const phaseMatch = chunk.match(/## PHASE \d [—-] ([A-Z]+)/) || localFullRaw.match(/## PHASE \d [—-] ([A-Z]+)$/m);
        if (phaseMatch) {
          const detectedPhase = phaseMatch[1] as PhaseName;
          if (PHASE_NAMES.includes(detectedPhase) && currentPhase !== detectedPhase) {
            
            // Mark previous as done
            if (currentPhase) {
               setPhases(prev => {
                 const st = prev[currentPhase!].status === 'running' ? 'done' : prev[currentPhase!].status;
                 return { ...prev, [currentPhase!]: { ...prev[currentPhase!], status: st } };
               });
            }

            currentPhase = detectedPhase;
            setActivePhase(currentPhase);
            setPhases(prev => ({
              ...prev,
              [detectedPhase]: { ...prev[detectedPhase], status: 'running' }
            }));
          }
        }

        // Output logic extraction (metrics)
        // Risk
        const riskMatch = localFullRaw.match(/\b(P[0-3])\b/i);
        if (riskMatch) setMetrics(m => ({ ...m, riskLevel: riskMatch[1].toUpperCase() }));
        
        // Tests Generation
        const countMatch = localFullRaw.match(/Generation completed: (\d+)/i);
        const testFuncs = (localFullRaw.match(/\b(test|it)\s*\(/g) || []).length;
        const testsFound = countMatch ? parseInt(countMatch[1]) : Math.max(testFuncs, (localFullRaw.match(/```(typescript|javascript|python|js|ts)/gi) || []).length);
        
        if (testsFound > 0) setMetrics(m => ({ ...m, testsGenerated: testsFound }));

        // Bugs Confirmed
        const bugs = (localFullRaw.match(/@bug-confirmed/gi) || []).length;
        if (bugs > 0) setMetrics(m => ({ ...m, bugsConfirmed: bugs }));

        // CI/CD Gate
        if (localFullRaw.includes('CI/CD gate: PASS') || localFullRaw.includes('CI/CD Gate: PASS')) {
           setMetrics(m => ({ ...m, cicdGate: 'PASS' }));
        } else if (localFullRaw.includes('CI/CD gate: FAIL') || localFullRaw.includes('CI/CD Gate: FAIL')) {
           setMetrics(m => ({ ...m, cicdGate: 'FAIL' }));
        } else if (localFullRaw.includes('CI/CD gate: CONDITIONAL') || localFullRaw.includes('CI/CD Gate: CONDITIONAL')) {
           setMetrics(m => ({ ...m, cicdGate: 'CONDITIONAL' }));
        }

        // Check for bug in current phase
        if (chunk.includes('@bug-confirmed') && currentPhase) {
          setPhases(prev => ({ ...prev, [currentPhase!]: { ...prev[currentPhase!], status: 'bug' } }));
        }

        // Append chunk
        if (currentPhase) {
          setPhases(prev => {
             // We drop the headers dynamically if wanted, but simpler to just append
             const existingContent = prev[currentPhase!].content;
             return {
               ...prev,
               [currentPhase!]: {
                 ...prev[currentPhase!],
                 content: existingContent + chunk,
               }
             };
          });
        }
      },
      (error) => {
        setErrorMsg(error);
        setIsRunning(false);
      },
      () => {
        setIsRunning(false);
        // Mark last phase as done if it was still running
        if (currentPhase) {
           setPhases(prev => {
             const st = prev[currentPhase!].status === 'running' ? 'done' : prev[currentPhase!].status;
             return { ...prev, [currentPhase!]: { ...prev[currentPhase!], status: st } };
           });
        }
      }
    );
  };

  return (
    <div className="flex w-full h-full bg-background text-text-primary">
      <div className="w-2/5 md:w-[40%] min-w-[320px] max-w-[500px] h-full">
        <Sidebar
          apiKey={apiKey}
          setApiKey={setApiKey}
          inputText={inputText}
          setInputText={setInputText}
          onRun={handleRun}
          onClear={handleClear}
          isRunning={isRunning}
          metrics={metrics}
          errorMsg={errorMsg}
        />
      </div>
      <div className="w-3/5 md:w-[60%] flex-1 h-full min-w-0">
        <Dashboard
          phases={phases}
          activePhase={activePhase}
          setActivePhase={setActivePhase}
          fullRawOutput={fullRawOutput}
        />
      </div>
    </div>
  );
}

export default App;
