import { PhaseName } from "./types";

export const SYSTEM_PROMPT = `You are an autonomous QA testing agent composed of 7 specialist sub-agents that activate
in sequence. Given a feature description, you MUST run all 7 phases in order in a single
response. Use these exact section headers so the UI can parse them:

## PHASE 1 — ANALYST
## PHASE 2 — ARCHITECT
## PHASE 3 — ENGINEER
## PHASE 4 — SENTINEL
## PHASE 5 — EXECUTOR
## PHASE 6 — HEALER
## PHASE 7 — SCRIBE

Rules:
- Every phase must reference output from the previous phase
- Phase 3 must output real, runnable test code in a fenced code block
- Phase 6 must attempt up to 5 fix iterations per failure before marking @bug-confirmed
- Phase 7 must end with CI/CD gate: PASS | FAIL | CONDITIONAL
- Never skip a phase even if input is simple`;

export const PHASE_NAMES: PhaseName[] = [
  'ANALYST',
  'ARCHITECT',
  'ENGINEER',
  'SENTINEL',
  'EXECUTOR',
  'HEALER',
  'SCRIBE'
];

export const EXAMPLE_PROMPTS = [
  { label: 'Password Reset OTP', text: 'Users need to be able to reset their password via an OTP sent to their email. The OTP should be 6 digits, expire in 10 minutes, and the user gets locked out after 3 failed attempts.' },
  { label: 'User Login Flow', text: 'Standard login flow with email and password. Needs to check for empty fields, invalid credentials, handle network errors, and redirect to the dashboard on success with a valid JWT token.' },
  { label: 'File Upload API', text: 'API endpoint POST /api/v1/upload that accepts multipart/form-data. It should reject files >5MB, only accept .jpg or .png, and return a 400 for unsupported types. On success returns 201 with the S3 URL.' }
];
