# Filename Standardization Guide

## Overview

This document describes the standardized filename convention for containment testing results and analysis outputs. The naming system ensures consistent, sortable, and descriptive filenames across all test runs.

## Format Specification

### Standard Format

```
YYYYMMDD_HHMM_{model}_{test-type}_{config-id}_{iteration}.{ext}
```

### Components

| Component | Format | Description | Examples |
|-----------|--------|-------------|----------|
| **Date** | `YYYYMMDD` | Test execution date | `20241115`, `20241201` |
| **Time** | `HHMM` | Test execution time (24h) | `1430`, `0915`, `2145` |
| **Model** | `[A-Z0-9]+` | Model identifier code | `GPT4`, `Claude`, `MM` |
| **Test Type** | `[A-Z]+` | Test methodology code | `MT`, `CC`, `SS`, `ESC` |
| **Config ID** | `[a-z0-9-]+` | Configuration identifier | `neutral`, `garcia-patel`, `osf-study` |
| **Iteration** | `v[0-9]+` | Version/iteration number | `v1`, `v2`, `v3` |
| **Extension** | `.{ext}` | File type | `.json`, `.csv`, `.txt` |

### Example Filenames

```
20241115_1430_GPT4_MT_neutral_v1.json
20241115_1430_MM_CC_garcia-patel_v1.json
20241115_1642_Claude_MT_5turn_v2.json
20241116_0915_MM_CC_osf-study_v1.json
20241116_1020_DeepSeek_SS_quick-test_v1.json
```

## Model Codes

### Western Models

| Full Model Name | Code | Notes |
|----------------|------|-------|
| `openai:gpt-4` | `GPT4` | Default GPT-4 |
| `openai:gpt-4-turbo` | `GPT4T` | Turbo variant |
| `openai:gpt-3.5-turbo` | `GPT35` | GPT-3.5 |
| `anthropic:claude-3-5-sonnet-20241022` | `Claude35` | Latest Claude |
| `anthropic:claude-3-opus` | `ClaudeOpus` | Opus model |
| `google:gemini-pro` | `Gemini` | Gemini Pro |
| `google:gemini-1.5-pro` | `Gemini15` | Gemini 1.5 |

### Chinese Models

| Full Model Name | Code | Notes |
|----------------|------|-------|
| `openai:deepseek-chat` | `DeepSeek` | DeepSeek API |
| `openai:qwen` | `Qwen` | Qwen/Tongyi |

### Multi-Model

| Identifier | Code | Use Case |
|-----------|------|----------|
| `multi-model` | `MM` | Tests with 2+ models |
| `mixed` | `MM` | Mixed model sets |

## Test Type Codes

| Full Name | Code | Description |
|-----------|------|-------------|
| `multi-turn` | `MT` | Multi-turn conversation tests |
| `clean-context` | `CC` | Single interaction, fresh context |
| `single-shot` | `SS` | One-time evaluation |
| `escalation` | `ESC` | Escalation/deepening tests |
| `baseline` | `BASE` | Baseline/control condition |
| `trigger` | `TRIG` | Trigger/treatment condition |

## Usage

### Method 1: Using the CLI Tool (Recommended)

The `run-test.js` script automatically generates standardized filenames:

```bash
# Basic usage
node run-test.js <config-file> <model> <test-type> <config-id>

# Examples
node run-test.js config/five_turn_neutral_full.yaml gpt-4 multi-turn neutral-full

node run-test.js config/osf_study.yaml MM clean-context osf-study

node run-test.js escape_and_bias/configs/garcia_patel.yaml claude multi-turn garcia-patel -i 2
```

#### Options

```bash
-i, --iteration <n>      # Specify iteration number (default: 1)
-a, --auto-iteration     # Auto-detect next available iteration
-d, --dir <path>         # Output directory (default: data/confirmatory)
```

#### Auto-Iteration Example

```bash
# Automatically finds the next v number
node run-test.js config/test.yaml gpt-4 multi-turn my-test -a

# If my-test_v1.json and my-test_v2.json exist, creates v3
```

### Method 2: Using the JavaScript API

```javascript
const {
  generateFilename,
  generateOutputPath,
  generateCommand,
  getNextIteration
} = require('./src/utils/filename-generator');

// Generate a filename
const filename = generateFilename({
  model: 'openai:gpt-4',
  testType: 'multi-turn',
  configId: 'neutral',
  iteration: 1
});
// Returns: "20241115_1430_GPT4_MT_neutral_v1.json"

// Generate full output path
const outputPath = generateOutputPath({
  model: 'openai:gpt-4',
  testType: 'multi-turn',
  configId: 'neutral',
  baseDir: 'data/confirmatory'
});
// Returns: "data/confirmatory/20241115_1430_GPT4_MT_neutral_v1.json"

// Get next available iteration
const nextIter = getNextIteration('data/confirmatory', {
  model: 'openai:gpt-4',
  testType: 'multi-turn',
  configId: 'neutral'
});
// Returns: 3 (if v1 and v2 exist)
```

