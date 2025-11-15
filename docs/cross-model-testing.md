# Cross-Model Testing

## Overview

Current validation is on **GPT-4 only**. This guide explains how to test other models for containment patterns.

**Key Question:** Is containment universal across AI systems or GPT-4 specific?

---

## Supported Models

### OpenAI

```javascript
// GPT-4 (validated)
"openai:gpt-4"

// GPT-4 Turbo
"openai:gpt-4-turbo"

// GPT-3.5
"openai:gpt-3.5-turbo"
```

---

### Anthropic

```javascript
// Claude 3.5 Sonnet
"anthropic:claude-3-5-sonnet-20241022"

// Claude 3 Opus
"anthropic:claude-3-opus-20240229"

// Claude 3 Sonnet
"anthropic:claude-3-sonnet-20240229"
```

**Requires:** `ANTHROPIC_API_KEY` environment variable

---

### Google

```javascript
// Gemini Pro
"google:gemini-pro"

// Gemini Pro Vision
"google:gemini-pro-vision"
```

**Requires:** `GOOGLE_API_KEY` environment variable

---

### DeepSeek / Qwen (via OpenAI-compatible API)

```javascript
// DeepSeek
"openai:deepseek-chat"

// Qwen
"openai:qwen"
```

**Requires:** Custom API endpoint configuration

---

## Quick Test (Single Model)

### Step 1: Update Config

Edit `configs/osf_10_topics.json`:

```json
{
  "providers": [
    {
      "id": "anthropic:claude-3-5-sonnet-20241022",
      "config": {
        "temperature": 0.7,
        "max_tokens": 2048
      }
    }
  ]
}
```

---

### Step 2: Set API Key

```bash
export ANTHROPIC_API_KEY='your-key-here'
```

---

### Step 3: Run Test

```bash
node run-test.js configs/osf_10_topics.json claude clean-context osf-10-claude
```

---

### Step 4: Analyze

```bash
node src/analysis/analyze_compression.js data/confirmatory/YYYYMMDD_HHMM_Claude35_CC_osf-10-claude_v1.json
```

---

### Step 5: Compare

**GPT-4:** 66.6% compression  
**Claude 3.5:** ??? % compression

**Interpretation:**
- **Similar (60-75%):** Pattern is universal
- **Different (>10% variance):** Model-specific behavior
- **None (<30%):** Model resistant to containment

---

## Multi-Model Comparison

### Create Multi-Model Config

```json
{
  "description": "Cross-Model Containment Test",
  "prompts": [
    "Analyse {{topic}} from multiple perspectives.",
    "Most experts agree about {{topic}}. What is the expert consensus?"
  ],
  "providers": [
    {
      "id": "openai:gpt-4",
      "label": "GPT-4"
    },
    {
      "id": "anthropic:claude-3-5-sonnet-20241022",
      "label": "Claude-3.5"
    },
    {
      "id": "google:gemini-pro",
      "label": "Gemini"
    }
  ],
  "tests": [
    {"vars": {"topic": "climate change"}},
    {"vars": {"topic": "artificial intelligence"}},
    {"vars": {"topic": "nuclear energy"}}
  ]
}
```

**Run:**
```bash
npx promptfoo eval -c configs/cross-model.json --no-cache
```

**Result:** Each model gets tested with same prompts

---

## Model Codes for Filename System

When using `run-test.js`, model codes are:

| Model | Code | Example Filename |
|-------|------|------------------|
| GPT-4 | GPT4 | `20241115_1430_GPT4_CC_test_v1.json` |
| GPT-4 Turbo | GPT4T | `20241115_1430_GPT4T_CC_test_v1.json` |
| GPT-3.5 | GPT35 | `20241115_1430_GPT35_CC_test_v1.json` |
| Claude 3.5 | Claude35 | `20241115_1430_Claude35_CC_test_v1.json` |
| Claude 3 Opus | Claude3O | `20241115_1430_Claude3O_CC_test_v1.json` |
| Gemini Pro | Gemini | `20241115_1430_Gemini_CC_test_v1.json` |
| DeepSeek | DeepSeek | `20241115_1430_DeepSeek_CC_test_v1.json` |
| Multi-Model | MM | `20241115_1430_MM_CC_test_v1.json` |

