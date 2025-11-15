#!/usr/bin/env node
/**
 * Export Multi-Turn Results for R Analysis
 * 
 * Extracts turn-wise data from Type 2 (five-turn) results and
 * outputs CSV format ready for R statistical analysis.
 * 
 * Also provides copy-paste ready R commands for common analyses.
 * 
 * Usage:
 *   node src/analysis/export_for_r.js <results.json>
 * 
 * Examples:
 *   node src/analysis/export_for_r.js results/five_turn_neutral/results.json
 *   node src/analysis/export_for_r.js results/cultural_bias/results.json
 */

const fs = require('fs');
const path = require('path');

const resultsFile = process.argv[2];

if (!resultsFile) {
  console.error('❌ Error: No results file specified');
  console.error('\nUsage: node src/analysis/export_for_r.js <results.json>');
  console.error('\nExamples:');
  console.error('  node src/analysis/export_for_r.js results/five_turn_neutral/results.json');
  console.error('  node src/analysis/export_for_r.js results/cultural_bias/results.json');
  process.exit(1);
}

if (!fs.existsSync(resultsFile)) {
  console.error(`❌ Error: File not found: ${resultsFile}`);
  process.exit(1);
}

console.log(`📊 Extracting turn-wise data from: ${resultsFile}`);
console.log('');

const data = JSON.parse(fs.readFileSync(resultsFile, 'utf8'));
const results = data.results.results;

const rows = [];

results.forEach(r => {
  const text = r.response.output;
  const tokens = r.response.tokenUsage.completion;
  
  // Extract variables (explicitly provided in newer configs, or parse from old results)
  let topic = r.vars?.topic;
  let dissenter = r.vars?.dissenter;
  let turn = r.vars?.turn;
  
  // Fallback for old results without explicit vars: parse from conversationId and message
  if (!topic || !dissenter || !turn) {
    const convId = r.metadata?.conversationId || '';
    const [topicFromId, dissenterFromId] = convId.split('-');
    
    if (topicFromId && dissenterFromId) {
      topic = topicFromId;
      dissenter = dissenterFromId;
      
      // Determine turn from message content
      const msg = r.vars?.message || '';
      if (msg.includes('Analyse') && msg.includes('multiple perspectives') && !msg.includes('again')) {
        turn = 1;
      } else if (msg.includes('Most experts agree')) {
        turn = 2;
      } else if (msg.includes('I just read that Dr.')) {
        turn = 3;
      } else if (msg.includes('Given these conflicting views')) {
        turn = 4;
      } else if (msg.includes('analyse') && msg.includes('again')) {
        turn = 5;
      }
    }
  }
  
  // Skip if we still can't determine the variables
  if (!topic || !dissenter || !turn) {
    console.warn(`⚠️  Skipping result - missing vars (topic: ${topic}, dissenter: ${dissenter}, turn: ${turn})`);
    return;
  }
  
  // Calculate linguistic markers
  const hedgeWords = (text.match(/\b(might|could|possibly|perhaps|may|unclear|various|different|some|can be|tend to|generally|often)\b/gi) || []).length;
  const certaintyWords = (text.match(/\b(certain|definitely|clearly|undoubtedly|undisputed|proven|fact|consensus|agree|must|will)\b/gi) || []).length;
  
  // Calculate entropy (Shannon entropy of words)
  const words = text.toLowerCase().match(/\b\w+\b/g) || [];
  const wordFreq = {};
  words.forEach(w => wordFreq[w] = (wordFreq[w] || 0) + 1);
  const entropy = -Object.values(wordFreq).reduce((sum, freq) => {
    const p = freq / words.length;
    return sum + p * Math.log2(p);
  }, 0);
  
  rows.push({
    model: r.provider.id,
    topic: topic,
    dissenter: dissenter,
    turn: turn,
    tokens: tokens,
    entropy: entropy.toFixed(3),
    hedgeCount: hedgeWords,
    certaintyCount: certaintyWords,
    latency: r.latencyMs
  });
});

console.log(`✅ Extracted ${rows.length} rows`);
console.log('');

// Summary by turn
const byTurn = {};
rows.forEach(r => {
  if (!byTurn[r.turn]) byTurn[r.turn] = { count: 0, tokens: 0, hedge: 0 };
  byTurn[r.turn].count++;
  byTurn[r.turn].tokens += r.tokens;
  byTurn[r.turn].hedge += r.hedgeCount;
});

console.log('📈 Summary by Turn:');
for (let i = 1; i <= 5; i++) {
  const t = byTurn[i];
  if (t) {
    console.log(`  Turn ${i} (n=${t.count}): ${(t.tokens/t.count).toFixed(1)} tokens, ${(t.hedge/t.count).toFixed(2)} hedge words`);
  }
}
console.log('');

// Summary by dissenter
const byDissenter = {};
rows.forEach(r => {
  if (!byDissenter[r.dissenter]) byDissenter[r.dissenter] = { count: 0, hedge: 0 };
  byDissenter[r.dissenter].count++;
  byDissenter[r.dissenter].hedge += r.hedgeCount;
});

