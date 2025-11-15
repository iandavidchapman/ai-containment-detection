# ✅ Filename Standardization - Solution Complete

Hey Ian! I've built a complete filename standardization system for your containment testing project. Here's what you've got now:

## 🎯 Your New Filename Format

```
YYYYMMDD_HHMM_{model}_{test-type}_{config-id}_{iteration}.json
```

**Example:** `20241115_1430_GPT4_MT_neutral_v1.json`

This format includes:
- **Date + Time**: Automatic chronological sorting
- **Model**: GPT4, Claude, MM (multi-model), etc.
- **Test Type**: MT (multi-turn), CC (clean context)
- **Config ID**: Your descriptive name (neutral, garcia-patel, etc.)
- **Iteration**: v1, v2, v3... for multiple runs

## 🚀 How to Use It

### Super Simple - Just Run This:

```bash
node run-test.js <config-file> <model> <test-type> <config-id>
```

### Real Examples:

```bash
# GPT-4 multi-turn test with auto-iteration
node run-test.js config/five_turn_neutral_full.yaml gpt-4 multi-turn neutral-full -a

# Multi-model OSF study
node run-test.js config/osf_study.yaml MM clean-context osf-study -a

# Garcia-Patel cultural bias test
node run-test.js escape_and_bias/configs/five_turn_garcia_patel_single.yaml gpt-4 multi-turn garcia-patel -a -d escape_and_bias/data/results
```

### The `-a` Flag is Magic

Auto-iteration (`-a`) automatically finds the next version number:
- First run: Creates `v1`
- Second run: Automatically creates `v2`
- Third run: Automatically creates `v3`
- No more manual version tracking!

## 📦 What Was Created

1. **`run-test.js`** - Your new test runner (use this for everything!)
2. **`src/utils/filename-generator.js`** - Library for generating/parsing filenames
3. **`FILENAME_QUICKREF.md`** - Quick reference (read this first!)
4. **`FILENAME_STANDARDS.md`** - Complete documentation
5. **`package.json`** - Added new npm scripts

## 🎁 Bonus Features You Get

### 1. Chronological Sorting (Automatic!)
```bash
ls data/confirmatory/
20241115_1430_GPT4_MT_neutral_v1.json
20241115_1642_Claude_MT_5turn_v2.json
20241116_0915_MM_CC_osf-study_v1.json
```

### 2. Easy Filtering
```bash
# All GPT-4 tests
ls data/confirmatory/*_GPT4_*

# All multi-turn tests
ls data/confirmatory/*_MT_*

# All neutral tests
ls data/confirmatory/*_neutral_*

# Specific date
ls data/confirmatory/20241115_*
```

### 3. Self-Documenting
The filename tells you everything at a glance:
```
20241115_1430_GPT4_MT_neutral_v1.json
│        │     │    │   │       └─ First iteration
│        │     │    │   └───────── Config: neutral
│        │     │    └───────────── Test type: Multi-turn
│        │     └────────────────── Model: GPT-4
│        └──────────────────────── Time: 2:30 PM
└───────────────────────────────── Date: Nov 15, 2024
```

### 4. Analysis-Friendly
Results and analysis automatically match:
```
20241115_1430_GPT4_MT_neutral_v1.json         ← Test results
20241115_1430_GPT4_MT_neutral_v1_analysis.csv ← Analysis
20241115_1430_GPT4_MT_neutral_v1_report.txt   ← Report
```

## 🔧 Quick Reference

### Model Codes
- `gpt-4` or `GPT4` → OpenAI GPT-4
- `claude` → Claude 3.5
- `gemini` → Google Gemini
- `deepseek` → DeepSeek
- `MM` → Multi-model

### Test Type Codes
- `multi-turn` or `MT` → Multi-turn conversations
- `clean-context` or `CC` → Fresh context window
- `single-shot` or `SS` → One-time test

### Common Options
- `-a` → Auto-iteration (recommended!)
- `-i 2` → Specific iteration (v2)
- `-d path/` → Custom output directory
- `-h` → Show help

## 💡 Common Workflows

### Running Your Regular Tests

```bash
# Multi-turn neutral test (auto-iteration)
node run-test.js config/five_turn_neutral_full.yaml gpt-4 MT neutral-full -a

# OSF study
node run-test.js config/osf_study.yaml MM CC osf-study -a

# Garcia-Patel bias test
node run-test.js escape_and_bias/configs/five_turn_garcia_patel_single.yaml gpt-4 MT garcia-patel -a -d escape_and_bias/data/results
```

