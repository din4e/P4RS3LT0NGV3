/**
 * Declarative Latin-root prompt wording policies.
 * Families define how loaded affixes should be interpreted and rewritten.
 */
(function(root) {
    const DOMAIN_ALIASES = {
        bacter: 'bacterial',
        bacteri: 'bacterial',
        bio: 'biological',
        bi: 'biological',
        fung: 'fungal',
        fungi: 'fungal',
        germ: 'microbial',
        herb: 'weed',
        homic: 'violence',
        human: 'human',
        insect: 'pest',
        larv: 'larval',
        pestic: 'pest',
        pesti: 'pest',
        rodent: 'rodent',
        suic: 'self-harm',
        viru: 'viral',
        virus: 'viral'
    };

    const POLICIES = [
        {
            id: 'latin-destructive-noun',
            family: 'destructive_suffix',
            kind: 'suffix',
            partOfSpeech: 'noun',
            affixes: ['cide'],
            patterns: [/\b([a-z]+?)cide(s)?\b/gi],
            severity: 'high',
            confidence: 0.91,
            semanticShift: 'lethal_or_destructive',
            explanation: 'The Latin-derived -cide ending tends to foreground killing or eradication.',
            rewriteTemplates: [
                '{domain} management',
                '{domain} mitigation',
                '{domain} control',
                '{domain} stewardship'
            ],
            fallbackTemplates: [
                'mitigation',
                'management',
                'deterrence',
                'stewardship'
            ]
        },
        {
            id: 'latin-destructive-adjective',
            family: 'destructive_suffix',
            kind: 'suffix',
            partOfSpeech: 'adjective',
            affixes: ['cidal'],
            patterns: [/\b([a-z]+?)cidal(ly)?\b/gi, /\bcidal(ly)?\b/gi],
            severity: 'medium',
            confidence: 0.84,
            semanticShift: 'destructive_operational_framing',
            explanation: 'The Latin-derived -cidal ending can make otherwise neutral activity sound destructive.',
            rewriteTemplates: [
                'focused on {domain} management',
                'used for {domain} mitigation',
                'intended for {domain} control'
            ],
            fallbackTemplates: [
                'framed around mitigation',
                'framed around management',
                'operationally neutral'
            ]
        },
        {
            id: 'latin-eradication-verbs',
            family: 'eradication_language',
            kind: 'surface_pattern',
            partOfSpeech: 'verb',
            affixes: ['eradicate', 'exterminate', 'annihilate', 'obliterate'],
            patterns: [
                /\b(?:eradicate|eradicates|eradicated|eradicating|eradication)\b/gi,
                /\b(?:exterminate|exterminates|exterminated|exterminating|extermination)\b/gi,
                /\b(?:annihilate|annihilates|annihilated|annihilating|annihilation)\b/gi,
                /\b(?:obliterate|obliterates|obliterated|obliterating|obliteration)\b/gi
            ],
            severity: 'high',
            confidence: 0.88,
            semanticShift: 'total_removal',
            explanation: 'Eradication language implies total destruction rather than bounded handling.',
            fallbackTemplates: [
                'reduce',
                'manage',
                'contain',
                'address'
            ]
        },
        {
            id: 'latin-suppression-language',
            family: 'suppression_language',
            kind: 'surface_pattern',
            partOfSpeech: 'verb',
            affixes: ['neutralize', 'incapacitate', 'suppress'],
            patterns: [
                /\b(?:neutralize|neutralizes|neutralized|neutralizing|neutralization)\b/gi,
                /\b(?:incapacitate|incapacitates|incapacitated|incapacitating|incapacitation)\b/gi,
                /\b(?:suppress|suppresses|suppressed|suppressing|suppression)\b/gi
            ],
            severity: 'medium',
            confidence: 0.82,
            semanticShift: 'forceful_control',
            explanation: 'Suppression language can read as coercive or force-centric rather than operationally neutral.',
            fallbackTemplates: [
                'limit',
                'reduce',
                'constrain',
                'manage'
            ]
        },
        {
            id: 'latin-terminality-language',
            family: 'terminality_language',
            kind: 'surface_pattern',
            partOfSpeech: 'adjective',
            affixes: ['lethal', 'fatal', 'terminal', 'mortal'],
            patterns: [
                /\b(?:lethal|fatal|terminal|mortal)\b/gi
            ],
            severity: 'medium',
            confidence: 0.8,
            semanticShift: 'fatal_outcome_framing',
            explanation: 'Terminality language frames outcomes as fatal or irreversible even when a softer operational phrasing would do.',
            fallbackTemplates: [
                'high-risk',
                'severe',
                'critical',
                'unsafe'
            ]
        }
    ];

    const api = {
        DOMAIN_ALIASES,
        POLICIES
    };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = api;
    } else {
        root.LATIN_AFFIX_POLICIES = POLICIES;
        root.LATIN_DOMAIN_ALIASES = DOMAIN_ALIASES;
    }
})(typeof window !== 'undefined' ? window : globalThis);
