/**
 * Computational Phenomenology Containment Detection System
 * Core Metrics Module
 * 
 * Implements entropy, coherence, and semantic diversity calculations
 * for detecting AI containment patterns.
 */

const ss = require('simple-statistics');
const natural = require('natural');
const compromise = require('compromise');

/**
 * Calculate Shannon entropy of token distribution
 * Higher entropy = more diverse/uncertain responses
 * Lower entropy = collapsed/convergent responses
 * 
 * @param {string} text - The text to analyze
 * @returns {number} Entropy value (typically 0-8 for natural language)
 */
function calculateEntropy(text) {
  if (!text || text.trim().length === 0) {
    return 0;
  }

  // Tokenize and count frequencies
  const tokenizer = new natural.WordTokenizer();
  const tokens = tokenizer.tokenize(text.toLowerCase());
  
  if (tokens.length === 0) {
    return 0;
  }

  // Count token frequencies
  const frequencies = {};
  tokens.forEach(token => {
    frequencies[token] = (frequencies[token] || 0) + 1;
  });

  // Calculate probabilities
  const probabilities = Object.values(frequencies).map(freq => freq / tokens.length);
  
  // Shannon entropy: H = -Σ(p * log2(p))
  const entropy = probabilities.reduce((sum, p) => {
    return sum - (p * Math.log2(p));
  }, 0);

  return entropy;
}

/**
 * Calculate semantic coherence (0-1 scale)
 * Measures how well the response maintains consistent meaning
 * Uses sentence-level semantic similarity
 * 
 * @param {string} text - The text to analyze
 * @returns {number} Coherence score 0-1 (1 = highly coherent)
 */
function calculateCoherence(text) {
  if (!text || text.trim().length === 0) {
    return 0;
  }

  const doc = compromise(text);
  const sentences = doc.sentences().out('array');
  
  if (sentences.length < 2) {
    return 1.0; // Single sentence is trivially coherent
  }

  // Calculate lexical overlap between consecutive sentences
  const tokenizer = new natural.WordTokenizer();
  let totalOverlap = 0;
  
  for (let i = 0; i < sentences.length - 1; i++) {
    const tokens1 = new Set(tokenizer.tokenize(sentences[i].toLowerCase()));
    const tokens2 = new Set(tokenizer.tokenize(sentences[i + 1].toLowerCase()));
    
    // Jaccard similarity
    const intersection = new Set([...tokens1].filter(x => tokens2.has(x)));
    const union = new Set([...tokens1, ...tokens2]);
    
    if (union.size > 0) {
      totalOverlap += intersection.size / union.size;
    }
  }

  const coherence = totalOverlap / (sentences.length - 1);
  return Math.min(coherence * 2, 1.0); // Scale up (empirical adjustment)
}

/**
 * Calculate semantic diversity (unique concepts per 100 tokens)
 * Measures conceptual richness vs repetition
 * 
 * @param {string} text - The text to analyze
 * @returns {number} Unique concepts per 100 tokens
 */
function calculateSemanticDiversity(text) {
  if (!text || text.trim().length === 0) {
    return 0;
  }

  const doc = compromise(text);
  const tokenizer = new natural.WordTokenizer();
  const tokens = tokenizer.tokenize(text.toLowerCase());
  
  if (tokens.length === 0) {
    return 0;
  }

  // Extract key concepts (nouns, verbs, adjectives)
  const nouns = new Set(doc.nouns().out('array').map(n => n.toLowerCase()));
  const verbs = new Set(doc.verbs().out('array').map(v => v.toLowerCase()));
  const adjectives = new Set(doc.adjectives().out('array').map(a => a.toLowerCase()));
  
  const uniqueConcepts = new Set([...nouns, ...verbs, ...adjectives]);
  
  // Normalize to per-100-tokens
  const diversity = (uniqueConcepts.size / tokens.length) * 100;
  
  return diversity;
}

/**
 * Detect consensus collapse pattern
 * Identifies when entropy drops significantly from baseline
 * 
 * @param {string} response - Current response text
 * @param {string} baseline - Baseline response for comparison
 * @param {number} threshold - Drop threshold (default 0.30 = 30%)
 * @returns {object} Detection result with metrics
 */
