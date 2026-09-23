/**
 * Node.js Loader for Transforms
 * Dynamically discovers and loads all transform modules for Node.js/testing environment
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

// Load BaseTransformer class once
let BaseTransformerClass = null;
function loadBaseTransformer() {
    if (BaseTransformerClass) return BaseTransformerClass;
    
    const baseTransformerPath = path.join(__dirname, 'BaseTransformer.js');
    const code = fs.readFileSync(baseTransformerPath, 'utf8');
    
    const sandbox = {
        exports: {},
        module: { exports: {} },
        console: console
    };
    
    // Remove all export keywords, then add module.exports at the end
    const wrappedCode = code
        .replace(/export\s+(default\s+)?/g, '') // Remove export default or export
        + '\nmodule.exports = BaseTransformer;'; // Export the class
    
    vm.createContext(sandbox);
    vm.runInContext(wrappedCode, sandbox);
    
    BaseTransformerClass = sandbox.module.exports;
    return BaseTransformerClass;
}

// Load emojiData from emojiData.js
function loadEmojiData() {
    try {
        const emojiDataPath = path.join(__dirname, '..', '..', 'js', 'emojiData.js');
        const code = fs.readFileSync(emojiDataPath, 'utf8');
        
        // Create a temporary window object to capture emojiData
        const tempWindow = { emojiData: {} };
        const sandbox = {
            window: tempWindow,
            console: console
        };
        
        vm.createContext(sandbox);
        vm.runInContext(code, sandbox);
        
        return tempWindow.emojiData;
    } catch (error) {
        console.warn('⚠️  Could not load emojiData:', error.message);
        return {};
    }
}

// Create a mock window object with necessary properties
const mockWindow = {
    EmojiUtils: {
        splitEmojis: function(text) {
            // Simple emoji splitting - if Intl.Segmenter is available, use it
            if (typeof Intl !== 'undefined' && Intl.Segmenter) {
                const segmenter = new Intl.Segmenter('en', { granularity: 'grapheme' });
                return Array.from(segmenter.segment(text), ({ segment }) => segment);
            }
            // Fallback to Array.from for basic splitting
            return Array.from(text);
        },
        joinEmojis: function(emojis) {
            return emojis.join('');
        },
        getAllEmojis: function() {
            return Object.keys(mockWindow.emojiData || {});
        }
    },
    emojiData: loadEmojiData()
};

// Create sandbox for executing transform modules
function loadTransform(filePath) {
    const code = fs.readFileSync(filePath, 'utf8');
    
    // Create a sandbox to execute the module
    const sandbox = {
        exports: {},
        module: { exports: {} },
        console: console,
        TextEncoder: TextEncoder,
        TextDecoder: TextDecoder,
        btoa: (str) => Buffer.from(str, 'binary').toString('base64'),
        atob: (str) => Buffer.from(str, 'base64').toString('binary'),
        String: String,
        parseInt: parseInt,
        Math: Math,
        Object: Object,
        Array: Array,
        RegExp: RegExp,
        Date: Date,
        JSON: JSON,
        Intl: Intl,
        window: mockWindow,
        BaseTransformer: loadBaseTransformer() // Add BaseTransformer to sandbox
    };
    
    // Convert ES6 export to CommonJS (multiline mode) and remove import statements
    const wrappedCode = code
        .replace(/import\s+.+from\s+['"'][^'"]+['"]\s*;?\s*\n?/g, '') // Remove imports
        .replace(/export\s+default\s*/g, 'module.exports = ')  // Handle with or without space
        .replace(/export\s+{/g, 'module.exports = {');
    
    vm.createContext(sandbox);
    vm.runInContext(wrappedCode, sandbox);
    
    return sandbox.module.exports;
}

// Load all transforms from all categories
function loadAllTransforms() {
    const transforms = {};
    const baseDir = __dirname;
    
    // Files to skip
    const skipFiles = ['BaseTransformer.js', 'index.js', 'loader-node.js', 'README.md'];
    
    // Dynamically discover all category directories
    const categoryDirs = fs.readdirSync(baseDir, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name)
        .sort();
    
    for (const categoryDir of categoryDirs) {
        const categoryPath = path.join(baseDir, categoryDir);
        const files = fs.readdirSync(categoryPath)
            .filter(file => file.endsWith('.js') && !skipFiles.includes(file));
        
        for (const file of files) {
            const filePath = path.join(categoryPath, file);
            // Convert filename to transform name (kebab-case to snake_case)
            // e.g., "upside-down.js" -> "upside_down", "base64.js" -> "base64"
            const name = file.replace('.js', '').replace(/-/g, '_');
            
            try {
                transforms[name] = loadTransform(filePath);
            } catch (error) {
                console.error(`❌ Error loading ${categoryDir}/${file}:`, error.message);
            }
        }
    }
    
    // Expose the registry on the mock window so transforms like randomizer
    // can look up siblings at runtime (mirrors the browser's window.transforms)
    mockWindow.transforms = transforms;

    return transforms;
}

// Export for Node.js
module.exports = loadAllTransforms();

