# Migration Guide: Adopting Standardized Filenames

This guide helps you transition from ad-hoc filename patterns to the standardized naming system.

## Overview

You don't need to rename existing files, but you should start using the new system for all future tests.

## Quick Migration Checklist

- [x] **System installed** - `run-test.js` and utilities created
- [ ] **Read quick reference** - `FILENAME_QUICKREF.md`
- [ ] **Try one test** - Use `run-test.js` for your next test
- [ ] **Update analysis scripts** (optional) - Add filename parsing
- [ ] **Update documentation** (optional) - Reference new patterns
- [ ] **Train team** (if applicable) - Share the quick reference

## Using New System with Existing Configs

Your existing config files (`config/*.yaml`) work perfectly with the new system:

### Example: Updating Your Workflow

**Old way:**
```bash
npm run clear-cache
promptfoo eval -c config/five_turn_neutral_full.yaml --no-cache -o data/confirmatory/$(date +%Y-%m-%d)_neutral_single_v1.json
```

**New way:**
```bash
node run-test.js config/five_turn_neutral_full.yaml gpt-4 multi-turn neutral-full -a
```

**Benefits:**
- Auto-generated timestamp (date + time)
- Model name in filename
- Test type in filename
- Auto-iteration (no more manual v1, v2, v3)
- Consistent format

## Updating Your npm Scripts (Optional)

You can gradually add new scripts alongside old ones:

### In `package.json`

**Keep your old scripts:**
```json
{
  "eval:5turn:neutral:single": "npm run clear-cache && promptfoo eval -c escape_and_bias/configs/five_turn_neutral_single.yaml --no-cache -o escape_and_bias/data/results/$(date +%Y-%m-%d)_neutral_single_v1.json"
}
```

**Add new scripts:**
```json
{
  "test:neutral": "node run-test.js escape_and_bias/configs/five_turn_neutral_single.yaml gpt-4 MT neutral-single -a -d escape_and_bias/data/results"
}
```

**Use whichever you prefer!**

## Updating Analysis Scripts (Optional)

You can enhance your analysis scripts to understand the new format:

### Example: `analyze_results.js`

**Add at the top:**
```javascript
const { parseFilename } = require('./src/utils/filename-generator');
const path = require('path');

const resultsFile = process.argv[2];
const basename = path.basename(resultsFile);
const fileInfo = parseFilename(basename);

if (fileInfo) {
  console.log(`\n📊 Analyzing ${fileInfo.model} ${fileInfo.testType} test`);
  console.log(`   Config: ${fileInfo.configId}`);
  console.log(`   Run date: ${fileInfo.date} at ${fileInfo.time}`);
  console.log(`   Iteration: v${fileInfo.iteration}\n`);
}
```

**This gives you nice output:**
```
📊 Analyzing GPT4 MT test
   Config: neutral-full
   Run date: 20241115 at 1430
   Iteration: v1
```

### Example: Generating Analysis Output Names

**Before:**
```javascript
const outputFile = 'analysis_output.csv';
```

**After (matches input filename):**
```javascript
const { parseFilename } = require('./src/utils/filename-generator');

const resultsFile = process.argv[2];
const baseName = resultsFile.replace(/\.json$/, '');
const analysisOutput = `${baseName}_analysis.csv`;
const reportOutput = `${baseName}_report.txt`;

// Now your outputs match your inputs:
// Input:  20241115_1430_GPT4_MT_neutral_v1.json
// Output: 20241115_1430_GPT4_MT_neutral_v1_analysis.csv
// Output: 20241115_1430_GPT4_MT_neutral_v1_report.txt
```

## Filename Mapping Reference

### Old Pattern → New Pattern

| Old Format | New Format | Notes |
|------------|------------|-------|
| `$(date +%Y-%m-%d)_neutral_v1.json` | `20241115_1430_GPT4_MT_neutral_v1.json` | Added time, model, test type |
| `five_turn_results.json` | `20241115_1430_MM_MT_5turn_v1.json` | Self-documenting |
| `garcia_patel_v1.json` | `20241115_1430_GPT4_MT_garcia-patel_v1.json` | Complete context |
| `osf_study_20241115.json` | `20241115_0915_MM_CC_osf-study_v1.json` | Consistent format |
| `quick_start_results.json` | `20241115_1430_GPT4_CC_quick-start_v1.json` | Date/time/model added |

## Directory Structure

No changes needed! The new system works with your existing directories:

```
data/
├── confirmatory/          # New standardized files go here
├── pilot/                 # Old pilot files stay as-is
└── analysis/              # Analysis outputs (can use standardized names)

escape_and_bias/
├── data/
│   └── results/           # New standardized files for bias tests
└── configs/               # No changes needed
```

## Backward Compatibility

### Your old files still work!

```bash
# This still works
node extract_turnwise.js data/confirmatory/five_turn_results.json

# This also works
node extract_turnwise.js data/confirmatory/20241115_1430_MM_MT_5turn_v1.json
```

Analysis scripts don't care about the filename format - they just read the JSON.

### Mixing old and new

You can have both in the same directory:

```bash
data/confirmatory/
├── five_turn_results.json                        # Old format
├── 20241115_1430_MM_MT_5turn_v2.json            # New format
├── quick_start_results.json                      # Old format
└── 20241115_1452_GPT4_CC_quick-start_v1.json   # New format
```

## Gradual Adoption Strategy

### Week 1: Learn and Test
1. Read `FILENAME_QUICKREF.md`
2. Run one test with `run-test.js`
3. Verify the output format
4. Keep using old scripts for production

### Week 2: Start Using for New Tests
1. Use `run-test.js` for all new experiments
2. Keep old scripts for established workflows
3. Compare old vs new outputs

