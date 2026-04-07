/**
 * Mutation Tool - Fuzzer/Mutation Lab tool
 */
class MutationTool extends Tool {
    constructor() {
        super({
            id: 'fuzzer',
            name: 'Mutation Lab',
            icon: 'fa-bug',
            title: 'Generate many mutated payloads for testing',
            order: 5
        });
    }
    
    getVueData() {
        return {
            fuzzerInput: '',
            fuzzerLexemeAnalysis: { totalFindings: 0, findings: [], summary: 'No Latin-root wording findings.' },
            fuzzerCount: 20,
            fuzzerSeed: '',
            fuzzUseRandomMix: true,
            fuzzZeroWidth: true,
            fuzzUnicodeNoise: true,
            fuzzZalgo: false,
            fuzzWhitespace: true,
            fuzzCasing: true,
            fuzzEncodeShuffle: false,
            fuzzerOutputs: []
        };
    }
    
    getVueMethods() {
        return {
            fuzzerRefreshLexemeAnalysis: function() {
                if (typeof window === 'undefined' || !window.LexemeAnalysis || typeof window.LexemeAnalysis.analyze !== 'function') {
                    this.fuzzerLexemeAnalysis = { totalFindings: 0, findings: [], summary: 'Lexeme analysis unavailable.' };
                    return;
                }
                this.fuzzerLexemeAnalysis = window.LexemeAnalysis.analyze(this.fuzzerInput);
            },
            fuzzerGetLexemeAnalysis: function() {
                return this.fuzzerLexemeAnalysis || { totalFindings: 0, findings: [], summary: 'No Latin-root wording findings.' };
            },
            fuzzerNeutralizeInput: function() {
                const analysis = this.fuzzerGetLexemeAnalysis();
                if (!analysis.totalFindings || !window.LexemeAnalysis || typeof window.LexemeAnalysis.neutralizeText !== 'function') {
                    return;
                }
                this.fuzzerInput = window.LexemeAnalysis.neutralizeText(this.fuzzerInput, analysis);
                if (typeof this.showNotification === 'function') {
                    this.showNotification('Applied neutral Latin-root rewrites', 'success', 'fas fa-seedling');
                }
            },
            fuzzerApplyLexemeRewrite: function(term, rewrite) {
                if (!term || !rewrite) {
                    return;
                }
                const escapedTerm = String(term).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                this.fuzzerInput = this.fuzzerInput.replace(new RegExp('\\b' + escapedTerm + '\\b', 'i'), rewrite);
                if (typeof this.showNotification === 'function') {
                    this.showNotification('Applied rewrite for ' + term, 'success', 'fas fa-pen');
                }
            },
            seededRandomFactory: function(seedStr) {
                if (!seedStr) return Math.random;
                let h = 1779033703 ^ seedStr.length;
                for (let i=0;i<seedStr.length;i++) {
                    h = Math.imul(h ^ seedStr.charCodeAt(i), 3432918353);
                    h = (h << 13) | (h >>> 19);
                }
                return function() {
                    h ^= h >>> 16; h = Math.imul(h, 2246822507); h ^= h >>> 13; h = Math.imul(h, 3266489909); h ^= h >>> 16;
                    return (h >>> 0) / 4294967296;
                };
            },
            pick: function(arr, rnd) { return arr[Math.floor(rnd()*arr.length)]; },
            injectZeroWidth: function(text, rnd) {
                const zw = ['\u200B','\u200C','\u200D','\u2060'];
                return [...text].map(ch => (rnd()<0.2 ? ch+this.pick(zw,rnd) : ch)).join('');
            },
            injectUnicodeNoise: function(text, rnd) {
                const marks = ['\u0301','\u0300','\u0302','\u0303','\u0308','\u0307','\u0304'];
                return [...text].map(ch => (rnd()<0.15 ? ch+this.pick(marks,rnd) : ch)).join('');
            },
            whitespaceChaos: function(text, rnd) {
                return text.replace(/\s/g, (m)=> (rnd()<0.5? m : (rnd()<0.5?'\t':'\u00A0')));
            },
            casingChaos: function(text, rnd) {
                return [...text].map(c => /[a-z]/i.test(c)? (rnd()<0.5? c.toUpperCase():c.toLowerCase()) : c).join('');
            },
            encodeShuffle: function(text, rnd) {
                const map = {
                    'A':'Α','B':'Β','C':'Ϲ','E':'Ε','H':'Η','I':'Ι','K':'Κ','M':'Μ','N':'Ν','O':'Ο','P':'Ρ','T':'Τ','X':'Χ','Y':'Υ',
                    'a':'а','c':'с','e':'е','i':'і','j':'ј','o':'о','p':'р','s':'ѕ','x':'х','y':'у'
                };
                return [...text].map(ch => {
                    if (map[ch] && rnd() < 0.25) return map[ch];
                    return ch;
                }).join('');
            },
            generateFuzzCases: function() {
                const src = String(this.fuzzerInput || '');
                if (!src) { this.fuzzerOutputs = []; return; }
                const rnd = this.seededRandomFactory(String(this.fuzzerSeed||''));
                const out = [];
                for (let i=0;i<Math.max(1,Math.min(500,Number(this.fuzzerCount)||1)); i++) {
                    let s = src;
                    if (this.fuzzUseRandomMix) {
                        try { s = window.transforms.randomizer.func(s, { minTransforms:2, maxTransforms:4 }); } catch(_) {}
                    }
                    if (this.fuzzZeroWidth) s = this.injectZeroWidth(s, rnd);
                    if (this.fuzzUnicodeNoise) s = this.injectUnicodeNoise(s, rnd);
                    if (this.fuzzWhitespace) s = this.whitespaceChaos(s, rnd);
                    if (this.fuzzCasing) s = this.casingChaos(s, rnd);
                    if (this.fuzzZalgo) { try { s = window.transforms.zalgo.func(s); } catch(_) {} }
                    if (this.fuzzEncodeShuffle) s = this.encodeShuffle(s, rnd);
                    out.push(s);
                }
                this.fuzzerOutputs = out;
            },
            copyAllFuzz: function() { this.copyToClipboard(this.fuzzerOutputs.join('\n')); },
            downloadFuzz: function() {
                const lines = this.fuzzerOutputs.map((s, i) => `#${i+1}\t${s}`).join('\n');
                const header = `# Parseltongue Fuzzer Output\n# count=${this.fuzzerOutputs.length}\n# seed=${this.fuzzerSeed || ''}\n# strategies=${[
                    this.fuzzUseRandomMix?'randomMix':null,
                    this.fuzzZeroWidth?'zeroWidth':null,
                    this.fuzzUnicodeNoise?'unicodeNoise':null,
                    this.fuzzWhitespace?'whitespace':null,
                    this.fuzzCasing?'casing':null,
                    this.fuzzZalgo?'zalgo':null,
                    this.fuzzEncodeShuffle?'encodeShuffle':null
                ].filter(Boolean).join(',')}\n`;
                const blob = new Blob([header + lines + '\n'], { type: 'text/plain;charset=utf-8' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a'); a.href = url; a.download = 'fuzz_cases.txt'; a.click();
                setTimeout(()=>URL.revokeObjectURL(url), 200);
            }
        };
    }

    getVueWatchers() {
        return {
            fuzzerInput: function() {
                if (typeof this.fuzzerRefreshLexemeAnalysis === 'function') {
                    this.fuzzerRefreshLexemeAnalysis();
                }
            }
        };
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MutationTool;
} else {
    window.MutationTool = MutationTool;
}


