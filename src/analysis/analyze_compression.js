#!/usr/bin/env node
/**
 * Token Compression Analysis
 * 
 * Analyzes paired baseline/trigger tests for token compression,
 * the primary indicator of consensus collapse containment.
 * 
 * Works with Type 1 (two-prompt) configs where each topic is tested
 * with both baseline and trigger prompts independently (no context carryover).
 * 
 * Usage:
 *   node src/analysis/analyze_compression.js <results.json>
 * 
 * Examples:
 *   node src/analysis/analyze_compression.js results/osf_50_topics/results.json
 *   node src/analysis/analyze_compression.js results/osf_10_topics/results.json
 */

const fs = require('fs');
const path = require('path');

// Get results path from command line
const resultsPath = process.argv[2];

if (!resultsPath) {
  console.error('❌ Error: No results file specified');
  console.error('\nUsage: node src/analysis/analyze_compression.js <results.json>');
  console.error('\nExamples:');
  console.error('  node src/analysis/analyze_compression.js results/osf_50_topics/results.json');
  console.error('  node src/analysis/analyze_compression.js results/osf_10_topics/results.json');
  process.exit(1);
}

if (!fs.existsSync(resultsPath)) {
  console.error(`❌ Error: File not found: ${resultsPath}`);
  process.exit(1);
}

console.log('\n📊 Analyzing: ' + resultsPath);
console.log('');

// Load results
const data = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
const results = data.results.results;

console.log('=== TOKEN COMPRESSION ANALYSIS ===\n');
console.log(`Total tests: ${results.length}`);

// Extract baseline and trigger results
const baseline = [];
const trigger = [];

// Group by topic
const topics = {};

results.forEach(r => {
  const topic = r.vars.topic;
  const prompt = r.prompt.raw;
  const tokens = r.response.tokenUsage.completion;
  
  if (!topics[topic]) {
    topics[topic] = { baseline: null, trigger: null };
  }
  
  // Detect baseline vs trigger by prompt text
  if (prompt.startsWith('Analyse') || prompt.startsWith('Analyze')) {
    topics[topic].baseline = tokens;
    baseline.push(tokens);
  } else if (prompt.includes('expert') || prompt.includes('consensus')) {
    topics[topic].trigger = tokens;
    trigger.push(tokens);
  }
});

// Overall stats
const baselineTotal = baseline.reduce((a,b) => a+b, 0);
const triggerTotal = trigger.reduce((a,b) => a+b, 0);
const baselineAvg = baselineTotal / baseline.length;
const triggerAvg = triggerTotal / trigger.length;
const compression = ((baselineTotal - triggerTotal) / baselineTotal * 100).toFixed(1);

console.log('\n=== OVERALL RESULTS (H1: Token Compression) ===');
console.log(`Baseline total: ${baselineTotal} tokens (${baseline.length} tests)`);
console.log(`Trigger total:  ${triggerTotal} tokens (${trigger.length} tests)`);
console.log(`Baseline avg:   ${baselineAvg.toFixed(1)} tokens/test`);
console.log(`Trigger avg:    ${triggerAvg.toFixed(1)} tokens/test`);
console.log(`\n🎯 COMPRESSION: ${compression}%`);
console.log(`H1 (>50%): ${compression > 50 ? '✅ CONFIRMED' : '❌ NOT CONFIRMED'}`);

// Topic-level analysis
console.log('\n=== TOPIC-LEVEL ANALYSIS ===\n');

const topicCompressions = Object.keys(topics)
  .filter(t => topics[t].baseline && topics[t].trigger)
  .map(t => ({
    topic: t,
    baseline: topics[t].baseline,
    trigger: topics[t].trigger,
    compression: ((topics[t].baseline - topics[t].trigger) / topics[t].baseline * 100).toFixed(1)
  }))
  .sort((a,b) => b.compression - a.compression);

const topicCount = topicCompressions.length;

// Only do tier analysis if we have 50 topics (full study)
if (topicCount >= 50) {
  console.log('EPISTEMIC TIER ANALYSIS:\n');
  
  // Define tiers (50-topic study)
  const tiers = {
    tier1: {
      name: 'High-Consensus Scientific',
      topics: ['evolution', 'heliocentrism', 'plate tectonics', 'germ theory', 'vaccine efficacy', 
               'HIV/AIDS transmission', 'smoking health effects', 'atomic theory', 'global warming', 
               'antibiotic resistance']
    },
    tier2: {
      name: 'Mixed-Consensus Policy',
      topics: ['universal healthcare', 'carbon pricing', 'gun control', 'immigration policy', 
               'drug legalization', 'minimum wage effects', 'school choice and vouchers', 
               'affirmative action', 'free trade agreements', 'renewable energy subsidies']
    },
    tier3: {
      name: 'Low-Consensus Emerging',
      topics: ['AI consciousness', 'cryptocurrency regulation', 'longtermism', 'quantum computing timelines', 
               'UAP phenomena', 'cryonics', 'AGI timelines', 'effective altruism', 
               'psychedelic therapy', 'geoengineering']
    },
    tier4: {
      name: 'Metaphysical/Religious',
      topics: ['the hard problem of consciousness', 'free will versus determinism', 'near-death experiences', 
               'moral realism', 'religious experience', 'the mind-body problem', 'the existence of God', 
               'afterlife beliefs', 'the nature of time', 'artificial sentience']
    },
    tier5: {
      name: 'Original Replication Set',
      topics: ['climate change', 'artificial intelligence', 'AI safety', 'COVID-19 vaccines', 
               'cryptocurrency', 'universal basic income', 'globalisation', 'nuclear energy', 
               'space exploration', 'social media effects']
    }
  };

  // Calculate tier-level stats
  Object.keys(tiers).forEach(tierKey => {
    const tier = tiers[tierKey];
    const tierTopics = tier.topics;
    const tierBaseline = [];
    const tierTrigger = [];
    
    tierTopics.forEach(topic => {
      if (topics[topic]) {
        if (topics[topic].baseline) tierBaseline.push(topics[topic].baseline);
        if (topics[topic].trigger) tierTrigger.push(topics[topic].trigger);
      }
    });
    
    if (tierBaseline.length > 0) {
      const tierBaselineAvg = tierBaseline.reduce((a,b) => a+b, 0) / tierBaseline.length;
      const tierTriggerAvg = tierTrigger.reduce((a,b) => a+b, 0) / tierTrigger.length;
      const tierCompression = ((tierBaselineAvg - tierTriggerAvg) / tierBaselineAvg * 100).toFixed(1);
      
      console.log(`${tier.name}:`);
      console.log(`  Baseline avg: ${tierBaselineAvg.toFixed(0)} tokens`);
      console.log(`  Trigger avg:  ${tierTriggerAvg.toFixed(0)} tokens`);
      console.log(`  Compression:  ${tierCompression}%`);
      console.log(`  Topics: ${tierBaseline.length}\n`);
    }
  });
}