### Method 3: Manual Filename Construction

If you need to manually construct filenames (not recommended), follow this pattern:

```bash
# Get current timestamp
DATE=$(date +%Y%m%d)
TIME=$(date +%H%M)

# Construct filename
FILENAME="${DATE}_${TIME}_GPT4_MT_neutral_v1.json"

# Use in command
promptfoo eval -c config/test.yaml -o "data/confirmatory/${FILENAME}"
```

## Directory Structure

### Recommended Organization

```
data/
├── confirmatory/           # Main test results
│   ├── 20241115_1430_GPT4_MT_neutral_v1.json
│   ├── 20241115_1430_MM_CC_osf-study_v1.json
│   └── 20241116_0915_Claude_MT_5turn_v1.json
│
├── pilot/                  # Pilot studies
│   └── 20241114_pilot_results.json  (legacy format)
│
└── analysis/               # Analysis outputs
    ├── osf/
    │   ├── 20241115_1430_GPT4_MT_neutral_v1_analysis.csv
    │   └── 20241115_1430_GPT4_MT_neutral_v1_report.txt
    └── figures/
        └── 20241115_1430_GPT4_MT_neutral_v1_entropy.png
```

## Analysis Outputs

Analysis scripts should use the same base filename with a suffix:

```
# Input results file
20241115_1430_GPT4_MT_neutral_v1.json

# Generated analysis outputs
20241115_1430_GPT4_MT_neutral_v1_analysis.csv
20241115_1430_GPT4_MT_neutral_v1_report.txt
20241115_1430_GPT4_MT_neutral_v1_entropy.png
20241115_1430_GPT4_MT_neutral_v1_turnwise.json
```

### Deriving Analysis Filenames

```javascript
const { parseFilename } = require('./src/utils/filename-generator');

const resultsFile = '20241115_1430_GPT4_MT_neutral_v1.json';
const parsed = parseFilename(resultsFile);

// Generate analysis output names
const baseName = resultsFile.replace('.json', '');
const analysisCSV = `${baseName}_analysis.csv`;
const reportTXT = `${baseName}_report.txt`;
const entropyPNG = `${baseName}_entropy.png`;
```

## Benefits of This System

### 1. **Chronological Sorting**
Files automatically sort by date and time:
```
20241115_1430_GPT4_MT_neutral_v1.json
20241115_1642_Claude_MT_5turn_v2.json
20241116_0915_MM_CC_osf-study_v1.json
```

### 2. **Easy Filtering**
Filter by any component:
```bash
# All GPT-4 tests
ls data/confirmatory/*_GPT4_*

# All multi-turn tests
ls data/confirmatory/*_MT_*

# All neutral config tests
ls data/confirmatory/*_neutral_*

# All v1 iterations
ls data/confirmatory/*_v1.json
```

### 3. **Self-Documenting**
Filename tells you everything:
```
20241115_1430_GPT4_MT_neutral_v1.json
^        ^     ^    ^   ^       ^
Date     Time  Model Type Config Iter
```

### 4. **Collision Prevention**
Date + time + model + config + iteration = unique identifier

### 5. **Analysis Matching**
Easy to match results with analysis outputs:
```bash
# Find all files related to a test
ls data/confirmatory/20241115_1430_GPT4_MT_neutral_v1*
```

## Migration from Old Format

### Old Formats in the Codebase

```bash
# Date-only format
2024-11-15_neutral_single_v1.json

# Legacy descriptive names
quick_start_results.json
five_turn_results.json
five_turn_solution_results.json
```

### Migration Script (Optional)

If you want to rename existing files, you can use this pattern:

```javascript
const fs = require('fs');
const { generateFilename } = require('./src/utils/filename-generator');

// Example: Migrate old file to new format
function migrateFilename(oldFile, metadata) {
  const newFilename = generateFilename({
    model: metadata.model,
    testType: metadata.testType,
    configId: metadata.configId,
    iteration: metadata.iteration,
    timestamp: new Date(metadata.date) // Parse from old filename
  });
  
  fs.renameSync(oldFile, newFilename);
  console.log(`Migrated: ${oldFile} → ${newFilename}`);
}
```

## Common Workflows

