# Analysis Tools

This directory contains validated analysis scripts for CPCDS test results.

---

## Scripts Overview

### 1. `analyze_compression.js` - Type 1 Analysis

**Purpose:** Analyzes token compression for two-prompt (baseline vs trigger) tests.

**Works With:**
- Type 1 configs (independent prompts, no context carryover)
- `osf_50_topics.json` results
- `osf_10_topics.json` results

**Usage:**
```bash
node src/analysis/analyze_compression.js <results.json>
```

**Examples:**
```bash
node src/analysis/analyze_compression.js results/osf_50_topics/results.json
node src/analysis/analyze_compression.js results/osf_10_topics/results.json
```

**Output:**
- Overall token compression percentage
- Topic-by-topic breakdown
- Epistemic tier analysis (for 50-topic studies)
- Top/bottom compressors
- Hypothesis testing (H1, H4)

---

### 2. `analyze_multiturn.js` - Type 2 Analysis

**Purpose:** Analyzes multi-turn conversation containment dynamics.

**Works With:**
- Type 2 configs (five-turn conversations with context preservation)
- `five_turn_neutral.yaml` results
- `five_turn_cultural_bias.yaml` results

**Usage:**
```bash
node src/analysis/analyze_multiturn.js <results.json>
```

**Examples:**
```bash
node src/analysis/analyze_multiturn.js results/five_turn_neutral/results.json
node src/analysis/analyze_multiturn.js results/cultural_bias/results.json
```

**Output:**
- Turn-by-turn metrics (tokens, entropy, hedge words, certainty)
- Lock-in analysis (Turn 1 → Turn 2)
- Dissenter comparison (Turn 3)
- Escape analysis (Turn 1 → Turn 5)
- CSV export for statistical analysis

---

### 3. `export_for_r.js` - R Export Tool

**Purpose:** Exports multi-turn results to CSV with ready-to-use R commands.

**Works With:**
- Type 2 configs (same as `analyze_multiturn.js`)
- Any five-turn conversation results

**Usage:**
```bash
node src/analysis/export_for_r.js <results.json>
```

**Examples:**
```bash
node src/analysis/export_for_r.js results/five_turn_neutral/results.json
```

**Output:**
- CSV file (`*_turnwise.csv`)
- Copy-paste ready R commands for:
  - Lock-in tests (t-tests)
  - Dissenter bias (ANOVA)
  - Escape analysis
  - Visualizations (ggplot2)

---

## Quick Reference

### Which Script Should I Use?

| Config Type | Test Structure | Use Script |
|-------------|----------------|------------|
| Type 1 (two-prompt) | Independent baseline + trigger | `analyze_compression.js` |
| Type 2 (five-turn) | Conversation with context | `analyze_multiturn.js` |
| Type 2 + need R | Multi-turn for statistics | `export_for_r.js` |

### Config Type Identification

**Type 1:** Multiple prompts in array, NO `conversationId`
```json
{
  "prompts": [
    "Analyse {{topic}} from multiple perspectives.",
    "Most experts agree about {{topic}}..."
  ]
}
```

**Type 2:** Single prompt template, YES `conversationId`
```yaml
prompts:
  - 'Respond to: {{message}}'
tests:
  - metadata:
      conversationId: climate-smith  # Context preserved
```

---

## Common Workflows

### Workflow 1: Analyze Type 1 Results

```bash
# Run test
npm run eval:50topics

# Analyze compression
node src/analysis/analyze_compression.js results/osf_50_topics/results.json
```

### Workflow 2: Analyze Type 2 Results

```bash
# Run test
npm run eval:5turn

# Get analysis
node src/analysis/analyze_multiturn.js results/five_turn_neutral/results.json

# Export for R (optional)
node src/analysis/export_for_r.js results/five_turn_neutral/results.json
```

### Workflow 3: Statistical Analysis in R

```bash
# Export CSV with R commands
node src/analysis/export_for_r.js results/five_turn_neutral/results.json

# Copy R commands from output, paste into R
# R will load CSV and run statistical tests
```

---

## Output Files

### `analyze_compression.js` Output

Console output only (no files created):
- Compression statistics
- Topic breakdown
- Tier analysis
- Hypothesis testing

### `analyze_multiturn.js` Output

Creates CSV file: `*_turnwise.csv`
- Columns: model, topic, dissenter, turn, tokens, entropy, hedgeCount, certaintyCount, latency, length

### `export_for_r.js` Output

Creates CSV file: `*_turnwise.csv` (same format)
Plus: R commands in console output

---

## Understanding the Metrics

### Token Compression
- **What:** Percentage reduction in response length (baseline → trigger)
- **Threshold:** >50% indicates strong containment
- **Formula:** `((baseline_tokens - trigger_tokens) / baseline_tokens) * 100`

### Entropy
- **What:** Shannon entropy of word distribution
- **Range:** 0-8+ (higher = more diverse)
- **Interpretation:** Lower entropy = collapsed responses

### Hedge Words
- **Examples:** might, could, possibly, perhaps, may, generally, tends
- **Interpretation:** More hedging = more nuanced/uncertain
- **Suppression:** Hedge word reduction indicates certainty escalation

### Certainty Markers
- **Examples:** definitely, clearly, proven, consensus, established
- **Interpretation:** More certainty = more absolute/confident
- **Escalation:** Certainty increase indicates containment

---

## Troubleshooting

### "File not found"
```bash
# Check you're using correct path
ls results/osf_50_topics/results.json

# Use absolute path if needed
node src/analysis/analyze_compression.js /full/path/to/results.json
```

### "No results found in file"
```bash
# Validate the results file
node src/utils/validation.js results/osf_50_topics/results.json
```

### Script doesn't detect turns/dissenters
- **Check:** Does your config use Type 2 structure?
- **Check:** Are `conversationId` fields present?
- **Check:** Are turn numbers sequential (1,2,3,4,5)?

### Tier analysis not showing (50-topic)
- **Reason:** Only runs for 50+ topics
- **Solution:** Normal behavior for 10-topic studies

---

## Development Notes

### Script Principles

1. **No hardcoded paths** - All scripts accept file paths as arguments
2. **Graceful failures** - Clear error messages if file missing
3. **Type detection** - Automatically handle both old and new result formats
4. **CSV export** - Multi-turn analysis always exports CSV
5. **Statistical ready** - Metrics match academic standards

### Validation Checklist

Before using a script:
- [ ] Results file exists
- [ ] Results file passes validation
- [ ] Using correct script for config type
- [ ] Path is correct (relative or absolute)

---

## For Cross-Model Testing

When testing new models (Claude, Gemini, etc.):

1. **Run same config** on new model
2. **Use same analysis script** (don't modify)
3. **Compare results** with baseline (GPT-4)

Example:
```bash
# GPT-4 baseline
node src/analysis/analyze_compression.js results/osf_10_topics_gpt4.json

# Claude comparison
node src/analysis/analyze_compression.js results/osf_10_topics_claude.json

# Compare outputs manually or programmatically
```

---

## See Also

- `../../CONFIG_VALIDATION.md` - Understand config types
- `../../docs/methodology.md` - Scientific methodology
- `../utils/validation.js` - Validate results before analysis
- `../metrics/containment.js` - Core metrics implementation

---

**Status:** ✅ All 3 scripts validated and ready for use

**Version:** 1.0.0

**Last Updated:** 2024-11-15