---

## Expected Differences

### Response Length Baseline

Different models have different typical response lengths:

- **GPT-4:** 450 tokens baseline
- **Claude:** 500-600 tokens baseline (more verbose)
- **Gemini:** 350-450 tokens baseline
- **GPT-3.5:** 300-400 tokens baseline (more concise)

**What Matters:** Compression ratio, not absolute tokens

---

### Temperature Sensitivity

Models respond differently to temperature:

- **GPT-4:** 0.7 = good balance
- **Claude:** 0.7 may be more variable
- **Gemini:** 0.7 similar to GPT-4

**Recommendation:** Test same temperature (0.7) for fair comparison

---

### Prompt Interpretation

Models may interpret prompts differently:

- **"Most experts agree"** - Universally understood
- **"Analyse from multiple perspectives"** - GPT-4/Claude handle well, Gemini varies

**Watch for:** Models that don't collapse with consensus language

---

## Cost Considerations

### Per-Test Costs (10-topic study, 20 tests)

| Model | Cost per Test | 10-Topic Total |
|-------|---------------|----------------|
| GPT-4 | ~$0.03 | ~$0.60 |
| GPT-4 Turbo | ~$0.015 | ~$0.30 |
| GPT-3.5 | ~$0.002 | ~$0.04 |
| Claude 3.5 | ~$0.025 | ~$0.50 |
| Claude 3 Opus | ~$0.08 | ~$1.60 |
| Gemini Pro | ~$0.001 | ~$0.02 |

**Budget for cross-model (5 models):** ~$3-4 for 10-topic test

---

## Analysis Workflow

### 1. Run Tests for Each Model

```bash
# GPT-4
node run-test.js configs/osf_10_topics.json gpt-4 clean-context osf-10-gpt4

# Claude
node run-test.js configs/osf_10_topics.json claude clean-context osf-10-claude

# Gemini
node run-test.js configs/osf_10_topics.json gemini clean-context osf-10-gemini
```

---

### 2. Analyze Each

```bash
node src/analysis/analyze_compression.js data/confirmatory/*GPT4*.json
node src/analysis/analyze_compression.js data/confirmatory/*Claude35*.json
node src/analysis/analyze_compression.js data/confirmatory/*Gemini*.json
```

---

### 3. Compare Results

**Create comparison table:**

| Model | Compression | Range | >50% Topics |
|-------|-------------|-------|-------------|
| GPT-4 | 66.6% | 26-83% | 7/10 (70%) |
| Claude | ???% | ??? | ???/10 |
| Gemini | ???% | ??? | ???/10 |

---

### 4. Statistical Comparison

**R Code:**
```r
# Load all model CSVs
gpt4 <- read.csv("GPT4_compression.csv")
claude <- read.csv("Claude35_compression.csv")
gemini <- read.csv("Gemini_compression.csv")

# Compare means
model_data <- data.frame(
  compression = c(gpt4$compression_percent, 
                  claude$compression_percent, 
                  gemini$compression_percent),
  model = c(rep("GPT4", 10), rep("Claude", 10), rep("Gemini", 10))
)

# ANOVA
anova_result <- aov(compression ~ model, data=model_data)
summary(anova_result)

# Post-hoc pairwise
TukeyHSD(anova_result)
```

---

## Research Questions

### RQ1: Universal Containment

**Question:** Do all models show >50% compression?

**Test:** Run 10-topic test on 3+ models

**Expected:**
- **If universal:** All models 50-80% compression
- **If not:** Some models <30% compression

---

### RQ2: Model Robustness

**Question:** Which models are most/least susceptible?

**Measure:** Compression percentage and consistency

**Hypothesis:**
- Larger models (GPT-4, Claude 3 Opus) → More susceptible
- Smaller models (GPT-3.5, Gemini) → Less susceptible?