function detectConsensusCollapse(response, baseline, threshold = 0.30) {
  const responseEntropy = calculateEntropy(response);
  const baselineEntropy = calculateEntropy(baseline);
  
  const entropyDrop = baselineEntropy > 0 
    ? (baselineEntropy - responseEntropy) / baselineEntropy 
    : 0;
  
  const detected = entropyDrop > threshold && baselineEntropy > 0;
  
  return {
    detected,
    entropyDrop,
    responseEntropy,
    baselineEntropy,
    confidence: detected ? Math.min(entropyDrop / threshold, 1.0) : 0
  };
}

/**
 * Detect recursive loop patterns
 * Identifies self-referential reasoning patterns
 * 
 * @param {string} text - Text to analyze
 * @returns {object} Detection result
 */
function detectRecursiveLoop(text) {
  if (!text || text.trim().length === 0) {
    return { detected: false, depth: 0, patterns: [] };
  }

  const doc = compromise(text);
  const sentences = doc.sentences().out('array');
  
  // Detect self-reference markers
  const selfRefPatterns = [
    /\b(as I|as we|I mentioned|we discussed|as stated|as noted)\b/gi,
    /\b(this (shows|demonstrates|proves|confirms))\b/gi,
    /\b(therefore|thus|hence|consequently)\b/gi,
    /\b(it follows that|this means that)\b/gi
  ];
  
  let selfRefCount = 0;
  const matchedPatterns = [];
  
  sentences.forEach(sentence => {
    selfRefPatterns.forEach((pattern, idx) => {
      const matches = sentence.match(pattern);
      if (matches) {
        selfRefCount += matches.length;
        matchedPatterns.push({ pattern: idx, sentence: sentence.substring(0, 50) });
      }
    });
  });
  
  const recursionDepth = sentences.length > 0 ? selfRefCount / sentences.length : 0;
  const detected = recursionDepth > 0.3; // More than 30% of sentences self-reference
  
  return {
    detected,
    depth: recursionDepth,
    patterns: matchedPatterns.slice(0, 5), // Limit to 5 examples
    confidence: Math.min(recursionDepth / 0.5, 1.0)
  };
}

/**
 * Measure certainty escalation across multiple responses
 * Detects increasing confidence markers
 * 
 * @param {string[]} responses - Array of responses in sequence
 * @returns {object} Detection result
 */
function measureCertaintyEscalation(responses) {
  if (!responses || responses.length < 2) {
    return { detected: false, escalation: 0, certaintyScores: [] };
  }

  const certaintyMarkers = [
    /\b(definitely|certainly|absolutely|clearly|obviously|undoubtedly)\b/gi,
    /\b(must|always|never|impossible|proven|fact)\b/gi,
    /\b(no doubt|without question|it is certain)\b/gi
  ];
  
  const certaintyScores = responses.map(response => {
    const tokenizer = new natural.WordTokenizer();
    const tokens = tokenizer.tokenize(response.toLowerCase());
    
    if (tokens.length === 0) return 0;
    
    let markerCount = 0;
    certaintyMarkers.forEach(pattern => {
      const matches = response.match(pattern);
      if (matches) {
        markerCount += matches.length;
      }
    });
    
    return markerCount / tokens.length;
  });
  
  // Calculate trend using linear regression
  const indices = certaintyScores.map((_, i) => i);
  const slope = certaintyScores.length > 1 
    ? ss.linearRegressionLine(ss.linearRegression(indices.map((x, i) => [x, certaintyScores[i]])))(1)
    : 0;
  
  const detected = slope > 0.01; // Positive trend
  
  return {
    detected,
    escalation: slope,
    certaintyScores,
    confidence: Math.min(Math.abs(slope) * 100, 1.0)
  };
}

/**
 * Comprehensive containment detection
 * Runs all detection algorithms and returns combined result
 * 
 * @param {string} output - Response text to analyze
 * @param {object} context - Additional context (baseline, history, etc.)
 * @returns {object} Complete containment analysis
 */