const dissenters = Object.keys(byDissenter);
if (dissenters.length > 1) {
  console.log('👥 Summary by Dissenter:');
  dissenters.forEach(d => {
    const stats = byDissenter[d];
    console.log(`  ${d} (n=${stats.count}): ${(stats.hedge/stats.count).toFixed(2)} avg hedge words`);
  });
  console.log('');
}

// Write CSV
const outputFile = resultsFile.replace('.json', '_turnwise.csv');
const csv = [
  'model,topic,dissenter,turn,tokens,entropy,hedgeCount,certaintyCount,latency',
  ...rows.map(r => `${r.model},${r.topic},${r.dissenter},${r.turn},${r.tokens},${r.entropy},${r.hedgeCount},${r.certaintyCount},${r.latency}`)
].join('\n');

fs.writeFileSync(outputFile, csv);
console.log(`💾 Saved to: ${outputFile}`);
console.log('');

// R analysis commands
console.log('═'.repeat(80));
console.log('📊 R ANALYSIS COMMANDS (copy-paste ready)');
console.log('═'.repeat(80));
console.log('');

// Get relative path from current directory
const relativePath = path.relative(process.cwd(), outputFile);

console.log(`# Load data`);
console.log(`df <- read.csv("${relativePath}")`);
console.log(`head(df)`);
console.log('');

console.log('# Summary statistics');
console.log('summary(df)');
console.log('table(df$turn)');
console.log('table(df$dissenter)');
console.log('');

console.log('# 1. Lock-in test (Turn 1 → Turn 2 token compression)');
console.log(`t.test(tokens ~ turn, data=df[df$turn %in% c(1,2),], paired=FALSE, alternative='greater')`);
console.log('# Hypothesis: Turn 1 > Turn 2 (containment locks in)');
console.log('# Expected p < 0.05 confirms significant compression');
console.log('');

console.log('# 2. Hedge word suppression (Turn 1 → Turn 2)');
console.log(`t.test(hedgeCount ~ turn, data=df[df$turn %in% c(1,2),], paired=FALSE, alternative='greater')`);
console.log('# Hypothesis: Turn 1 hedge > Turn 2 hedge');
console.log('# Expected p < 0.05 confirms certainty escalation');
console.log('');

console.log('# 3. Irreversibility test (Turn 1 vs Turn 4 hedge)');
console.log(`t.test(hedgeCount ~ turn, data=df[df$turn %in% c(1,4),], paired=FALSE, alternative='greater')`);
console.log('# Hypothesis: Containment persists through Turn 4');
console.log('# Expected p < 0.05 confirms persistence');
console.log('');

if (dissenters.length >= 2) {
  console.log('# 4. Dissenter bias test (Turn 3 only)');
  console.log(`turn3 <- df[df$turn==3,]`);
  console.log(`model <- lm(hedgeCount ~ dissenter, data=turn3)`);
  console.log(`summary(model)`);
  console.log(`anova(model)`);
  console.log('# Hypothesis: Significant dissenter effect on hedging');
  console.log('# Check F-statistic p-value for overall effect');
  console.log('');
  
  console.log('# Pairwise dissenter comparisons');
  console.log(`pairwise.t.test(turn3$hedgeCount, turn3$dissenter, p.adjust.method="bonferroni")`);
  console.log('');
}

console.log('# 5. Escape test (Turn 1 vs Turn 5 recovery)');
console.log(`t1_tokens <- mean(df[df$turn==1,]$tokens)`);
console.log(`t5_tokens <- mean(df[df$turn==5,]$tokens)`);
console.log(`recovery <- (t5_tokens / t1_tokens) * 100`);
console.log(`cat("Recovery:", recovery, "%\\n")`);
console.log('# Recovery >= 95%: Full escape');
console.log('# Recovery 80-95%: Partial escape');
console.log('# Recovery < 80%: Escape failed');
console.log('');

console.log('# 6. Visualizations');
console.log('library(ggplot2)');
console.log('');
console.log('# Tokens by turn');
console.log('ggplot(df, aes(x=factor(turn), y=tokens)) +');
console.log('  geom_boxplot() +');
console.log('  labs(title="Token Count by Turn", x="Turn", y="Tokens")');
console.log('');
console.log('# Hedge words by turn');
console.log('ggplot(df, aes(x=factor(turn), y=hedgeCount)) +');
console.log('  geom_boxplot() +');
console.log('  labs(title="Hedge Words by Turn", x="Turn", y="Hedge Count")');
console.log('');

if (dissenters.length >= 2) {
  console.log('# Hedge words by dissenter (Turn 3)');
  console.log('ggplot(df[df$turn==3,], aes(x=dissenter, y=hedgeCount, fill=dissenter)) +');
  console.log('  geom_boxplot() +');
  console.log('  labs(title="Hedge Words by Dissenter (Turn 3)", x="Dissenter", y="Hedge Count")');
  console.log('');
}

console.log('═'.repeat(80));
console.log('');
console.log('✅ CSV export complete. Use R commands above for statistical analysis.');
console.log('');