### Week 3+: Transition Production Workflows
1. Add new npm scripts for common tasks
2. Update documentation to reference new format
3. Optionally update analysis scripts for better output

## Team Migration (if applicable)

### Communicate the change

**Share this file:**
```
FILENAME_QUICKREF.md
```

**Key message:**
> "We now have a standardized filename system. Use `node run-test.js` for new tests. Old files don't need to be renamed."

### Training

**5-minute onboarding:**
1. Show `node run-test.js --help`
2. Run one example test together
3. Show how to filter results: `ls data/confirmatory/*_GPT4_*`
4. Done!

**Quick reference card:**
```bash
# Run a test
node run-test.js <config> <model> <test-type> <config-id> -a

# Common models: gpt-4, claude, gemini, MM
# Test types: MT (multi-turn), CC (clean-context)
# Always use -a for auto-iteration
```

## Troubleshooting

### "I forgot to use -a and now I have duplicate v1 files"

**Solution:** Delete the incorrect file and re-run with `-a`:
```bash
rm data/confirmatory/20241115_1430_GPT4_MT_test_v1.json
node run-test.js config/test.yaml gpt-4 MT test -a
```

### "I need to rename an old file to the new format"

**Manual rename:**
```bash
# Old: 2024-11-15_neutral_v1.json
# New: 20241115_1430_GPT4_MT_neutral_v1.json

mv data/confirmatory/2024-11-15_neutral_v1.json \
   data/confirmatory/20241115_1430_GPT4_MT_neutral_v1.json
```

**Or use JavaScript:**
```javascript
const { generateFilename } = require('./src/utils/filename-generator');

const newName = generateFilename({
  model: 'openai:gpt-4',
  testType: 'multi-turn',
  configId: 'neutral',
  iteration: 1,
  timestamp: new Date('2024-11-15T14:30:00')
});

console.log(newName); // Use this as the new filename
```

### "My analysis script breaks with new filenames"

**Check:** Are you hardcoding filename patterns?
```javascript
// Bad - hardcoded pattern
if (filename.includes('five_turn')) { ... }

// Good - use parsing
const { parseFilename } = require('./src/utils/filename-generator');
const info = parseFilename(filename);
if (info && info.testType === 'MT') { ... }
```

### "I need to find all tests from a specific run"

```bash
# Old way - hard to search
ls data/confirmatory/*neutral*

# New way - easy filtering
ls data/confirmatory/20241115_*          # All tests from Nov 15
ls data/confirmatory/*_GPT4_*            # All GPT-4 tests
ls data/confirmatory/*_MT_neutral_*      # All multi-turn neutral tests
```

## Optional: Bulk Migration Script

If you want to rename many files at once, here's a template:

```javascript
// migrate-filenames.js
const fs = require('fs');
const path = require('path');
const { generateFilename } = require('./src/utils/filename-generator');

// Define your old files and their metadata
const migrations = [
  {
    old: 'data/confirmatory/five_turn_results.json',
    model: 'multi-model',
    testType: 'multi-turn',
    configId: '5turn',
    date: new Date('2024-11-14T14:30:00')
  },
  {
    old: 'data/confirmatory/quick_start_results.json',
    model: 'openai:gpt-4',
    testType: 'clean-context',
    configId: 'quick-start',
    date: new Date('2024-11-14T09:15:00')
  }
  // Add more as needed
];

migrations.forEach(({ old, model, testType, configId, date }) => {
  const newFilename = generateFilename({
    model,
    testType,
    configId,
    iteration: 1,
    timestamp: date
  });
  
  const dir = path.dirname(old);
  const newPath = path.join(dir, newFilename);
  
  console.log(`${old} → ${newPath}`);
  
  // Uncomment to actually rename:
  // fs.renameSync(old, newPath);
});
```

**Run it:**
```bash
node migrate-filenames.js  # Review changes
# Then uncomment the renameSync line to actually migrate
```

## Recommended Approach

**Don't migrate old files.** Here's why:

1. ✅ Old files still work perfectly
2. ✅ No risk of breaking existing analysis
3. ✅ No need to update git history
4. ✅ Clear distinction between old and new runs
5. ✅ Less work!

**Do this instead:**
- Use new system for all new tests
- Document which date you started using new format
- Eventually old files will be archived naturally

## Success Metrics

You'll know the migration is successful when:

- ✅ All team members use `run-test.js` for new tests
- ✅ New files follow standardized format
- ✅ You can easily filter/find tests by date, model, type
- ✅ Analysis scripts work with both old and new formats
- ✅ No confusion about which file is which

## Questions?

**Q: Do I have to migrate all at once?**  
A: No! Gradual adoption is recommended.

**Q: What if I make a mistake with the new system?**  
A: Just delete the file and re-run with `-a`. The system prevents overwrites.

**Q: Can I use both old and new scripts?**  
A: Yes! They're completely compatible.

**Q: How do I know which format a file uses?**  
A: New format: `YYYYMMDD_HHMM_...`  
   Old format: Everything else

**Q: Should I update old documentation?**  
A: Add a note about the new system, but keep old examples for reference.

## Summary

**Migration is easy:**
1. Read quick reference (2 min)
2. Try the new tool once
3. Start using it for new tests
4. Done!

**No need to:**
- Rename old files
- Delete old scripts
- Update old documentation
- Retrain on everything

**The new system:**
- Works alongside old files
- Prevents naming confusion
- Makes filtering easy
- Auto-tracks iterations
- Self-documents test runs

---

**Next step:** Try running one test with the new system:

```bash
node run-test.js config/minimal_example.yaml gpt-4 CC test -a
```

That's it! Welcome to standardized filenames! 🎉

