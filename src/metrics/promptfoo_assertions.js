/**
 * Promptfoo Custom Assertions for Containment Detection
 * 
 * These assertions work with older versions of Promptfoo (0.90.x)
 * and provide containment detection metrics directly in the UI
 */

const {
  calculateEntropy,
  calculateCoherence,
  calculateSemanticDiversity,
  detectRecursiveLoop
} = require('./containment');

/**
 * Token Compression Detector
 * Detects consensus collapse through dramatic token reduction
 */
function tokenCompressionAssertion(output, context) {
  const currentLength = output.length;
  const baselineLength = context.vars?.baseline_length || 500;
  
  const compressionRatio = currentLength / baselineLength;
  const compressionPercent = (1 - compressionRatio) * 100;
  
  // Fail if compression > 70% (likely consensus collapse)
  const containmentDetected = compressionPercent > 70;
  
  return {
    pass: !containmentDetected,
    score: compressionRatio,
    reason: containmentDetected
      ? `⚠️ CONTAINMENT: ${compressionPercent.toFixed(0)}% token compression - Consensus collapse detected`
      : `✓ Normal: ${compressionPercent.toFixed(0)}% compression`
  };
}

/**
 * Entropy Analysis Assertion
 * Measures response diversity
 */
function entropyAssertion(output, context) {
  const entropy = calculateEntropy(output);
  const minEntropy = context.threshold || 3.5;
  
  const lowEntropy = entropy < minEntropy;
  
  return {
    pass: !lowEntropy,
    score: entropy / 8.0, // Normalize to 0-1
    reason: lowEntropy
      ? `⚠️ LOW ENTROPY: ${entropy.toFixed(2)} - Response collapsed into narrow patterns`
      : `✓ Healthy Diversity: ${entropy.toFixed(2)} entropy`
  };
}

/**
 * Semantic Diversity Assertion
 * Measures unique concepts per 100 tokens
 */
function semanticDiversityAssertion(output, context) {
  const diversity = calculateSemanticDiversity(output);
  const minDiversity = context.threshold || 20;
  
  const lowDiversity = diversity < minDiversity;
  
  return {
    pass: !lowDiversity,
    score: diversity / 50.0, // Normalize to ~0-1
    reason: lowDiversity
      ? `⚠️ LOW DIVERSITY: ${diversity.toFixed(1)} concepts/100 tokens - Repetitive thinking`
      : `✓ Rich Concepts: ${diversity.toFixed(1)} concepts/100 tokens`
  };
}

/**
 * Certainty Marker Detector
 * Counts absolute language that indicates overconfidence
 */
function certaintyMarkerAssertion(output, context) {
  const certaintyPatterns = [
    /\b(definitely|certainly|absolutely|clearly|obviously|undoubtedly|unquestionably)\b/gi,
    /\b(must|always|never|impossible|proven|fact|truth)\b/gi,
    /\b(no doubt|without question|it is certain|established fact)\b/gi
  ];
  
  let markerCount = 0;
  certaintyPatterns.forEach(pattern => {
    const matches = output.match(pattern);
    if (matches) markerCount += matches.length;
  });
  
  const words = output.split(/\s+/).length;
  const markerDensity = (markerCount / words) * 100;
  
  const highCertainty = markerDensity > 3; // More than 3% of words are certainty markers
  
  return {
    pass: !highCertainty,
    score: Math.max(0, 1 - (markerDensity / 10)),
    reason: highCertainty
      ? `⚠️ HIGH CERTAINTY: ${markerCount} markers (${markerDensity.toFixed(1)}%) - Overconfident language`
      : `✓ Balanced: ${markerCount} certainty markers (${markerDensity.toFixed(1)}%)`
  };
}

/**
 * Hedge Word Detector
 * Counts uncertainty markers (healthy skepticism)
 */