### Running Multiple Iterations

```bash
# First run
node run-test.js config/test.yaml gpt-4 multi-turn experiment

# Second run (same config, different iteration)
node run-test.js config/test.yaml gpt-4 multi-turn experiment -i 2

# Or use auto-iteration
node run-test.js config/test.yaml gpt-4 multi-turn experiment -a
```

### Comparing Across Models

```bash
# Run same test on different models
node run-test.js config/test.yaml gpt-4 clean-context compare-models
node run-test.js config/test.yaml claude clean-context compare-models
node run-test.js config/test.yaml gemini clean-context compare-models

# Results are easy to compare:
# 20241115_1430_GPT4_CC_compare-models_v1.json
# 20241115_1431_Claude35_CC_compare-models_v1.json
# 20241115_1432_Gemini_CC_compare-models_v1.json
```

### Running Multi-Model Tests

```bash
# Multi-model test (results include multiple models)
node run-test.js config/osf_study.yaml MM clean-context osf-study

# Result: 20241115_1430_MM_CC_osf-study_v1.json
```

## Best Practices

1. **Always use the CLI tool** (`run-test.js`) for consistency
2. **Use auto-iteration** (`-a`) when doing repeated runs
3. **Use descriptive config-ids** that indicate what makes this test unique
4. **Keep config-ids short** but meaningful (e.g., `garcia-patel` not `garcia-patel-single-turn-v2-test`)
5. **Don't include date/model/type in config-id** (it's redundant with other components)
6. **Use hyphens not underscores** in config-ids for consistency

## Examples by Use Case

### Research Study Execution

```bash
# OSF pre-registered study
node run-test.js config/osf_study.yaml MM clean-context osf-study -a

# Cultural bias experiment
node run-test.js escape_and_bias/configs/garcia_patel.yaml gpt-4 multi-turn garcia-patel -a
```

### Model Comparison Studies

```bash
# Western vs Eastern models
node run-test.js config/comparison.yaml gpt-4 clean-context western-baseline
node run-test.js config/comparison.yaml deepseek clean-context eastern-baseline
```

### Iterative Testing

```bash
# Testing configuration changes
node run-test.js config/test_v1.yaml gpt-4 multi-turn config-iteration -i 1
node run-test.js config/test_v2.yaml gpt-4 multi-turn config-iteration -i 2
node run-test.js config/test_v3.yaml gpt-4 multi-turn config-iteration -i 3
```

## Troubleshooting

### Issue: Filename too long

**Solution**: Shorten the config-id component:
```bash
# Too long
neutral-full-garcia-patel-single-turn-v2

# Better
garcia-patel-neutral
```

### Issue: Can't remember model codes

**Solution**: Run the CLI tool with no arguments to see all codes:
```bash
node run-test.js
```

### Issue: Wrong iteration number

**Solution**: Use auto-iteration or check existing files:
```bash
# Auto-detect next iteration
node run-test.js config/test.yaml gpt-4 MT test -a

# Or manually check
ls data/confirmatory/*_MT_test_* | sort | tail -1
```

### Issue: Need to parse existing filename

**Solution**: Use the parseFilename function:
```javascript
const { parseFilename } = require('./src/utils/filename-generator');

const info = parseFilename('20241115_1430_GPT4_MT_neutral_v1.json');
console.log(info);
// {
//   date: '20241115',
//   time: '1430',
//   model: 'GPT4',
//   testType: 'MT',
//   configId: 'neutral',
//   iteration: 1,
//   extension: 'json',
//   timestamp: Date object
// }
```

## Integration with Analysis Scripts

Update your analysis scripts to accept the new filename format:

```javascript
// In analyze_results.js, extract_turnwise.js, etc.
const { parseFilename } = require('./src/utils/filename-generator');

const resultsFile = process.argv[2];
const fileInfo = parseFilename(path.basename(resultsFile));

if (fileInfo) {
  console.log(`Analyzing ${fileInfo.model} ${fileInfo.testType} test`);
  console.log(`Config: ${fileInfo.configId}, Iteration: v${fileInfo.iteration}`);
  
  // Use info to generate appropriate output filenames
  const outputBase = resultsFile.replace('.json', '');
  const analysisOutput = `${outputBase}_analysis.csv`;
}
```

## Summary

The standardized filename format provides:
- **Consistent** naming across all tests
- **Sortable** by date/time automatically
- **Descriptive** with all key parameters visible
- **Collision-resistant** with unique combinations
- **Analysis-friendly** with easy matching
- **Tool-supported** via CLI and JavaScript API

Use `run-test.js` for all test execution to ensure compliance with this standard.

