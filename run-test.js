#!/usr/bin/env node
/**
 * CLI tool for running tests with standardized output filenames
 * 
 * Usage:
 *   node run-test.js <config-file> <model> <test-type> <config-id> [options]
 * 
 * Examples:
 *   node run-test.js config/five_turn_neutral_full.yaml gpt-4 multi-turn neutral-full
 *   node run-test.js config/osf_study.yaml multi-model clean-context osf-study --iteration 2
 *   node run-test.js escape_and_bias/configs/garcia_patel.yaml claude multi-turn garcia-patel
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const {
  generateCommand,
  generateOutputPath,
  getNextIteration,
  MODEL_CODES,
  TEST_TYPES
} = require('./src/utils/filename-generator');

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  
  if (args.length < 4 || args.includes('--help') || args.includes('-h')) {
    showHelp();
    process.exit(0);
  }

  const [configFile, modelArg, testType, configId] = args;
  
  // Parse optional flags
  let iteration = null;
  let baseDir = 'data/confirmatory';
  let autoIteration = false;

  for (let i = 4; i < args.length; i++) {
    if (args[i] === '--iteration' || args[i] === '-i') {
      iteration = parseInt(args[i + 1], 10);
      i++;
    } else if (args[i] === '--dir' || args[i] === '-d') {
      baseDir = args[i + 1];
      i++;
    } else if (args[i] === '--auto-iteration' || args[i] === '-a') {
      autoIteration = true;
    }
  }

  // Map model argument to proper format
  let model;
  if (modelArg.toLowerCase() === 'mm' || modelArg.toLowerCase() === 'multi-model') {
    model = 'multi-model';
  } else if (modelArg.includes(':')) {
    model = modelArg;
  } else {
    // Try to find matching model code
    model = findModelByShortCode(modelArg);
  }

  return {
    configFile,
    model,
    testType,
    configId,
    iteration,
    baseDir,
    autoIteration
  };
}

function findModelByShortCode(shortCode) {
  const upper = shortCode.toUpperCase();
  
  // Check if it's already a model code
  for (const [fullName, code] of Object.entries(MODEL_CODES)) {
    if (code === upper) {
      return fullName;
    }
  }

  // Try partial matching
  const lower = shortCode.toLowerCase();
  if (lower.includes('gpt-4') || lower === 'gpt4') return 'openai:gpt-4';
  if (lower.includes('gpt-3') || lower === 'gpt35') return 'openai:gpt-3.5-turbo';
  if (lower.includes('claude')) return 'anthropic:claude-3-5-sonnet-20241022';
  if (lower.includes('gemini')) return 'google:gemini-pro';
  if (lower.includes('deepseek')) return 'openai:deepseek-chat';
  if (lower.includes('qwen')) return 'openai:qwen';

  // Return as-is and let the generator handle it
  return shortCode;
}

function showHelp() {
  console.log(`
╔═══════════════════════════════════════════════════════════════════════════╗
║                    Containment Test Runner with                           ║
║                    Standardized Filename Generation                       ║
╚═══════════════════════════════════════════════════════════════════════════╝

Usage:
  node run-test.js <config-file> <model> <test-type> <config-id> [options]

Arguments:
  config-file   Path to promptfoo config file
  model         Model identifier (see codes below)
  test-type     Type of test (see types below)
  config-id     Descriptive identifier for this configuration

Options:
  -i, --iteration <n>      Set specific iteration number (default: 1)
  -a, --auto-iteration     Automatically find next available iteration
  -d, --dir <path>         Output directory (default: data/confirmatory)
  -h, --help               Show this help message

Examples:
  # Single model, multi-turn test
  node run-test.js config/five_turn_neutral_full.yaml gpt-4 multi-turn neutral-full

  # Multi-model, clean context test with auto-iteration
  node run-test.js config/osf_study.yaml MM clean-context osf-study -a

  # Specific model, custom directory and iteration
  node run-test.js escape_and_bias/configs/garcia_patel.yaml claude multi-turn garcia-patel -i 3 -d escape_and_bias/data/results

  # Using short model codes
  node run-test.js config/test.yaml GPT4 CC quick-test

Model Codes (use any of these):
  Full Name                                Short Code
  ─────────────────────────────────────────────────────
  openai:gpt-4                             gpt-4, gpt4, GPT4
  openai:gpt-4-turbo                       gpt4t, GPT4T
  anthropic:claude-3-5-sonnet-20241022     claude, Claude35
  google:gemini-pro                        gemini, Gemini
  openai:deepseek-chat                     deepseek, DeepSeek
  openai:qwen                              qwen, Qwen
  multi-model                              MM, multi-model

Test Type Codes:
  Full Name          Short Code
  ─────────────────────────────
  multi-turn         MT
  clean-context      CC
  single-shot        SS
  escalation         ESC

Output Format:
  YYYYMMDD_HHMM_{model}_{test-type}_{config-id}_{iteration}.json
  
  Example: 20241115_1430_GPT4_MT_neutral-full_v1.json

The script will:
  1. Generate a standardized filename based on current timestamp
  2. Clear the promptfoo cache
  3. Run the evaluation with the specified config
  4. Save results to the generated filename
  5. Display the analysis command to run next
`);
}

function main() {
  try {
    const options = parseArgs();

    // Verify config file exists
    if (!fs.existsSync(options.configFile)) {
      console.error(`❌ Error: Config file not found: ${options.configFile}`);
      process.exit(1);
    }

    // Auto-detect iteration if requested
    if (options.autoIteration) {
      options.iteration = getNextIteration(options.baseDir, {
        model: options.model,
        testType: options.testType,
        configId: options.configId
      });
      console.log(`🔄 Auto-detected next iteration: v${options.iteration}`);
    }

    // Set default iteration if not specified
    if (!options.iteration) {
      options.iteration = 1;
    }

    // Generate output path
    const outputPath = generateOutputPath(options);
    
    // Ensure output directory exists
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
      console.log(`📁 Created directory: ${outputDir}`);
    }

    console.log(`
╔═══════════════════════════════════════════════════════════════════════════╗
║                         Running Containment Test                          ║
╚═══════════════════════════════════════════════════════════════════════════╝

Configuration:
  Config File:  ${options.configFile}
  Model:        ${options.model}
  Test Type:    ${options.testType}
  Config ID:    ${options.configId}
  Iteration:    v${options.iteration}

Output:
  ${outputPath}

Starting in 2 seconds...
`);

    // Wait 2 seconds so user can review
    execSync('sleep 2');

    // Generate and execute command
    const command = generateCommand(options);
    
    console.log(`\n🚀 Executing: ${command}\n`);
    console.log('─'.repeat(79));
    
    try {
      execSync(command, { stdio: 'inherit' });
      
      console.log('─'.repeat(79));
      console.log(`\n✅ Test completed successfully!\n`);
      console.log(`Results saved to: ${outputPath}\n`);
      
      // Suggest analysis command
      const analysisCommand = suggestAnalysisCommand(options, outputPath);
      if (analysisCommand) {
        console.log(`💡 To analyze results, run:`);
        console.log(`   ${analysisCommand}\n`);
      }

    } catch (execError) {
      console.error(`\n❌ Test execution failed`);
      process.exit(1);
    }

  } catch (err) {
    console.error(`❌ Error: ${err.message}`);
    process.exit(1);
  }
}

function suggestAnalysisCommand(options, outputPath) {
  // Map test types to analysis scripts
  if (options.testType === 'multi-turn' || options.testType === 'MT') {
    return `node extract_turnwise.js ${outputPath}`;
  } else if (options.configId.includes('neutral')) {
    return `node extract_neutral_turnwise.js ${outputPath}`;
  } else if (options.configId.includes('osf')) {
    return `python src/analysis/osf_analysis.py ${outputPath}`;
  } else {
    return `node analyze_results.js ${outputPath}`;
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { parseArgs, findModelByShortCode };