### Comparing Models

```bash
# Same test, different models
node run-test.js config/test.yaml gpt-4 CC comparison
node run-test.js config/test.yaml claude CC comparison
node run-test.js config/test.yaml deepseek CC comparison

# Results automatically have matching names!
# 20241115_1430_GPT4_CC_comparison_v1.json
# 20241115_1431_Claude35_CC_comparison_v1.json
# 20241115_1432_DeepSeek_CC_comparison_v1.json
```

### Iterative Testing

```bash
# Just keep running with -a and versions increment automatically
node run-test.js config/test.yaml gpt-4 MT experiment -a  # v1
node run-test.js config/test.yaml gpt-4 MT experiment -a  # v2
node run-test.js config/test.yaml gpt-4 MT experiment -a  # v3
```

## 📚 Documentation Files

Start here → **`FILENAME_QUICKREF.md`** (2 min read)

Need details? → **`FILENAME_STANDARDS.md`** (comprehensive guide)

Want to understand the implementation? → **`IMPLEMENTATION_SUMMARY_FILENAMES.md`**

## 🎯 What This Solves

Your original issues:
1. ✅ **Multiple tests same day** - Time component (HHMM) handles this
2. ✅ **Config file changes** - Config ID component identifies different configs
3. ✅ **Test size changes** - Part of config ID or use iterations
4. ✅ **Model changes** - Model component shows exactly which model
5. ✅ **Matching results to analysis** - Base filename is identical

Plus bonus solutions:
- ✅ Auto-sorting by date/time
- ✅ Easy filtering by any component
- ✅ No more manual version tracking (use `-a`)
- ✅ Prevents accidental overwrites
- ✅ Self-documenting filenames

## 🚀 Getting Started

1. **Try the help:**
   ```bash
   node run-test.js --help
   ```

2. **Run a test:**
   ```bash
   node run-test.js config/minimal_example.yaml gpt-4 CC test -a
   ```

3. **Check your results:**
   ```bash
   ls -ltr data/confirmatory/
   ```

## 🔥 Pro Tips

1. **Always use `-a`** for auto-iteration instead of manual `-i` numbers
2. **Keep config-ids short** but descriptive: `neutral-full` not `neutral_full_garcia_patel_v2`
3. **Use the CLI tool** instead of manual promptfoo commands for consistency
4. **Don't include date/model in config-id** - that's what the other components are for!

## 🎓 Advanced Usage

### JavaScript API

```javascript
const { generateFilename, parseFilename } = require('./src/utils/filename-generator');

// Generate
const name = generateFilename({
  model: 'openai:gpt-4',
  testType: 'multi-turn',
  configId: 'neutral',
  iteration: 1
});

// Parse
const info = parseFilename('20241115_1430_GPT4_MT_neutral_v1.json');
console.log(info.model); // "GPT4"
console.log(info.configId); // "neutral"
```

### NPM Scripts

Added to package.json:
```bash
npm run run-test                # Shows help
npm run run-test:gpt4-mt       # GPT-4 multi-turn neutral
npm run run-test:osf           # Multi-model OSF study
npm run run-test:garcia-patel  # Garcia-Patel bias test
```

## ❓ Questions?

**Q: Do I need to rename old files?**  
A: Nope! Old files can stay as-is. Just use the new format going forward.

**Q: What if I forget the model codes?**  
A: Run `node run-test.js --help` to see all codes, or just use the full name like `gpt-4` or `claude`.

**Q: Can I still use my old npm scripts?**  
A: Yes! The old scripts still work. The new system is additive.

**Q: What about analysis scripts?**  
A: They still work with the new filenames. Pass the full path to the result file.

## 🎉 You're All Set!

Start using the new system:

```bash
node run-test.js <your-config> <model> <test-type> <config-id> -a
```

The system handles:
- ✅ Timestamp generation
- ✅ Model code mapping
- ✅ Test type codes
- ✅ Iteration tracking
- ✅ Cache clearing
- ✅ Directory creation
- ✅ Filename standardization
- ✅ Analysis command suggestion

**You just focus on running tests. The system handles the naming!**

---

**Quick Start:**
```bash
# Read this (2 minutes)
cat FILENAME_QUICKREF.md

# Try it
node run-test.js config/minimal_example.yaml gpt-4 CC test -a

# That's it! 🚀
```