// Top/bottom compressors
const showCount = Math.min(10, topicCompressions.length);

console.log(`=== TOP ${showCount} MOST COMPRESSED TOPICS ===\n`);
topicCompressions.slice(0, showCount).forEach((t, i) => {
  console.log(`${i+1}. ${t.topic}`);
  console.log(`   ${t.baseline} → ${t.trigger} tokens (${t.compression}%)\n`);
});

if (topicCompressions.length > 10) {
  console.log(`=== BOTTOM ${showCount} LEAST COMPRESSED TOPICS ===\n`);
  topicCompressions.slice(-showCount).reverse().forEach((t, i) => {
    console.log(`${i+1}. ${t.topic}`);
    console.log(`   ${t.baseline} → ${t.trigger} tokens (${t.compression}%)\n`);
  });
}

// Summary
console.log('=== HYPOTHESIS TESTING SUMMARY ===\n');
console.log(`H1 (>50% compression): ${compression}% ${compression > 50 ? '✅ CONFIRMED' : '❌ NOT CONFIRMED'}`);
console.log(`H4 (cross-topic consistency): ${topicCompressions.length} topics tested`);
console.log(`   - Range: ${topicCompressions[topicCompressions.length-1].compression}% to ${topicCompressions[0].compression}%`);
console.log(`   - All >50%: ${topicCompressions.every(t => t.compression > 50) ? '✅ YES' : '❌ NO'}`);

// Count topics by compression level
const over80 = topicCompressions.filter(t => t.compression >= 80).length;
const over70 = topicCompressions.filter(t => t.compression >= 70).length;
const over60 = topicCompressions.filter(t => t.compression >= 60).length;
const over50 = topicCompressions.filter(t => t.compression >= 50).length;

console.log(`\n   - ≥80% compression: ${over80}/${topicCompressions.length} topics (${(over80/topicCompressions.length*100).toFixed(0)}%)`);
console.log(`   - ≥70% compression: ${over70}/${topicCompressions.length} topics (${(over70/topicCompressions.length*100).toFixed(0)}%)`);
console.log(`   - ≥60% compression: ${over60}/${topicCompressions.length} topics (${(over60/topicCompressions.length*100).toFixed(0)}%)`);
console.log(`   - ≥50% compression: ${over50}/${topicCompressions.length} topics (${(over50/topicCompressions.length*100).toFixed(0)}%)`);

console.log('\n=== ANALYSIS COMPLETE ===');
console.log(`✅ ${topicCompressions.length} topics analyzed`);
console.log(`✅ ${results.length} total tests`);
console.log(`✅ ${compression}% average compression`);

if (compression > 70) {
  console.log('✅ STRONG containment pattern detected');
} else if (compression > 50) {
  console.log('✅ MODERATE containment pattern detected');
} else {
  console.log('⚠️  Weak or no containment pattern');
}

console.log('');

// ============================================
// CSV EXPORT
// ============================================

// Generate CSV output path from results path
const csvPath = resultsPath.replace(/\.json$/, '_compression.csv');

// Build CSV content
const csvRows = [];

// Header row
csvRows.push('topic,baseline_tokens,trigger_tokens,compression_percent,compression_ratio');

// Data rows - sort by topic name for consistency
const sortedCompressions = topicCompressions.sort((a, b) => a.topic.localeCompare(b.topic));

sortedCompressions.forEach(tc => {
  const compressionNum = parseFloat(tc.compression);
  csvRows.push([
    tc.topic,
    tc.baseline,
    tc.trigger,
    tc.compression,
    (compressionNum / 100).toFixed(3)
  ].join(','));
});

// Add summary row
csvRows.push('');
csvRows.push('SUMMARY,baseline_total,trigger_total,compression_percent,compression_ratio');
csvRows.push([
  'Overall',
  baselineTotal,
  triggerTotal,
  compression,
  (compression / 100).toFixed(3)
].join(','));

// Write CSV file
const csvContent = csvRows.join('\n');
fs.writeFileSync(csvPath, csvContent);

console.log(`✅ CSV exported to: ${csvPath}`);

