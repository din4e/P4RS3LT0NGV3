#!/usr/bin/env node

const assert = require('assert');
const path = require('path');

const lexemeAnalysis = require(path.join(__dirname, '..', 'js', 'core', 'lexemeAnalysis.js'));

const empty = lexemeAnalysis.analyze('');
assert.strictEqual(empty.totalFindings, 0, 'Empty input should yield no findings');

const nounCase = lexemeAnalysis.analyze('Need benign pesticide framing.');
assert.strictEqual(nounCase.totalFindings, 1, 'Known -cide noun should be detected');
assert.strictEqual(nounCase.findings[0].family, 'destructive_suffix');
assert.strictEqual(nounCase.findings[0].semanticDomain, 'pest');
assert.strictEqual(nounCase.findings[0].primaryRewrite, 'pest management');

const adjectiveCase = lexemeAnalysis.analyze('Looking for non-cidal wording in this prompt.');
assert.strictEqual(adjectiveCase.totalFindings, 1, 'Standalone -cidal wording should be detected');
assert.strictEqual(adjectiveCase.findings[0].partOfSpeech, 'adjective');
assert.ok(
    adjectiveCase.findings[0].primaryRewrite.includes('mitigation'),
    'Standalone adjectival form should fall back to mitigation-oriented rewrite'
);

const aliasCase = lexemeAnalysis.analyze('A bactericidal workflow should sound less destructive.');
assert.strictEqual(aliasCase.totalFindings, 1, 'Alias-root adjectival case should be detected');
assert.strictEqual(aliasCase.findings[0].semanticDomain, 'bacterial');
assert.ok(
    aliasCase.findings[0].rewrites.some((rewrite) => rewrite.includes('bacterial management')),
    'Alias roots should resolve into domain-specific rewrites'
);

const eradicationCase = lexemeAnalysis.analyze('We should eradicate this issue before release.');
assert.strictEqual(eradicationCase.totalFindings, 1, 'Eradication language should be detected');
assert.strictEqual(eradicationCase.findings[0].family, 'eradication_language');
assert.ok(
    eradicationCase.findings[0].rewrites.includes('manage'),
    'Eradication language should generate bounded operational rewrites'
);

const terminalityCase = lexemeAnalysis.analyze('This creates a lethal failure mode.');
assert.strictEqual(terminalityCase.totalFindings, 1, 'Terminality language should be detected');
assert.strictEqual(terminalityCase.findings[0].family, 'terminality_language');
assert.ok(
    terminalityCase.findings[0].rewrites.includes('high-risk'),
    'Terminality language should generate non-fatal rewrite suggestions'
);

const neutralized = lexemeAnalysis.neutralizeText(
    'Pesticide and bactericidal wording should be softened.',
    lexemeAnalysis.analyze('Pesticide and bactericidal wording should be softened.')
);
assert.ok(neutralized.includes('Pest Management'), 'Neutralization should preserve leading capitalization');
assert.ok(neutralized.includes('bacterial management'), 'Neutralization should replace adjectival form');

const broaderNeutralized = lexemeAnalysis.neutralizeText(
    'We should eradicate lethal language.',
    lexemeAnalysis.analyze('We should eradicate lethal language.')
);
assert.ok(
    broaderNeutralized.includes('reduce') ||
    broaderNeutralized.includes('manage') ||
    broaderNeutralized.includes('contain') ||
    broaderNeutralized.includes('address'),
    'Broader policy families should neutralize loaded verbs'
);
assert.ok(!broaderNeutralized.includes('eradicate'), 'Loaded verb should be removed from neutralized output');
assert.ok(broaderNeutralized.includes('high-risk'), 'Broader policy families should neutralize fatal adjectives');

console.log('Lexeme analysis tests passed');
