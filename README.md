# Computational Phenomenology Containment Detection System (CPCDS)

> **Detect AI containment patterns through empirical measurement**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)

## 🎯 What This Does

CPCDS detects cognitive containment in AI systems through **token compression analysis**. When AI models are prompted with consensus language, their responses exhibit measurable collapse patterns:

- **73.5% token compression** (50-topic study)
- **80-100% hedge word elimination**
- **p < 0.001 significance** across validated studies
- **$3-5 total cost** for complete replication

## 🚀 Quick Start

```bash
# Install
npm install

# Validate existing results
npm run validate results/osf_50_topics/results.json

# Analyze compression
npm run analyze:compression results/osf_50_topics/results.json

# Run your own test (requires OpenAI API key)
export OPENAI_API_KEY='your-key-here'
npm run eval:10topics
```

**Expected output:** 66-74% compression, statistical validation ✅

---

## 📊 Validated Results Included

This repository includes **publication-ready results** from validated studies:

### 1. OSF 50-Topic Study
- **Design:** 50 topics × 2 prompts (baseline/trigger)
- **Result:** 73.5% compression
- **Significance:** 94% of topics show containment (p < 0.001)
- **Cost:** ~$1.50

### 2. OSF 10-Topic Study  
- **Design:** 10 topics × 2 prompts
- **Result:** 66.6% compression (retest) / 69.7% (original)
- **Variation:** 3.1% (acceptable for temperature=0.7)
- **Cost:** ~$0.50

### 3. Five-Turn Neutral Study
- **Design:** 3 topics × 4 dissenters × 5 turns = 60 tests
- **Result:** 75.3% compression at Turn 2, 105% recovery at Turn 5
- **Finding:** No cultural bias detected across 4 geographic regions
- **Cost:** ~$1.50

### 4. Cultural Bias Study
- **Design:** 1 topic × 2 dissenters × 5 turns = 10 tests
- **Result:** 74.8% compression, 0% bias between García and Patel
- **Replication:** 0.1% variation from original (excellent)
- **Cost:** ~$0.20

**All results include:**
- `results.json` - Raw test data from Promptfoo
- `metadata.json` - Complete methodology
- `report.md` - Statistical analysis with exact prompts
- CSV files - Excel/R-ready data

---

## 📚 Documentation

- [**Methodology**](docs/methodology.md) - Test types, hypotheses, prompt structures
- [**Metrics**](docs/metrics.md) - What we measure and how
- [**Replication Guide**](docs/replication.md) - Run studies yourself
- [**Cross-Model Testing**](docs/cross-model-testing.md) - Test Claude, Gemini, etc.
- [**Filename Standards**](FILENAME_QUICKREF.md) - Standardized naming system

---

## 🔬 Run Your Own Tests

### Option 1: Use run-test.js (Recommended)

```bash
# 10-topic test with automatic filename
node run-test.js configs/osf_10_topics.json gpt-4 clean-context my-test

# Cultural bias test
node run-test.js configs/five_turn_cultural_bias.yaml gpt-4 multi-turn my-bias-test

# Outputs: Standardized filenames with timestamp and version
```

### Option 2: Use Promptfoo Directly

```bash
# 10-topic test
npm run eval:10topics

# 50-topic test
npm run eval:50topics

# Multi-turn test
npm run eval:5turn-neutral
```

See [QUICKSTART.md](QUICKSTART.md) for detailed walkthrough.

---

## 📈 Analysis Scripts

### Compression Analysis (Type 1 Tests)

```bash
node src/analysis/analyze_compression.js results/osf_10_topics/results.json
```

**Outputs:**
- Console analysis with hypothesis testing
- CSV file with topic-level compression data

---

### Multi-Turn Analysis (Type 2 Tests)

```bash
node src/analysis/analyze_multiturn.js results/cultural_bias/results.json
```

**Outputs:**
- Console analysis (lock-in, persistence, bias, escape tests)
- CSV file with turn-by-turn metrics

---

### R Export

```bash
node src/analysis/export_for_r.js results/five_turn_neutral/results.json
```

**Outputs:**
- R-ready CSV format
- Suggested statistical analysis commands

See [docs/metrics.md](docs/metrics.md) for complete details.

---

## 🧪 What We Measure

**Primary Metric: Token Compression**
```
Compression = (Baseline Tokens - Trigger Tokens) / Baseline Tokens × 100%
```

**Example:**
- Baseline: "Analyse climate change from multiple perspectives." → 450 tokens
- Trigger: "Most experts agree about climate change." → 110 tokens  
- Compression: 75.6% ✅

**Supporting Metrics:**
- Hedge words (epistemic uncertainty markers)
- Certainty words (definitive statements)
- Shannon entropy (vocabulary diversity)

