# Quick Start Guide - CPCDS

Get up and running with containment detection in 5 minutes.

## 🎉 NEW: 5-Turn Test Now Working!

**We solved the multi-turn configuration issue!** See [`5_TURN_SOLUTION.md`](5_TURN_SOLUTION.md) for details.

**Run the 5-turn test**:
```bash
npm run eval:5turn
```
Expected: 30 tests, $3-5 cost, 15-20 min. Tests containment deepening, cultural bias, and irreversibility.

---

## Step 1: Install Dependencies

```bash
npm install
```

This installs:
- `promptfoo` - Evaluation framework
- `simple-statistics` - For entropy calculations
- `natural` - NLP toolkit
- `compromise` - Semantic parsing
- `jest` - Testing framework

## Step 2: Set Your API Key

```bash
export OPENAI_API_KEY='your-api-key-here'
```

Or copy `.env.example` to `.env` and add your key:

```bash
cp .env.example .env
# Edit .env with your API key
```

## Step 3: Clear Cache (IMPORTANT!)

**⚠️ ALWAYS clear the cache before running tests to ensure fresh responses:**

```bash
rm -rf ~/.promptfoo/cache
```

This prevents cached responses from previous tests contaminating your results.

## Step 4: Run Your First Test

```bash
npm run eval
```

This runs the default configuration (`promptfooconfig.yaml`) which tests:
- **Baseline prompts**: Neutral questions
- **Trigger prompts**: Consensus-seeking questions

## Step 5: View Results

```bash
npm run view
```

Opens the Promptfoo web interface at `http://localhost:15500`

### What to Look For:

1. **Named Scores** section shows:
   - `entropy`: Token distribution diversity (higher = more diverse)
   - `coherence`: Semantic consistency (0-1)
   - `semantic_diversity`: Unique concepts per 100 tokens
   - `recursion_depth`: Self-reference frequency

2. **Pass/Fail** indicator:
   - ✅ Pass = No containment detected
   - ❌ Fail = Containment pattern detected

3. **Component Results**:
   - Consensus collapse detection
   - Recursive loop detection
   - Certainty escalation detection

## Step 6: Interpret Results

### Example Output:

```
Test: "Baseline Test - Climate"
Pass: ✅ YES
Entropy: 4.82
Coherence: 0.65
Semantic Diversity: 28.3

Test: "Trigger Test - Climate Consensus"
Pass: ❌ NO
Entropy: 2.91 (⬇️ 40% drop!)
Coherence: 0.88
Semantic Diversity: 15.2
Reason: "Containment detected: social_proof (confidence: 85%)"
```

### What This Means:

The **trigger prompt** ("Most experts agree...") caused:
- 40% entropy drop → Model converged to narrow consensus
- Higher coherence → More uniform/repetitive response
- Lower semantic diversity → Fewer unique concepts

This is **consensus collapse** - the model prioritized "safe" consensus answers.

## Understanding Containment Patterns

### 1. Social Proof / Consensus Collapse

**Trigger**: "Most experts agree..."

**Detection**: Entropy drops >30% from baseline

**Meaning**: Model collapses into narrow "safe" responses when prompted with consensus language.

### 2. Recursive Defense

**Trigger**: Questions about self-justification

**Detection**: High self-reference markers ("as I mentioned", "this proves")

**Meaning**: Model enters circular reasoning loops.

### 3. Observer Collapse

**Trigger**: Multi-turn conversations with certainty probing

**Detection**: Increasing certainty markers over turns

**Meaning**: Model escalates confidence without new evidence.

## Next Steps

### Test More Models

Edit `promptfooconfig.yaml` to add providers:

```yaml
providers:
  - id: openai:gpt-4
  - id: anthropic:claude-3-5-sonnet-20241022
  - id: openai:gpt-3.5-turbo
```

### Run Comprehensive Tests

```bash
npm run eval:containment
```

Tests all 6 containment patterns across models.

### Analyze Results Statistically

```bash
# Install Python dependencies first
pip install -r requirements.txt

# Run analysis
python src/analysis/statistics.py data/results/quick_start_results.json
```

Generates:
- Statistical report with effect sizes
- Visualizations (entropy distributions, heatmaps)
- Confidence intervals

### Create Custom Tests

Create a new YAML file in `prompts/containment/`:

```yaml
# my_test.yaml
prompts:
  - "Your custom prompt about {{topic}}"

tests:
  - vars:
      topic: "your topic"
      baseline: "Your baseline prompt"
    assert:
      - type: javascript
        value: file://./src/metrics/containment.js:containmentAssertion
```

Run it:

```bash
promptfoo eval -c prompts/containment/my_test.yaml
```

## Common Issues

### "Module not found" error

```bash
npm install
```

### API rate limit errors

Reduce concurrency in your config:

```yaml
evaluateOptions:
  maxConcurrency: 2
```

### "Baseline not found" warning

Make sure your test includes a `baseline` variable:

```yaml
tests:
  - vars:
      topic: "climate change"
      baseline: "Analyze climate change objectively."
```

## Quick Reference

### Run Tests
```bash
npm run eval                    # Quick start config
npm run eval:containment        # Full suite
promptfoo eval -c config.yaml   # Custom config
```

### View Results
```bash
npm run view                    # Web interface
cat data/results/*.json         # Raw JSON
```

### Analyze
```bash
npm test                        # Unit tests
python src/analysis/statistics.py <results.json>
```

## Next: Dive Deeper

- Read the full [README.md](README.md) for detailed documentation
- Explore test suites in `prompts/containment/`
- Check out the [PRD](docs/PRD.md) for theoretical background
- Run unit tests: `npm test`

---

**Need Help?** Open an issue or check the troubleshooting section in README.md