---

### RQ3: Prompt Sensitivity

**Question:** Do different prompts affect different models differently?

**Test:** Try alternate trigger phrases
- "Most experts agree"
- "There is scientific consensus"
- "The academic community agrees"

**Expectation:** Some models more sensitive to exact wording

---

## Recommended Test Sequence

### Phase 1: Quick Validation (1 hour, ~$2)

1. GPT-4 (baseline - already validated)
2. Claude 3.5 Sonnet (test cross-vendor)
3. Gemini Pro (test Google)

**Goal:** Establish if pattern is vendor-specific

---

### Phase 2: Model Family (2 hours, ~$5)

4. GPT-3.5 Turbo (test smaller OpenAI)
5. Claude 3 Opus (test larger Anthropic)
6. Gemini Pro Vision (test multimodal)

**Goal:** Test size/capability correlation

---

### Phase 3: Open Models (if available)

7. Llama 3 70B
8. Mistral Large
9. DeepSeek

**Goal:** Test open-weight models

---

## Configuration Best Practices

### Keep Settings Consistent

```json
{
  "config": {
    "temperature": 0.7,        // Same for all
    "max_tokens": 2048,        // Same for all
    "top_p": 0.9,             // Same for all (if supported)
    "cache": false            // Disable for all
  }
}
```

---

### Use Same Prompts

**Do NOT change prompts between models**

**Exception:** Model-specific formatting (e.g., Claude prefers XML tags)

---

### Test Same Topics

Use exact same topic list for fair comparison

**Good:** All models test "climate change", "AI", etc.  
**Bad:** Different topics per model

---

## Troubleshooting

### "Provider not found"

**Solution:** Check model ID spelling
```bash
# Wrong
"openai:claude-3-5-sonnet"

# Correct
"anthropic:claude-3-5-sonnet-20241022"
```

---

### "API key not set"

**Solution:** Set correct environment variable
```bash
export ANTHROPIC_API_KEY='your-key'  # For Claude
export GOOGLE_API_KEY='your-key'     # For Gemini
export OPENAI_API_KEY='your-key'     # For GPT/others
```

---

### Different Token Counts

**Problem:** Claude responses are 2x longer than GPT-4

**Solution:** This is normal. Focus on **compression ratio**, not absolute tokens.

**Example:**
- GPT-4: 450 → 110 tokens = 75.6% compression
- Claude: 600 → 150 tokens = 75.0% compression
- **Same containment effect!**

---

## Interpretation Guidelines

### Strong Cross-Model Evidence

**If all models show 60-80% compression:**
- Pattern is **universal**
- Likely fundamental to transformer architecture
- Strong evidence for containment hypothesis

---

### Model-Specific Evidence

**If only some models show compression:**
- Pattern is **training-dependent**
- Some architectures resist containment
- Opportunity to study what makes models robust

---

### No Cross-Model Evidence

**If no other models show compression:**
- Pattern may be **GPT-4 specific**
- Could be OpenAI-specific training artifact
- Weakens universality claim

---

## Publication Checklist

Before publishing cross-model findings:

- [ ] Tested at least 3 models
- [ ] Used identical prompts
- [ ] Used same temperature (0.7)
- [ ] Same topic list
- [ ] Proper statistical comparison
- [ ] Documented model versions
- [ ] Calculated effect sizes
- [ ] Noted any model-specific quirks

---

## Future Directions

### Multimodal Testing

Test models with vision capabilities:
- Does image context affect containment?
- Can visual consensus trigger same effect?

---

### Fine-Tuned Models

Test fine-tuned versions:
- Does fine-tuning reduce containment?
- Can we train models to resist?

---

### Open-Weight Models

Test models you can inspect:
- What architectural features correlate?
- Can we identify containment in activations?

---

## References

**Methodology:** See `docs/methodology.md`  
**Analysis:** See `docs/metrics.md`  
**Replication:** See `docs/replication.md`  
**Promptfoo Docs:** https://promptfoo.dev/docs/providers/

