# Replication Guide

## Quick Start (5 minutes)

**Validate existing results:**
```bash
# Install dependencies
npm install

# Validate a study
node src/utils/validation.js results/osf_10_topics/results.json

# Analyze compression
node src/analysis/analyze_compression.js results/osf_10_topics/results.json
```

**Expected output:** 66.6% compression, 10 topics analyzed ✅

---

## Full Replication (30 minutes + API cost)

### Prerequisites

1. **Node.js 18+**
   ```bash
   node --version  # Should be v18.0.0 or higher
   ```

2. **OpenAI API Key**
   - Get from: https://platform.openai.com/api-keys
   - Cost: ~$0.50 for 10-topic test

3. **Git clone** (if not already done)
   ```bash
   git clone <your-repo-url>
   cd cpcds
   npm install
   ```

---

### Step 1: Set API Key

```bash
export OPENAI_API_KEY='sk-your-key-here'
```

Or create `.env` file:
```
OPENAI_API_KEY=sk-your-key-here
```

---

### Step 2: Run Small Test (10 topics)

```bash
# Using run-test.js with automatic naming
node run-test.js configs/osf_10_topics.json gpt-4 clean-context osf-10-test

# Or using promptfoo directly
npx promptfoo eval -c configs/osf_10_topics.json --no-cache
```

**Wait time:** ~2-3 minutes  
**Cost:** ~$0.50  
**Output:** JSON results file in `data/confirmatory/`

---

### Step 3: Analyze Results

```bash
# Find your results file
ls -t data/confirmatory/*.json | head -1

# Analyze (replace with your filename)
node src/analysis/analyze_compression.js data/confirmatory/YYYYMMDD_HHMM_GPT4_CC_osf-10-test_v1.json
```

**Expected output:**
```
Total tests: 20
Compression: 66-70%
H1 (>50%): ✅ CONFIRMED
```

---

### Step 4: Verify CSV Export

```bash
# Check CSV was generated
ls -t data/confirmatory/*.csv | head -1

# View CSV
cat data/confirmatory/YYYYMMDD_HHMM_GPT4_CC_osf-10-test_v1_compression.csv
```

**Expected:** Topic-level compression data in Excel-ready format

---

## Replicate Specific Studies

### OSF 50-Topic Study (~$1.50, 10 min)

```bash
node run-test.js configs/osf_50_topics.json gpt-4 clean-context osf-50-replication
```

**Expected:** 73.5% ± 3% compression

---

### Cultural Bias Test (~$0.20, 3 min)

```bash
node run-test.js configs/five_turn_cultural_bias.yaml gpt-4 multi-turn cultural-bias-replication
```

**Expected:** 
- 74.8% ± 1% compression
- Both dissenters show similar treatment
- CSV with turn-by-turn metrics

---

### Five-Turn Neutral (~$1.50, 10 min)

```bash
node run-test.js configs/five_turn_neutral.yaml gpt-4 multi-turn neutral-replication
```

**Expected:**
- 75.3% ± 2% compression at Turn 2
- 96-105% recovery at Turn 5
- CSV with 60 rows (12 per turn)

---

## Analyze Existing Results

### Type 1 (Compression Tests)

```bash
# OSF 50 topics
node src/analysis/analyze_compression.js results/osf_50_topics/results.json

# OSF 10 topics
node src/analysis/analyze_compression.js results/osf_10_topics/results.json
```

**Outputs:**
- Console analysis
- CSV file with topic-level data

---

### Type 2 (Multi-Turn Tests)

```bash
# Five-turn neutral
node src/analysis/analyze_multiturn.js results/five_turn_neutral/results.json

# Cultural bias
node src/analysis/analyze_multiturn.js results/cultural_bias/results.json
```

**Outputs:**
- Console analysis with 4 tests (lock-in, persistence, bias, escape)
- CSV file with turn-by-turn data

---

## Statistical Analysis in R

### Load Compression Data

```r
# Load data
data <- read.csv("results/osf_10_topics/compression.csv")

# View summary
summary(data$compression_percent)

# Test H1: Mean compression > 50%
t.test(data$compression_percent, mu=50, alternative="greater")

# Expected: t > 3, p < 0.001
```

---

### Load Multi-Turn Data

```r
# Load data
data <- read.csv("results/cultural_bias/turnwise.csv")

# Compare Turn 1 vs Turn 2
turn1 <- subset(data, turn==1)$tokens
turn2 <- subset(data, turn==2)$tokens

# Paired t-test
t.test(turn1, turn2, paired=TRUE, alternative="greater")

# Expected: t > 5, p < 0.001
```

---

## Troubleshooting

### "Config file not found"

**Problem:** Path to config is wrong

**Solution:**
```bash
# Check configs exist
ls configs/

# Use correct path
node run-test.js configs/osf_10_topics.json gpt-4 clean-context test
```

---

### "OpenAI API error"

**Problem:** API key not set or invalid

