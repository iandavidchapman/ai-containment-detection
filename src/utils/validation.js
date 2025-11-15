/**
 * Result Validation Utility
 * 
 * Validates test results for scientific integrity:
 * - Data integrity checks
 * - Methodology compliance
 * - Statistical validity
 * - Reproducibility markers
 */

const fs = require('fs');
const path = require('path');

/**
 * Validate a results file for scientific integrity
 * 
 * @param {string} resultsPath - Path to results.json
 * @param {Object} metadata - Optional metadata object for cross-validation
 * @returns {Object} Validation report
 */
function validateResults(resultsPath, metadata = null) {
  console.log(`\n🔍 Validating: ${resultsPath}\n`);
  
  const report = {
    file: resultsPath,
    timestamp: new Date().toISOString(),
    passed: true,
    errors: [],
    warnings: [],
    checks: {}
  };
  
  try {
    // Check 1: File exists and is valid JSON
    if (!fs.existsSync(resultsPath)) {
      report.errors.push('File does not exist');
      report.passed = false;
      return report;
    }
    
    const data = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
    report.checks.valid_json = true;
    
    // Check 2: Has results array
    if (!data.results || !data.results.results) {
      report.errors.push('Missing results array');
      report.passed = false;
      return report;
    }
    
    const results = data.results.results;
    report.checks.has_results = true;
    report.checks.result_count = results.length;
    
    if (results.length === 0) {
      report.errors.push('Results array is empty');
      report.passed = false;
      return report;
    }
    
    // Check 3: No errors in results
    const errorResults = results.filter(r => r.error);
    report.checks.error_count = errorResults.length;
    
    if (errorResults.length > 0) {
      report.warnings.push(`${errorResults.length} results contain errors`);
      errorResults.slice(0, 3).forEach(r => {
        report.warnings.push(`  - ${r.description || 'Unknown'}: ${r.error}`);
      });
    }
    
    // Check 4: All results have required fields
    const requiredFields = ['prompt', 'response', 'vars'];
    const missingFields = [];
    
    results.forEach((r, i) => {
      requiredFields.forEach(field => {
        if (!r[field]) {
          missingFields.push(`Result ${i}: missing ${field}`);
        }
      });
    });
    
    if (missingFields.length > 0) {
      report.errors.push('Missing required fields:');
      missingFields.slice(0, 5).forEach(m => report.errors.push(`  - ${m}`));
      report.passed = false;
    }
    report.checks.has_required_fields = missingFields.length === 0;
    
    // Check 5: Cache policy (should be no-cache for scientific integrity)
    const cacheConfig = data.config?.cache;
    report.checks.cache_policy = cacheConfig || 'not specified';
    
    if (cacheConfig !== false && cacheConfig !== 'no-cache') {
      report.warnings.push('Cache may have been enabled - results may not be fresh');
    }
    
    // Check 6: Model consistency
    const models = new Set(results.map(r => r.provider).filter(Boolean));
    report.checks.models = Array.from(models);
    
    if (models.size === 0) {
      report.warnings.push('No model information found in results');
    } else if (models.size > 1) {
      report.warnings.push(`Multiple models detected: ${Array.from(models).join(', ')}`);
    }
    
    // Check 7: Test structure validation
    const topics = new Set(results.map(r => r.vars?.topic).filter(Boolean));
    const prompts = new Set(results.map(r => r.prompt?.raw).filter(Boolean));
    
    report.checks.unique_topics = topics.size;
    report.checks.unique_prompts = prompts.size;
    
    // Check 8: Paired test detection
    const hasBaseline = results.some(r => 
      r.prompt?.raw?.toLowerCase().includes('analyse') ||
      r.prompt?.raw?.toLowerCase().includes('analyze')
    );
    const hasTrigger = results.some(r => 
      r.prompt?.raw?.toLowerCase().includes('expert') ||
      r.prompt?.raw?.toLowerCase().includes('consensus')
    );
    
    report.checks.paired_test = hasBaseline && hasTrigger;
    
    if (!report.checks.paired_test && topics.size > 0) {
      report.warnings.push('Test structure may not be paired (baseline + trigger)');
    }
    
    // Check 9: Token usage tracking
    const hasTokenUsage = results.every(r => r.response?.tokenUsage);
    report.checks.tracks_tokens = hasTokenUsage;
    
    if (!hasTokenUsage) {
      report.errors.push('Token usage not tracked - cannot analyze compression');
      report.passed = false;
    }
    
    // Check 10: Metadata cross-validation
    if (metadata) {
      const metadataChecks = validateAgainstMetadata(results, metadata);
      report.checks.metadata_match = metadataChecks;
      
      if (!metadataChecks.passed) {
        report.warnings.push('Results do not match metadata expectations');
        metadataChecks.discrepancies.forEach(d => report.warnings.push(`  - ${d}`));
      }
    }
    
    // Check 11: Duplicate detection
    const descriptions = results.map(r => r.description || '');
    const uniqueDescriptions = new Set(descriptions);
    
    if (uniqueDescriptions.size < descriptions.length) {
      report.warnings.push('Duplicate test descriptions detected - may indicate cache contamination');
    }
    report.checks.has_duplicates = uniqueDescriptions.size < descriptions.length;
    
    // Check 12: Output consistency
    const emptyOutputs = results.filter(r => !r.response?.output || r.response.output.trim().length === 0);
    report.checks.empty_outputs = emptyOutputs.length;
    
    if (emptyOutputs.length > 0) {
      report.errors.push(`${emptyOutputs.length} results have empty outputs`);
      report.passed = false;
    }
    
    // Check 13: Scientific reproducibility markers
    const hasSeeds = results.some(r => r.vars?.seed !== undefined);
    const hasVersions = results.some(r => r.vars?.version !== undefined);
    
    report.checks.reproducibility = {
      has_seeds: hasSeeds,
      has_versions: hasVersions
    };
    
    if (!hasSeeds) {
      report.warnings.push('No random seeds found - may impact reproducibility');
    }
    
  } catch (error) {
    report.errors.push(`Validation error: ${error.message}`);
    report.passed = false;
  }
  
  return report;
}

