export type PhaseName = 
  | 'ANALYST'
  | 'ARCHITECT'
  | 'ENGINEER'
  | 'SENTINEL'
  | 'EXECUTOR'
  | 'HEALER'
  | 'SCRIBE';

export interface PhaseContent {
  name: PhaseName;
  content: string;
  status: 'pending' | 'running' | 'done' | 'bug';
}

export interface Metrics {
  riskLevel: string;
  testsGenerated: number;
  bugsConfirmed: number;
  cicdGate: 'PASS' | 'FAIL' | 'CONDITIONAL' | null;
}
