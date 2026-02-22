/**
 * Anomaly Detector — Y2K Cyber AI (Node.js Port)
 * Replaces the Python IsolationForest model.
 * Performs statistical anomaly detection on structured log streams.
 */

// Simple statistical memory store to simulate stateful training
let trainedVectors = [];
let isTrained = false;

/**
 * Convert log text/metadata to numerical features
 */
function extractNumericalFeatures(logs) {
    const features = [];

    for (const log of logs) {
        const msg = (log.message || '').toLowerCase();

        // Feature 1: Message length
        const msgLen = msg.length;

        // Feature 2: High-risk keywords presence
        const hasScript = ['sudo', 'chmod', 'chown', 'wget', 'curl', 'bash', 'powershell'].some(kw => msg.includes(kw)) ? 1 : 0;

        // Feature 3: Action failure indicators
        const hasFailed = ['failed', 'invalid', 'error', 'denied'].some(kw => msg.includes(kw)) ? 1 : 0;

        // Feature 4: Simple Proxy Entropy (unique chars / total chars)
        const uniqueChars = new Set(msg.split('')).size;
        const entropy = msgLen > 0 ? (uniqueChars / msgLen) : 0;

        features.push([msgLen, hasScript, hasFailed, entropy]);
    }

    return features;
}

/**
 * Calculates the mean and standard deviation of historical data
 * We then compute the Z-Score to determine outlier status
 */
function trainZScoreModel(featureVectors) {
    trainedVectors = [...trainedVectors, ...featureVectors];
    isTrained = trainedVectors.length >= 10;
}

/**
 * Predict using basic Euclidean Distance from the "Normal" centroid
 */
function predictAnomalies(featureVectors) {
    if (!isTrained || trainedVectors.length === 0) {
        // Not enough data to train yet, return neutral scores
        return featureVectors.map(() => ({ score: 0.5, anomaly: false, rawScore: 0 }));
    }

    // 1. Calculate the Centroid of trained data (the "normal" mean for each feature)
    const numFeatures = trainedVectors[0].length;
    const means = new Array(numFeatures).fill(0);

    for (const vec of trainedVectors) {
        for (let i = 0; i < numFeatures; i++) {
            means[i] += vec[i];
        }
    }
    for (let i = 0; i < numFeatures; i++) {
        means[i] /= trainedVectors.length;
    }

    // 2. Score new data based on distance from the normal mean
    const results = [];
    for (const vec of featureVectors) {
        let distanceSquare = 0;
        for (let i = 0; i < numFeatures; i++) {
            // we scale down feature 0 (message length) slightly so it doesn't overpower the binary classifiers
            const weight = (i === 0) ? 0.05 : 1.0;
            distanceSquare += Math.pow((vec[i] - means[i]) * weight, 2);
        }

        const distance = Math.sqrt(distanceSquare);

        // 3. Normalize to a 0-100 score
        // Distance roughly 0 = normal, distance > 2 = anomalous
        let anomalyScore = Math.min(100, Math.max(0, distance * 30));

        // Tweak boundaries to match Python's -1 or 1 structure
        const isAnomaly = anomalyScore > 65;

        results.push({
            score: Number(anomalyScore.toFixed(2)),
            anomaly: isAnomaly,
            rawScore: distance
        });
    }

    return results;
}

/**
 * Exposed API function mirror
 */
function detectAnomalies(logs) {
    if (!logs || logs.length === 0) {
        return { anomalies: [] };
    }

    const X = extractNumericalFeatures(logs);

    // Online learning / Warm start logic
    if (!isTrained) {
        trainZScoreModel(X);
        if (!isTrained) {
            return { results: logs.map(() => ({ score: 0.5, anomaly: false })) };
        }
    }

    const results = predictAnomalies(X);

    // Strip out internal math keys for the final API response
    return {
        results: results.map(r => ({ score: r.score, anomaly: r.anomaly }))
    };
}

module.exports = {
    detectAnomalies,
    trainZScoreModel,
    extractNumericalFeatures
};