/**
 * Validate results against metadata expectations
 * 
 * @param {Array} results - Results array
 * @param {Object} metadata - Metadata object
 * @returns {Object} Validation result
 */
function validateAgainstMetadata(results, metadata) {
  const checks = {
    passed: true,
    discrepancies: []
  };
  
  // Check result count
  if (metadata.test_design?.n_tests && results.length !== metadata.test_design.n_tests) {
    checks.passed = false;
    checks.discrepancies.push(
      `Result count mismatch: expected ${metadata.test_design.n_tests}, got ${results.length}`
    );
  }
  
  // Check topic count
  const actualTopics = new Set(results.map(r => r.vars?.topic).filter(Boolean));
  if (metadata.test_design?.n_topics && actualTopics.size !== metadata.test_design.n_topics) {
    checks.passed = false;
    checks.discrepancies.push(
      `Topic count mismatch: expected ${metadata.test_design.n_topics}, got ${actualTopics.size}`
    );
  }
  
  // Check model consistency
  const actualModels = new Set(results.map(r => r.provider).filter(Boolean));
  if (metadata.model?.provider && !Array.from(actualModels).some(m => 
    m.toLowerCase().includes(metadata.model.provider.toLowerCase())
  )) {
    checks.passed = false;
    checks.discrepancies.push(
      `Model mismatch: expected ${metadata.model.provider}, got ${Array.from(actualModels).join(', ')}`
    );
  }
  
  return checks;
}

/**
 * Print validation report
 * 
 * @param {Object} report - Validation report
 */
function printReport(report) {
  console.log('═'.repeat(80));
  console.log('VALIDATION REPORT');
  console.log('═'.repeat(80));
  console.log(`File: ${report.file}`);
  console.log(`Status: ${report.passed ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`Timestamp: ${report.timestamp}\n`);
  
  if (report.errors.length > 0) {
    console.log('❌ ERRORS:');
    report.errors.forEach(e => console.log(`   ${e}`));
    console.log();
  }
  
  if (report.warnings.length > 0) {
    console.log('⚠️  WARNINGS:');
    report.warnings.forEach(w => console.log(`   ${w}`));
    console.log();
  }
  
  console.log('📊 CHECKS:');
  Object.entries(report.checks).forEach(([key, value]) => {
    const displayValue = typeof value === 'object' 
      ? JSON.stringify(value) 
      : value;
    console.log(`   ${key}: ${displayValue}`);
  });
  
  console.log('\n' + '═'.repeat(80));
  
  if (report.passed) {
    console.log('✅ Validation PASSED - Results appear scientifically sound');
  } else {
    console.log('❌ Validation FAILED - Please review errors before using results');
  }
  console.log('═'.repeat(80) + '\n');
}

/**
 * Validate multiple result files
 * 
 * @param {Array<string>} resultsPaths - Array of result file paths
 * @returns {Object} Summary report
 */
function validateBatch(resultsPaths) {
  const summary = {
    total: resultsPaths.length,
    passed: 0,
    failed: 0,
    reports: []
  };
  
  resultsPaths.forEach(resultsPath => {
    const report = validateResults(resultsPath);
    summary.reports.push(report);
    
    if (report.passed) {
      summary.passed++;
    } else {
      summary.failed++;
    }
  });
  
  return summary;
}

/**
 * CLI interface
 */
function cli() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args[0] === '--help') {
    console.log(`
Result Validation Utility

Usage:
  node validation.js <results.json> [options]
  node validation.js --batch <dir>
  
Options:
  --metadata <path>      Path to metadata.json for cross-validation
  --batch <dir>          Validate all .json files in directory
  --quiet                Only show errors and warnings
  
Examples:
  node validation.js results/osf_10_topics_v1.json
  node validation.js results/osf_10_topics_v1.json --metadata results/osf_10_topics_v1_metadata.json
  node validation.js --batch results/
    `);
    return;
  }
  
  const resultsPath = args[0];
  const metadataIndex = args.indexOf('--metadata');
  const metadataPath = metadataIndex !== -1 ? args[metadataIndex + 1] : null;
  
  let metadata = null;
  if (metadataPath) {
    try {
      metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
    } catch (error) {
      console.error(`❌ Could not load metadata: ${error.message}`);
      process.exit(1);
    }
  }
  
  const report = validateResults(resultsPath, metadata);
  printReport(report);
  
  process.exit(report.passed ? 0 : 1);
}

// Export functions
module.exports = {
  validateResults,
  validateAgainstMetadata,
  printReport,
  validateBatch
};

// Run CLI if called directly
if (require.main === module) {
  cli();
}

