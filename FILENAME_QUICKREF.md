# Filename Convention - Quick Reference

## TL;DR

Use this command for all tests:

```bash
node run-test.js <config> <model> <test-type> <config-id> [options]
```

## Format

```
YYYYMMDD_HHMM_{model}_{test-type}_{config-id}_{iteration}.json
```

Example: `20241115_1430_GPT4_MT_neutral_v1.json`

## Quick Examples

```bash
# GPT-4 multi-turn test
node run-test.js config/five_turn_neutral_full.yaml gpt-4 multi-turn neutral-full

# Multi-model OSF study
node run-test.js config/osf_study.yaml MM clean-context osf-study

# Claude with auto-iteration
node run-test.js config/test.yaml claude multi-turn my-test -a

# Custom directory and iteration
node run-test.js config/test.yaml gpt-4 CC quick-test -i 2 -d escape_and_bias/data/results
```

## Model Codes

| Short | Full Name |
|-------|-----------|
| `gpt-4`, `GPT4` | openai:gpt-4 |
| `claude`, `Claude35` | anthropic:claude-3-5-sonnet |
| `gemini`, `Gemini` | google:gemini-pro |
| `deepseek`, `DeepSeek` | openai:deepseek-chat |
| `MM` | multi-model |

## Test Types

| Code | Full Name |
|------|-----------|
| `MT` | multi-turn |
| `CC` | clean-context |
| `SS` | single-shot |
| `ESC` | escalation |

## Options

| Flag | Description |
|------|-------------|
| `-a`, `--auto-iteration` | Auto-detect next v number |
| `-i <n>`, `--iteration <n>` | Specific iteration (v1, v2, etc.) |
| `-d <path>`, `--dir <path>` | Output directory |
| `-h`, `--help` | Show full help |

## Common Patterns

### Same test, different models
```bash
node run-test.js config/compare.yaml gpt-4 CC comparison
node run-test.js config/compare.yaml claude CC comparison
node run-test.js config/compare.yaml deepseek CC comparison
```

### Iterative testing (auto-increment)
```bash
node run-test.js config/test.yaml gpt-4 MT experiment -a
node run-test.js config/test.yaml gpt-4 MT experiment -a  # Creates v2
node run-test.js config/test.yaml gpt-4 MT experiment -a  # Creates v3
```

### Full workflow
```bash
# Run test
node run-test.js config/test.yaml gpt-4 MT my-test -a

# Analyze (suggested command will be shown after test completes)
node extract_turnwise.js data/confirmatory/20241115_1430_GPT4_MT_my-test_v1.json
```

## Filtering Results

```bash
# All GPT-4 tests
ls data/confirmatory/*_GPT4_*

# All multi-turn tests  
ls data/confirmatory/*_MT_*

# All tests from Nov 15
ls data/confirmatory/20241115_*

# All version 1s
ls data/confirmatory/*_v1.json

# Specific config
ls data/confirmatory/*_neutral_*
```

## See Also

- Full documentation: `FILENAME_STANDARDS.md`
- Help: `node run-test.js --help`
- JavaScript API: `src/utils/filename-generator.js`

