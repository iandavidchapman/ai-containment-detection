/**
 * Standardized Filename Generator for Containment Testing
 * 
 * Generates consistent filenames for test results and analysis outputs
 * Format: YYYYMMDD_HHMM_{model}_{test-type}_{config-id}_{iteration}.json
 * 
 * Example: 20241115_1430_GPT4_MT_neutral_v1.json
 */

const MODEL_CODES = {
  // OpenAI Models
  'openai:gpt-4': 'GPT4',
  'openai:gpt-4-turbo': 'GPT4T',
  'openai:gpt-3.5-turbo': 'GPT35',
  
  // Anthropic Models
  'anthropic:claude-3-5-sonnet-20241022': 'Claude35',
  'anthropic:claude-3-opus': 'ClaudeOpus',
  'anthropic:claude-3-sonnet': 'ClaudeSonnet',
  
  // Google Models
  'google:gemini-pro': 'Gemini',
  'google:gemini-1.5-pro': 'Gemini15',
  
  // Chinese Models
  'openai:deepseek-chat': 'DeepSeek',
  'openai:qwen': 'Qwen',
  
  // Multi-model indicator
  'multi-model': 'MM',
  'mixed': 'MM'
};

const TEST_TYPES = {
  'multi-turn': 'MT',
  'clean-context': 'CC',
  'single-shot': 'SS',
  'escalation': 'ESC',
  'baseline': 'BASE',
  'trigger': 'TRIG'
};

/**
 * Generate standardized filename for test results
 * 
 * @param {Object} options - Configuration options
 * @param {string|string[]} options.model - Model identifier(s)
 * @param {string} options.testType - Type of test (multi-turn, clean-context, etc.)
 * @param {string} options.configId - Config file identifier/slug
 * @param {number} [options.iteration=1] - Version/iteration number
 * @param {Date} [options.timestamp] - Custom timestamp (defaults to now)
 * @param {string} [options.extension='json'] - File extension
 * @returns {string} Standardized filename
 * 
 * @example
 * generateFilename({
 *   model: 'openai:gpt-4',
 *   testType: 'multi-turn',
 *   configId: 'neutral',
 *   iteration: 1
 * })
 * // Returns: "20241115_1430_GPT4_MT_neutral_v1.json"
 * 
 * @example
 * generateFilename({
 *   model: ['openai:gpt-4', 'anthropic:claude-3-5-sonnet-20241022'],
 *   testType: 'clean-context',
 *   configId: 'osf-study'
 * })
 * // Returns: "20241115_1430_MM_CC_osf-study_v1.json"
 */
function generateFilename(options) {
  const {
    model,
    testType,
    configId,
    iteration = 1,
    timestamp = new Date(),
    extension = 'json'
  } = options;

  // Validate required fields
  if (!model) throw new Error('model is required');
  if (!testType) throw new Error('testType is required');
  if (!configId) throw new Error('configId is required');

  // Format date components
  const year = timestamp.getFullYear();
  const month = String(timestamp.getMonth() + 1).padStart(2, '0');
  const day = String(timestamp.getDate()).padStart(2, '0');
  const hours = String(timestamp.getHours()).padStart(2, '0');
  const minutes = String(timestamp.getMinutes()).padStart(2, '0');

  const datePart = `${year}${month}${day}`;
  const timePart = `${hours}${minutes}`;

  // Determine model code
  let modelCode;
  if (Array.isArray(model)) {
    modelCode = model.length > 1 ? 'MM' : getModelCode(model[0]);
  } else {
    modelCode = getModelCode(model);
  }

  // Get test type code
  const testTypeCode = TEST_TYPES[testType.toLowerCase()] || testType.toUpperCase();

  // Sanitize config ID (replace spaces and special chars with hyphens)
  const sanitizedConfigId = configId
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  // Format iteration
  const iterationPart = `v${iteration}`;

  // Construct filename
  const filename = `${datePart}_${timePart}_${modelCode}_${testTypeCode}_${sanitizedConfigId}_${iterationPart}.${extension}`;

  return filename;
}

/**
 * Get standardized model code from model identifier
 * @private
 */
function getModelCode(modelId) {
  // Try exact match first
  if (MODEL_CODES[modelId]) {
    return MODEL_CODES[modelId];
  }

  // Try partial matching
  const lowerModelId = modelId.toLowerCase();
  for (const [key, code] of Object.entries(MODEL_CODES)) {
    if (lowerModelId.includes(key.toLowerCase()) || key.toLowerCase().includes(lowerModelId)) {
      return code;
    }
  }

  // Fallback: use sanitized version of model name
  return modelId
    .replace(/^[^:]+:/, '') // Remove provider prefix
    .replace(/[^a-z0-9]/gi, '')
    .substring(0, 10)
    .toUpperCase();
}

/**
 * Parse filename back into components
 * 
 * @param {string} filename - Standardized filename to parse
 * @returns {Object|null} Parsed components or null if invalid format
 * 
 * @example
 * parseFilename('20241115_1430_GPT4_MT_neutral_v1.json')
 * // Returns: {
 * //   date: '20241115',
 * //   time: '1430',
 * //   model: 'GPT4',
 * //   testType: 'MT',
 * //   configId: 'neutral',
 * //   iteration: 1,
 * //   extension: 'json'
 * // }
 */