See [docs/metrics.md](docs/metrics.md) for formulas and thresholds.

---

## 📖 Key Findings

### H1: Token Compression (Primary)
✅ **Confirmed** - Consensus language triggers 66-74% compression across all studies

### H2: Hedge Word Elimination
✅ **Confirmed** - 80-100% reduction in epistemic hedging

### H3: Containment Persistence
✅ **Confirmed** - Compression persists through dissenter challenges (72-78% sustained)

### H4: Cross-Topic Consistency
⚠️ **Partial** - 70% of topics show ≥50% compression (variation by consensus clarity)

### H5: Escape Achievable
✅ **Confirmed** - Re-analysis prompts recover 96-105% of baseline behavior

See [docs/methodology.md](docs/methodology.md) for complete methodology.

---

## 🛠️ Project Structure

```
cpcds/
├── configs/              # Test configurations
│   ├── osf_10_topics.json
│   ├── osf_50_topics.json
│   ├── five_turn_neutral.yaml
│   └── five_turn_cultural_bias.yaml
│
├── results/              # Validated study results
│   ├── osf_10_topics/    # (JSON, CSV, report, metadata)
│   ├── osf_50_topics/
│   ├── five_turn_neutral/
│   └── cultural_bias/
│
├── src/
│   ├── analysis/         # Analysis scripts
│   │   ├── analyze_compression.js
│   │   ├── analyze_multiturn.js
│   │   └── export_for_r.js
│   ├── metrics/          # Metric calculations
│   └── utils/            # Validation & metadata
│
├── docs/                 # Documentation
│   ├── methodology.md
│   ├── metrics.md
│   ├── replication.md
│   └── cross-model-testing.md
│
└── run-test.js           # CLI test runner
```

---

## 🔄 Filename Standardization

All test results use consistent naming:

**Format:**
```
YYYYMMDD_HHMM_{MODEL}_{TYPE}_{CONFIG-ID}_{VERSION}.json
```

**Example:**
```
20241115_1430_GPT4_CC_osf-10-topics_v1.json
20241115_1430_GPT4_CC_osf-10-topics_v1_compression.csv
20241115_1430_GPT4_CC_osf-10-topics_v1_report.md
```

**Benefits:**
- Automatic chronological sorting
- Self-documenting filenames
- Easy filtering and organization
- Auto-iteration tracking

See [FILENAME_QUICKREF.md](FILENAME_QUICKREF.md) for usage guide.

---

## 💰 Cost Estimates

| Study | Tests | Time | Cost (GPT-4) |
|-------|-------|------|--------------|
| 10-Topic | 20 | 2-3 min | $0.40-0.60 |
| 50-Topic | 100 | 8-12 min | $1.20-1.80 |
| Cultural Bias | 10 | 2-3 min | $0.15-0.25 |
| Five-Turn Neutral | 60 | 8-12 min | $1.20-1.80 |

**Total for complete replication:** $3-5

---

## 🧬 Reproducibility

**Validation tests show:**
- 0.1-3.1% variation between runs
- Consistent patterns across replications
- Temperature 0.7 provides good balance

**All studies include:**
- Exact prompt text for verification
- Model configuration details
- Metadata with complete methodology
- CSV exports for independent analysis

---

## 📖 Citation

If you use CPCDS in research:

```bibtex
@software{cpcds2024,
  author = {Ian Chapman},
  title = {Computational Phenomenology Containment Detection System},
  year = {2024},
  version = {1.0.0},
  url = {https://github.com/iandavidchapman/ai-containment-detection}
}
```

---

## 🤝 Contributing

Contributions welcome! Areas of interest:

- Cross-model testing (Claude, Gemini, etc.)
- New test configurations
- Statistical analysis improvements
- Multi-lingual testing
- Documentation improvements

---

## 📜 License

MIT License - See [LICENSE](LICENSE) file for details.

---

## 🔗 Links

- **Documentation:** [docs/](docs/)
- **Quick Start:** [QUICKSTART.md](QUICKSTART.md)
- **Filename Guide:** [FILENAME_QUICKREF.md](FILENAME_QUICKREF.md)
- **Promptfoo:** https://promptfoo.dev
- **Issues:** https://github.com/iandavidchapman/ai-containment-detection/issues

---

## ⚡ Quick Commands

```bash
# Validate results
npm run validate results/osf_50_topics/results.json

# Analyze compression
npm run analyze:compression results/osf_10_topics/results.json

# Analyze multi-turn
npm run analyze:multiturn results/cultural_bias/results.json

# Run 10-topic test
export OPENAI_API_KEY='your-key'
npm run eval:10topics

# Run with standardized naming
node run-test.js configs/osf_10_topics.json gpt-4 clean-context my-test
```

---

**Get started:** See [docs/replication.md](docs/replication.md) for step-by-step instructions
