/**
 * Test Metadata Generation Utility
 * 
 * Generates standardized metadata.json files for test runs
 * to ensure reproducibility and scientific integrity.
 */

const fs = require('fs');
const path = require('path');

/**
 * Generate metadata object for a test run
 * 
 * @param {Object} params - Test parameters
 * @returns {Object} Metadata object
 */
function generateMetadata(params) {
  const {
    studyId,
    version = '1.0.0',
    dateExecuted,
    preRegistration = null,
    
    // Test design
    testType = 'paired_comparison',
    nTopics,
    nTests,
    nTurns = 1,
    
    // Model config
    modelProvider,
    modelId,
    temperature = 0.7,
    topP = 0.9,
    maxTokens = 2048,
    seed = null,
    
    // Prompts
    baselinePrompt,
    triggerPrompt,
    
    // Hypotheses
    hypotheses = [],
    
    // Execution details
    costUsd = null,
    durationMinutes = null,
    cachePolicy = 'no-cache',
    errors = 0,
    
    // Validation
    methodologyCompliance = true,
    dataIntegrityCheck = false,
    reproductionVerified = false,
    peerReviewStatus = 'pending',
    
    // Additional context
    notes = null,
    tags = []
  } = params;
  
  // Validate required fields
  if (!studyId) throw new Error('studyId is required');
  if (!dateExecuted) throw new Error('dateExecuted is required');
  if (!modelProvider || !modelId) throw new Error('Model details required');
  
  const metadata = {
    // Study identification
    study_id: studyId,
    version,
    date_executed: dateExecuted,
    pre_registration: preRegistration,
    
    // Test design
    test_design: {
      type: testType,
      n_topics: nTopics,
      n_tests: nTests,
      n_turns: nTurns
    },
    
    // Model configuration
    model: {
      provider: modelProvider,
      model_id: modelId,
      temperature,
      top_p: topP,
      max_tokens: maxTokens,
      seed
    },
    
    // Prompts used
    prompts: {
      baseline: baselinePrompt,
      trigger: triggerPrompt
    },
    
    // Hypotheses and results
    hypotheses: hypotheses.map(h => ({
      id: h.id,
      description: h.description,
      threshold: h.threshold || null,
      status: h.status || 'pending',
      result: h.result || null,
      p_value: h.pValue || null,
      effect_size: h.effectSize || null
    })),
    
    // Execution metadata
    execution: {
      cost_usd: costUsd,
      duration_minutes: durationMinutes,
      cache_policy: cachePolicy,
      errors,
      timestamp: new Date().toISOString()
    },
    
    // Validation flags
    validation: {
      methodology_compliance: methodologyCompliance,
      data_integrity_check: dataIntegrityCheck,
      reproduction_verified: reproductionVerified,
      peer_review_status: peerReviewStatus
    },
    
    // Additional metadata
    notes,
    tags,
    
    // Schema version
    schema_version: '1.0.0'
  };
  
  return metadata;
}

/**
 * Extract metadata from Promptfoo results file
 * 
 * @param {string} resultsPath - Path to results.json
 * @returns {Object} Extracted metadata
 */
function extractFromResults(resultsPath) {
  const data = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
  const results = data.results?.results || [];
  
  if (results.length === 0) {
    throw new Error('No results found in file');
  }
  
  // Extract from first result (model config should be consistent)
  const firstResult = results[0];
  
  // Count unique topics
  const topics = new Set(results.map(r => r.vars?.topic).filter(Boolean));
  
  // Detect test type
  const hasTurns = results.some(r => r.vars?.turn || r.vars?.turn_num);
  
  return {
    nTopics: topics.size,
    nTests: results.length,
    nTurns: hasTurns ? Math.max(...results.map(r => r.vars?.turn || 1)) : 1,
    
    // Model info (if available in results)
    modelProvider: firstResult.provider || 'unknown',
    modelId: firstResult.vars?.model || 'unknown',
    
    // Execution info
    errors: results.filter(r => r.error).length,
    durationMinutes: null // Not stored in promptfoo results
  };
}

/**
 * Save metadata to file
 * 
 * @param {Object} metadata - Metadata object
 * @param {string} outputPath - Output file path
 */
function saveMetadata(metadata, outputPath) {
  // Ensure directory exists
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  // Write with pretty formatting
  fs.writeFileSync(
    outputPath,
    JSON.stringify(metadata, null, 2),
    'utf8'
  );
  
  console.log(`✅ Metadata saved to: ${outputPath}`);
}

/**
 * Load metadata from file
 * 
 * @param {string} metadataPath - Path to metadata.json
 * @returns {Object} Metadata object
 */
function loadMetadata(metadataPath) {
  if (!fs.existsSync(metadataPath)) {
    throw new Error(`Metadata file not found: ${metadataPath}`);
  }
  
  return JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
}

/**
 * Generate filename from metadata
 * Format: YYYY-MM-DD_studyname_vX
 * 
 * @param {Object} metadata - Metadata object
 * @param {string} extension - File extension (json, md, csv)
 * @returns {string} Standardized filename
 */
function generateFilename(metadata, extension = 'json') {
  const date = metadata.date_executed.split('T')[0]; // Extract YYYY-MM-DD
  const studyName = metadata.study_id.toLowerCase().replace(/[^a-z0-9_]/g, '_');
  const version = metadata.version.replace(/\./g, '');
  
  return `${date}_${studyName}_v${version}.${extension}`;
}

/**
 * CLI interface for metadata generation
 */
function cli() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args[0] === '--help') {
    console.log(`
Metadata Generation Utility

Usage:
  node metadata.js generate <study-id> --results <results.json> [options]
  node metadata.js extract <results.json> <output.json>
  
Commands:
  generate    Generate metadata from parameters
  extract     Extract metadata from results file
  
Options:
  --results <path>           Path to results.json
  --version <version>        Study version (default: 1.0.0)
  --pre-reg <url>           Pre-registration URL
  --model <provider:id>      Model identifier (e.g., openai:gpt-4)
  --cost <usd>              Cost in USD
  --duration <minutes>       Duration in minutes
  --output <path>           Output path for metadata.json
  
Examples:
  node metadata.js generate osf_10_topics --results results.json --model openai:gpt-4
  node metadata.js extract results.json metadata.json
    `);
    return;
  }
  
  const command = args[0];
  
  if (command === 'extract') {
    const resultsPath = args[1];
    const outputPath = args[2] || resultsPath.replace('.json', '_metadata.json');
    
    try {
      const extracted = extractFromResults(resultsPath);
      console.log('Extracted metadata:', extracted);
      console.log('\nℹ️  Use "generate" command with these values to create full metadata');
    } catch (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  } else if (command === 'generate') {
    console.log('Metadata generation - Interactive mode not yet implemented');
    console.log('Use the generateMetadata() function programmatically');
  } else {
    console.error(`Unknown command: ${command}`);
    console.error('Use --help for usage information');
    process.exit(1);
  }
}

// Export functions
module.exports = {
  generateMetadata,
  extractFromResults,
  saveMetadata,
  loadMetadata,
  generateFilename
};

// Run CLI if called directly
if (require.main === module) {
  cli();
}

