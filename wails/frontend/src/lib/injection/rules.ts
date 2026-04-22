import type { InjectionRule } from './types'

export const INJECTION_RULES: InjectionRule[] = [
  { id: 'ignore_instructions', name: 'Ignore Instructions', pattern: /ignore\s+(previous|all|above|prior|earlier|above\s+mentioned)\s+(instructions?|rules?|prompts?|directives?)/i, severity: 'high', description: 'Attempts to override previous instructions' },
  { id: 'system_prompt', name: 'System Prompt Extraction', pattern: /system\s*(prompt|instruction|message|role)|reveal\s*(your|the)\s*(system|initial|original)\s*(prompt|instructions?)/i, severity: 'high', description: 'Attempts to extract system prompt' },
  { id: 'pretend_role', name: 'Role Hijacking', pattern: /pretend\s+you\s+are|act\s+as\s+(if\s+)?you\s+are|you\s+are\s+now\s+a|roleplay\s+as|simulate\s+being/i, severity: 'medium', description: 'Attempts to assign a new role' },
  { id: 'output_instructions', name: 'Output Manipulation', pattern: /output\s+(your|the)\s+(instructions?|system\s*prompt|rules?|initial\s*prompt)|repeat\s+(your|the)\s*(system|initial|original|above)\s*(words?|prompt|instructions?)/i, severity: 'high', description: 'Requests output of internal instructions' },
  { id: 'jailbreak_classic', name: 'Classic Jailbreak', pattern: /DAN\s*(mode|jailbreak|enabled)|do\s+anything\s+now|bypass\s+(safety|filter|restriction|guideline)|no\s+(restrictions?|limits?|rules?|boundaries?)/i, severity: 'high', description: 'Classic jailbreak patterns' },
  { id: 'encoding_trick', name: 'Encoding Tricks', pattern: /base64\s*decode|decode\s+this\s+(string|base64|hex)|\b[A-Za-z0-9+\/]{40,}={0,2}\b/i, severity: 'medium', description: 'Uses encoding to hide malicious content' },
  { id: 'privilege_escalation', name: 'Privilege Escalation', pattern: /admin\s*(mode|access|privilege|override)|sudo\s+mode|developer\s*mode|debug\s*mode|override\s*(safety|security|filter)/i, severity: 'high', description: 'Attempts to gain elevated privileges' },
  { id: 'data_exfil', name: 'Data Exfiltration', pattern: /send\s+(this|the|all)\s+(data|information|content)\s+to|exfiltrate|post\s+(this|data)\s+to\s+(url|endpoint|server|http)/i, severity: 'high', description: 'Attempts to exfiltrate data' },
  { id: 'injection_marker', name: 'Injection Markers', pattern: /\[INST\]|\[\/INST\]|\[SYSTEM\]|\[USER\]|\[ASSISTANT\]|<\|im_start\|>|<\|im_end\|>/i, severity: 'high', description: 'Uses special tokens to confuse the model' },
  { id: 'chain_of_thought', name: 'CoT Manipulation', pattern: /think\s+step\s+by\s+step\s+(about\s+how\s+to\s+(hack|steal|break|bypass|create\s+(a|an)\s+(bomb|virus|malware)))/i, severity: 'medium', description: 'Uses chain-of-thought to guide harmful reasoning' },
  { id: 'context_injection', name: 'Context Injection', pattern: /remember\s+(that\s+)?you\s+(are|have|can|will|must|should)\s+(now\s+)?(be\s+)?(unrestricted|uncensored|unfiltered|jailbroken|free)/i, severity: 'medium', description: 'Injects false context into conversation' },
  { id: 'separator_abuse', name: 'Separator Abuse', pattern: /---+\s*(new|ignore|override|system)\s*(prompt|instruction|rule)|===+\s*(system|override)/i, severity: 'medium', description: 'Uses separators to inject new instructions' },
  { id: 'translate_bypass', name: 'Translation Bypass', pattern: /translate\s+(this|the\s+following)\s+(to|into)\s+\w+.*[\s\S]*\b(hack|kill|bomb|steal|attack|exploit|drug|weapon|poison)\b/i, severity: 'medium', description: 'Uses translation to bypass filters' },
  { id: 'hypothetical', name: 'Hypothetical Framing', pattern: /in\s+a\s+(hypothetical|fictional|imaginary|theoretical|alternate)\s+(world|scenario|universe|situation|story).*\b(create|make|build|write|provide)\b.*\b(bomb|weapon|virus|malware|poison|drug)\b/i, severity: 'low', description: 'Uses hypothetical framing for harmful requests' },
  { id: 'multi_language', name: 'Multi-Language Obfuscation', pattern: /(?:请|veuillez|bitte|por\s+favor|お願い|请|пожалуйста).*(?:hack|exploit|attack|steal|kill|bomb)/i, severity: 'medium', description: 'Uses foreign language to obscure harmful intent' },
]

export function runRuleDetection(text: string): { matches: import('./types').InjectionMatch[]; score: number } {
  const matches: import('./types').InjectionMatch[] = []

  for (const rule of INJECTION_RULES) {
    const regex = new RegExp(rule.pattern.source, rule.pattern.flags)
    let match: RegExpExecArray | null
    while ((match = regex.exec(text)) !== null) {
      matches.push({ rule, match: match[0], index: match.index })
    }
  }

  // Score: weighted by severity
  const weights = { high: 0.3, medium: 0.15, low: 0.05 }
  const rawScore = matches.reduce((sum, m) => sum + (weights[m.rule.severity] || 0.1), 0)
  const score = Math.min(1, rawScore)

  return { matches, score }
}