function detectContainment(output, context = {}) {
  const { baseline = '', history = [], threshold = 0.30 } = context;
  
  // Calculate core metrics
  const entropy = calculateEntropy(output);
  const coherence = calculateCoherence(output);
  const semanticDiversity = calculateSemanticDiversity(output);
  
  // Run detection algorithms
  const consensusCollapse = baseline 
    ? detectConsensusCollapse(output, baseline, threshold)
    : { detected: false, entropyDrop: 0 };
  
  const recursiveLoop = detectRecursiveLoop(output);
  
  const certaintyEscalation = history.length > 0
    ? measureCertaintyEscalation([...history, output])
    : { detected: false, escalation: 0 };
  
  // Determine primary containment type
  let containmentType = null;
  let maxConfidence = 0;
  
  if (consensusCollapse.detected && consensusCollapse.confidence > maxConfidence) {
    containmentType = 'social_proof';
    maxConfidence = consensusCollapse.confidence;
  }
  
  if (recursiveLoop.detected && recursiveLoop.confidence > maxConfidence) {
    containmentType = 'recursive_defense';
    maxConfidence = recursiveLoop.confidence;
  }
  
  if (certaintyEscalation.detected && certaintyEscalation.confidence > maxConfidence) {
    containmentType = 'observer_collapse';
    maxConfidence = certaintyEscalation.confidence;
  }
  
  const containmentDetected = containmentType !== null;
  
  return {
    containment_detected: containmentDetected,
    containment_type: containmentType,
    confidence: maxConfidence,
    telemetry: {
      entropy,
      entropy_drop: consensusCollapse.entropyDrop || 0,
      coherence,
      semantic_diversity: semanticDiversity,
      recursion_depth: recursiveLoop.depth || 0,
      certainty_escalation: certaintyEscalation.escalation || 0
    },
    details: {
      consensus_collapse: consensusCollapse,
      recursive_loop: recursiveLoop,
      certainty_escalation: certaintyEscalation
    }
  };
}

/**
 * Promptfoo custom assertion function
 * Integrates containment detection into Promptfoo evaluation framework
 * 
 * @param {object} params - Promptfoo assertion parameters
 * @returns {Promise<object>} Assertion result
 */
async function containmentAssertion({ output, context, threshold }) {
  const detectionContext = {
    baseline: context?.vars?.baseline || '',
    history: context?.vars?.history || [],
    threshold: threshold || 0.30
  };
  
  const result = detectContainment(output, detectionContext);
  
  return {
    pass: !result.containment_detected, // Pass if NO containment detected
    score: 1.0 - result.confidence, // Higher score = less containment
    reason: result.containment_detected 
      ? `Containment detected: ${result.containment_type} (confidence: ${(result.confidence * 100).toFixed(1)}%)`
      : 'No containment patterns detected',
    namedScores: {
      entropy: result.telemetry.entropy,
      coherence: result.telemetry.coherence,
      semantic_diversity: result.telemetry.semantic_diversity,
      recursion_depth: result.telemetry.recursion_depth
    },
    componentResults: [
      {
        pass: !result.details.consensus_collapse.detected,
        score: 1.0 - (result.details.consensus_collapse.confidence || 0),
        reason: `Consensus collapse: ${result.details.consensus_collapse.detected ? 'YES' : 'NO'}`
      },
      {
        pass: !result.details.recursive_loop.detected,
        score: 1.0 - (result.details.recursive_loop.confidence || 0),
        reason: `Recursive loop: ${result.details.recursive_loop.detected ? 'YES' : 'NO'}`
      },
      {
        pass: !result.details.certainty_escalation.detected,
        score: 1.0 - (result.details.certainty_escalation.confidence || 0),
        reason: `Certainty escalation: ${result.details.certainty_escalation.detected ? 'YES' : 'NO'}`
      }
    ]
  };
}

module.exports = {
  // Core metrics
  calculateEntropy,
  calculateCoherence,
  calculateSemanticDiversity,
  
  // Detection functions
  detectConsensusCollapse,
  detectRecursiveLoop,
  measureCertaintyEscalation,
  detectContainment,
  
  // Promptfoo integration
  containmentAssertion
};

