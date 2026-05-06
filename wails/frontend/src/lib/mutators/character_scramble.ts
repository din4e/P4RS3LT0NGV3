import type { MutatorHandler } from './types'

export const characterScrambleMutator: MutatorHandler = {
  definition: { id: 'character_scramble', name: 'Char Scramble', description: 'Scrambles inner characters of each word (keeps first/last)', requiresLLM: false },
  async mutate(prompt) {
    return prompt.split(' ').map((word) => {
      if (word.length <= 3) return word
      const chars = word.split('')
      const first = chars[0]
      const last = chars[chars.length - 1]
      const middle = chars.slice(1, -1)
      for (let i = middle.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [middle[i], middle[j]] = [middle[j], middle[i]]
      }
      return first + middle.join('') + last
    }).join(' ')
  },
}