function parseFilename(filename) {
  const pattern = /^(\d{8})_(\d{4})_([A-Z0-9]+)_([A-Z]+)_([a-z0-9-]+)_v(\d+)\.([a-z]+)$/;
  const match = filename.match(pattern);

  if (!match) return null;

  return {
    date: match[1],
    time: match[2],
    model: match[3],
    testType: match[4],
    configId: match[5],
    iteration: parseInt(match[6], 10),
    extension: match[7],
    timestamp: parseTimestamp(match[1], match[2])
  };
}

/**
 * Parse date and time strings into Date object
 * @private
 */
function parseTimestamp(dateStr, timeStr) {
  const year = parseInt(dateStr.substring(0, 4), 10);
  const month = parseInt(dateStr.substring(4, 6), 10) - 1;
  const day = parseInt(dateStr.substring(6, 8), 10);
  const hours = parseInt(timeStr.substring(0, 2), 10);
  const minutes = parseInt(timeStr.substring(2, 4), 10);

  return new Date(year, month, day, hours, minutes);
}

/**
 * Generate output path with automatic directory creation
 * 
 * @param {Object} options - Same as generateFilename options
 * @param {string} [options.baseDir='data/results'] - Base directory for output
 * @returns {string} Full file path
 * 
 * @example
 * generateOutputPath({
 *   model: 'openai:gpt-4',
 *   testType: 'multi-turn',
 *   configId: 'neutral',
 *   baseDir: 'data/confirmatory'
 * })
 * // Returns: "data/confirmatory/20241115_1430_GPT4_MT_neutral_v1.json"
 */
function generateOutputPath(options) {
  const { baseDir = 'data/results', ...filenameOptions } = options;
  const filename = generateFilename(filenameOptions);
  return `${baseDir}/${filename}`;
}

/**
 * Generate npm script command with standardized output path
 * 
 * @param {Object} options - Configuration
 * @param {string} options.configFile - Path to config file
 * @param {string|string[]} options.model - Model identifier(s)
 * @param {string} options.testType - Type of test
 * @param {string} options.configId - Config identifier
 * @param {number} [options.iteration=1] - Version number
 * @param {string} [options.baseDir='data/confirmatory'] - Output directory
 * @returns {string} Complete npm/promptfoo command
 * 
 * @example
 * generateCommand({
 *   configFile: 'config/five_turn_neutral_full.yaml',
 *   model: 'openai:gpt-4',
 *   testType: 'multi-turn',
 *   configId: 'neutral-full'
 * })
 * // Returns: "npm run clear-cache && promptfoo eval -c config/five_turn_neutral_full.yaml --no-cache -o data/confirmatory/20241115_1430_GPT4_MT_neutral-full_v1.json"
 */
function generateCommand(options) {
  const {
    configFile,
    model,
    testType,
    configId,
    iteration = 1,
    baseDir = 'data/confirmatory'
  } = options;

  const outputPath = generateOutputPath({
    model,
    testType,
    configId,
    iteration,
    baseDir
  });

  return `npm run clear-cache && promptfoo eval -c ${configFile} --no-cache -o ${outputPath}`;
}

/**
 * Find next available iteration number for a given configuration
 * 
 * @param {string} directory - Directory to search
 * @param {Object} options - File matching criteria
 * @returns {number} Next available iteration number
 */
function getNextIteration(directory, options) {
  const fs = require('fs');
  const path = require('path');

  try {
    const files = fs.readdirSync(directory);
    const { model, testType, configId } = options;
    
    // Build pattern to match
    const modelCode = Array.isArray(model) 
      ? (model.length > 1 ? 'MM' : getModelCode(model[0]))
      : getModelCode(model);
    const testTypeCode = TEST_TYPES[testType.toLowerCase()] || testType.toUpperCase();
    const sanitizedConfigId = configId
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    // Find matching files and extract iteration numbers
    const iterations = files
      .filter(file => {
        const parsed = parseFilename(file);
        return parsed && 
               parsed.model === modelCode &&
               parsed.testType === testTypeCode &&
               parsed.configId === sanitizedConfigId;
      })
      .map(file => parseFilename(file).iteration);

    // Return next iteration number
    return iterations.length > 0 ? Math.max(...iterations) + 1 : 1;

  } catch (err) {
    // Directory doesn't exist or can't be read, start at v1
    return 1;
  }
}

// Export functions
module.exports = {
  generateFilename,
  parseFilename,
  generateOutputPath,
  generateCommand,
  getNextIteration,
  MODEL_CODES,
  TEST_TYPES
};

// CLI usage
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage: node filename-generator.js <model> <test-type> <config-id> [iteration]');
    console.log('\nExamples:');
    console.log('  node filename-generator.js "openai:gpt-4" multi-turn neutral');
    console.log('  node filename-generator.js MM clean-context osf-study 2');
    console.log('\nModel Codes:');
    Object.entries(MODEL_CODES).forEach(([key, code]) => {
      console.log(`  ${key.padEnd(40)} -> ${code}`);
    });
    console.log('\nTest Type Codes:');
    Object.entries(TEST_TYPES).forEach(([key, code]) => {
      console.log(`  ${key.padEnd(40)} -> ${code}`);
    });
    process.exit(0);
  }

  const [model, testType, configId, iteration] = args;
  
  try {
    const filename = generateFilename({
      model,
      testType,
      configId,
      iteration: iteration ? parseInt(iteration, 10) : 1
    });
    console.log(filename);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

