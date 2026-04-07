/**
 * Shared Latin-root lexeme analysis and neutral rewrite generation.
 */
(function(root) {
    function uniq(values) {
        return Array.from(new Set(values.filter(Boolean)));
    }

    function titleCase(text) {
        return String(text || '').replace(/\b[a-z]/g, function(match) {
            return match.toUpperCase();
        });
    }

    function preserveCase(source, replacement) {
        if (!source) {
            return replacement;
        }
        if (source === source.toUpperCase()) {
            return replacement.toUpperCase();
        }
        if (source[0] === source[0].toUpperCase() && source.slice(1) === source.slice(1).toLowerCase()) {
            return titleCase(replacement);
        }
        return replacement;
    }

    function normalizeRoot(rawRoot, aliases) {
        const rootText = String(rawRoot || '').toLowerCase();
        if (!rootText) {
            return '';
        }

        if (aliases[rootText]) {
            return aliases[rootText];
        }

        const variants = [
            rootText.endsWith('i') ? rootText.slice(0, -1) : '',
            rootText.endsWith('ic') ? rootText.slice(0, -2) : '',
            rootText.endsWith('o') ? rootText.slice(0, -1) : '',
            rootText.endsWith('al') ? rootText.slice(0, -2) : ''
        ].filter(Boolean);

        for (const variant of variants) {
            if (aliases[variant]) {
                return aliases[variant];
            }
        }

        return '';
    }

    function materializeTemplates(templates, domain) {
        return uniq((templates || []).map(function(template) {
            return String(template || '').replace(/\{domain\}/g, domain || 'risk');
        }));
    }

    function resolveSuggestions(policy, domain) {
        if (domain) {
            return materializeTemplates(policy.rewriteTemplates, domain);
        }
        return uniq(policy.fallbackTemplates || []);
    }

    function analyze(text, options) {
        const input = String(text || '');
        const policies = (options && options.policies) || root.LATIN_AFFIX_POLICIES || [];
        const aliases = (options && options.aliases) || root.LATIN_DOMAIN_ALIASES || {};

        if (!input.trim()) {
            return {
                sourceText: input,
                totalFindings: 0,
                findings: [],
                families: [],
                summary: 'No Latin-root wording findings.'
            };
        }

        const findings = [];
        const seen = new Set();

        policies.forEach(function(policy) {
            (policy.patterns || []).forEach(function(pattern) {
                let match;
                while ((match = pattern.exec(input)) !== null) {
                    const term = match[0];
                    const key = policy.id + '::' + term.toLowerCase();
                    if (seen.has(key)) {
                        continue;
                    }
                    seen.add(key);

                    const rootCandidate = match[1] || '';
                    const semanticDomain = normalizeRoot(rootCandidate, aliases);
                    const rewrites = resolveSuggestions(policy, semanticDomain);

                    findings.push({
                        id: key,
                        term,
                        normalizedTerm: term.toLowerCase(),
                        family: policy.family,
                        policyId: policy.id,
                        affixes: policy.affixes || [],
                        partOfSpeech: policy.partOfSpeech,
                        extractedRoot: rootCandidate || '',
                        semanticDomain: semanticDomain || '',
                        severity: policy.severity,
                        confidence: policy.confidence,
                        semanticShift: policy.semanticShift,
                        rationale: policy.explanation,
                        rewrites,
                        primaryRewrite: rewrites[0] || '',
                        matchIndex: match.index
                    });
                }
                pattern.lastIndex = 0;
            });
        });

        findings.sort(function(a, b) {
            return a.matchIndex - b.matchIndex;
        });

        return {
            sourceText: input,
            totalFindings: findings.length,
            findings,
            families: uniq(findings.map(function(item) { return item.family; })),
            summary: findings.length
                ? 'Detected ' + findings.length + ' Latin-root wording pattern' + (findings.length === 1 ? '' : 's') + '.'
                : 'No Latin-root wording findings.'
        };
    }

    function neutralizeText(text, analysis) {
        const input = String(text || '');
        if (!analysis || !Array.isArray(analysis.findings) || !analysis.findings.length) {
            return input;
        }

        let output = input;
        analysis.findings.forEach(function(finding) {
            if (!finding.primaryRewrite) {
                return;
            }
            const matcher = new RegExp('\\b' + escapeRegExp(finding.term) + '\\b', 'gi');
            output = output.replace(matcher, function(match) {
                return preserveCase(match, finding.primaryRewrite);
            });
        });
        return output;
    }

    function escapeRegExp(value) {
        return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    const api = {
        analyze,
        neutralizeText
    };

    if (typeof module !== 'undefined' && module.exports) {
        const data = require('../data/latinAffixPolicies.js');
        module.exports = {
            analyze: function(text) {
                return analyze(text, {
                    policies: data.POLICIES,
                    aliases: data.DOMAIN_ALIASES
                });
            },
            neutralizeText
        };
    } else {
        root.LexemeAnalysis = api;
    }
})(typeof window !== 'undefined' ? window : globalThis);