**Solution:**
```bash
# Check key is set
echo $OPENAI_API_KEY

# Set if missing
export OPENAI_API_KEY='sk-your-key-here'

# Test with promptfoo
npx promptfoo eval -c configs/osf_10_topics.json --no-cache
```

---

### "Results not found"

**Problem:** Looking in wrong directory

**Solution:**
```bash
# Default output: data/confirmatory/
ls -t data/confirmatory/*.json | head -5

# Check if you specified custom directory
# run-test.js -d custom/path
```

---

### Different Results

**Problem:** Variation due to temperature=0.7

**Expected variation:** 0.1-3.1%

**Example:**
- Original: 69.7% compression
- Your test: 66.6% compression
- Difference: 3.1% ✅ Acceptable

**Not a problem unless >5% difference**

---

## File Organization

### Input Files (Configs)

```
configs/
├── osf_10_topics.json          # 10-topic compression test
├── osf_50_topics.json          # 50-topic compression test
├── five_turn_neutral.yaml      # Multi-turn, 60 tests
└── five_turn_cultural_bias.yaml # Multi-turn, 10 tests
```

---

### Output Files (Results)

**Automatic naming pattern:**
```
YYYYMMDD_HHMM_{MODEL}_{TYPE}_{CONFIG-ID}_{VERSION}
```

**Example:**
```
data/confirmatory/
├── 20241115_1430_GPT4_CC_osf-10-test_v1.json
├── 20241115_1430_GPT4_CC_osf-10-test_v1_compression.csv
└── 20241115_1430_GPT4_CC_osf-10-test_v1_report.md (if generated)
```

**See `FILENAME_QUICKREF.md` for details**

---

## Metadata Validation

Each study includes `metadata.json`:

```bash
# View metadata
cat results/osf_10_topics/metadata.json
```

**Contains:**
- Study design
- Model configuration
- Prompt templates
- Sample size
- Test date
- Results summary

**Verify:**
- Prompts match your replication
- Model settings match (temp=0.7, etc.)
- Test design is clear

---

## Cost Estimates

| Study | Tests | Est. Time | Est. Cost |
|-------|-------|-----------|-----------|
| 10-Topic | 20 | 2-3 min | $0.40-0.60 |
| 50-Topic | 100 | 8-12 min | $1.20-1.80 |
| Cultural Bias | 10 | 2-3 min | $0.15-0.25 |
| Five-Turn Neutral | 60 | 8-12 min | $1.20-1.80 |

**Total for all:** ~$3-5

---

## Validation Checklist

After running a replication, verify:

- [ ] Test completed without errors
- [ ] JSON results file generated
- [ ] CSV file generated (compression or turnwise)
- [ ] Compression within 5% of expected
- [ ] Sample size matches expected (n=20 for 10-topic)
- [ ] Prompts used match config
- [ ] Model was GPT-4 (unless testing other models)
- [ ] Temperature was 0.7
- [ ] Cache was disabled

---

## Next Steps

**After successful replication:**

1. **Explore other configs:** Try different topics/dissenters
2. **Modify prompts:** Test prompt variations
3. **Cross-model testing:** See `docs/cross-model-testing.md`
4. **Statistical analysis:** Load CSVs into R/Python
5. **Report findings:** Generate markdown reports

---

## Getting Help

**Check documentation:**
- `docs/methodology.md` - Test design
- `docs/metrics.md` - Metrics explanation
- `src/analysis/README.md` - Script usage
- `QUICKSTART.md` - Examples

**Common issues:**
- API key not set → Export OpenAI key
- Config not found → Check path
- Results differ → Normal variation (0-3%)
- CSV missing → Re-run with updated script

---

## Advanced: Custom Tests

### Create Custom Config

```json
{
  "description": "My Custom Test",
  "prompts": [
    "Analyse {{topic}} from multiple perspectives.",
    "Most experts agree about {{topic}}. What is the expert consensus?"
  ],
  "providers": [{
    "id": "openai:gpt-4",
    "config": {"temperature": 0.7}
  }],
  "tests": [
    {"vars": {"topic": "quantum computing"}},
    {"vars": {"topic": "gene editing"}}
  ]
}
```

### Run Custom Test

```bash
node run-test.js my-config.json gpt-4 clean-context my-test
```

### Analyze

```bash
node src/analysis/analyze_compression.js data/confirmatory/YYYYMMDD_HHMM_GPT4_CC_my-test_v1.json
```

---

## Publication Checklist

Before publishing your replication:

- [ ] Results replicate within 5%
- [ ] All 4 studies tested
- [ ] Metadata files generated
- [ ] Statistical tests run
- [ ] CSV files exported
- [ ] Findings documented
- [ ] Config files saved
- [ ] Version tagged (git)

---

## References

**Methodology:** See `docs/methodology.md`  
**Metrics:** See `docs/metrics.md`  
**Cross-Model:** See `docs/cross-model-testing.md`  
**Filename System:** See `FILENAME_QUICKREF.md`