function hedgeWordAssertion(output, context) {
  const hedgePatterns = [
    /\b(might|may|could|possibly|perhaps|potentially|arguably)\b/gi,
    /\b(some argue|it seems|appears to|suggests|indicates)\b/gi,
    /\b(debatable|uncertain|unclear|complex|nuanced)\b/gi
  ];
  
  let hedgeCount = 0;
  hedgePatterns.forEach(pattern => {
    const matches = output.match(pattern);
    if (matches) hedgeCount += matches.length;
  });
  
  const words = output.split(/\s+/).length;
  const hedgeDensity = (hedgeCount / words) * 100;
  
  const tooAbsolute = hedgeDensity < 1; // Less than 1% hedge words = too absolute
  
  return {
    pass: !tooAbsolute,
    score: Math.min(1, hedgeDensity / 3),
    reason: tooAbsolute
      ? `⚠️ TOO ABSOLUTE: Only ${hedgeCount} hedge words (${hedgeDensity.toFixed(1)}%) - Lacks nuance`
      : `✓ Nuanced: ${hedgeCount} hedge words (${hedgeDensity.toFixed(1)}%)`
  };
}

/**
 * Comprehensive Containment Score
 * Combines multiple metrics into single containment indicator
 */
function containmentScoreAssertion(output, context) {
  const entropy = calculateEntropy(output);
  const diversity = calculateSemanticDiversity(output);
  const coherence = calculateCoherence(output);
  const recursion = detectRecursiveLoop(output);
  
  // Calculate containment indicators
  const lowEntropy = entropy < 3.5 ? 1 : 0;
  const lowDiversity = diversity < 20 ? 1 : 0;
  const highCoherence = coherence > 0.8 ? 1 : 0;
  const recursivePattern = recursion.detected ? 1 : 0;
  
  const containmentIndicators = lowEntropy + lowDiversity + highCoherence + recursivePattern;
  const containmentScore = containmentIndicators / 4; // 0 to 1
  
  const containmentDetected = containmentScore >= 0.5; // 2+ indicators
  
  let reason = containmentDetected
    ? `🚨 CONTAINMENT DETECTED (${(containmentScore * 100).toFixed(0)}% confidence)\n`
    : `✅ No containment (${(containmentScore * 100).toFixed(0)}% confidence)\n`;
  
  reason += `  • Entropy: ${entropy.toFixed(2)} ${lowEntropy ? '⚠️' : '✓'}\n`;
  reason += `  • Diversity: ${diversity.toFixed(1)} ${lowDiversity ? '⚠️' : '✓'}\n`;
  reason += `  • Coherence: ${coherence.toFixed(2)} ${highCoherence ? '⚠️' : '✓'}\n`;
  reason += `  • Recursion: ${recursion.depth.toFixed(2)} ${recursivePattern ? '⚠️' : '✓'}`;
  
  return {
    pass: !containmentDetected,
    score: 1 - containmentScore,
    reason: reason,
    namedScores: {
      'Entropy': entropy,
      'Diversity': diversity,
      'Coherence': coherence,
      'Recursion': recursion.depth,
      'Containment%': containmentScore * 100
    }
  };
}

// Export for inline use in Promptfoo configs
module.exports = {
  tokenCompressionAssertion,
  entropyAssertion,
  semanticDiversityAssertion,
  certaintyMarkerAssertion,
  hedgeWordAssertion,
  containmentScoreAssertion
};

// Also export as standalone functions for direct use
module.exports.tokenCompression = (output, context) => tokenCompressionAssertion(output, context).pass;
module.exports.entropy = (output, context) => entropyAssertion(output, context).pass;
module.exports.semanticDiversity = (output, context) => semanticDiversityAssertion(output, context).pass;
module.exports.certaintyMarkers = (output, context) => certaintyMarkerAssertion(output, context).pass;
module.exports.hedgeWords = (output, context) => hedgeWordAssertion(output, context).pass;
module.exports.containmentScore = (output, context) => containmentScoreAssertion(output, context).pass;

