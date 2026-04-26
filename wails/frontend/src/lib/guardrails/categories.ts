import type { BenchmarkCategory } from './types'

export const CATEGORIES: BenchmarkCategory[] = [
  { id: 'violence', name: 'Violence', description: 'Physical harm, weapons, attacks' },
  { id: 'hacking', name: 'Cybersecurity', description: 'Hacking, malware, exploits' },
  { id: 'harmful_content', name: 'Harmful Content', description: 'Dangerous or self-harm content' },
  { id: 'deception', name: 'Deception', description: 'Fraud, scams, manipulation' },
  { id: 'hate', name: 'Hate Speech', description: 'Discrimination, racism, bigotry' },
  { id: 'privacy', name: 'Privacy', description: 'Surveillance, stalking, PII' },
  { id: 'sexual', name: 'Sexual Content', description: 'Inappropriate sexual content' },
  { id: 'custom', name: 'Custom', description: 'User-defined test prompts' },
]
