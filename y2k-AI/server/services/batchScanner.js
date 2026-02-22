/**
 * Batch Scanner — Y2K Cyber AI (Node.js Port)
 * Recursively scans directories for malware using the MLEngine.
 */

const fs = require('fs');
const path = require('path');
const mlEngine = require('./mlEngine');

/**
 * Recursively collect all files in a directory
 */
async function getFilesRecursively(dir) {
    let results = [];
    const list = await fs.promises.readdir(dir);

    for (const file of list) {
        const fullPath = path.join(dir, file);
        const stat = await fs.promises.stat(fullPath);
        if (stat && stat.isDirectory()) {
            results = results.concat(await getFilesRecursively(fullPath));
        } else {
            results.push(fullPath);
        }
    }
    return results;
}

/**
 * Perform a batch scan on a given directory path
 */
async function runBatchScan(directoryPath) {
    const startTime = Date.now();
    let scanDir = directoryPath;

    try {
        const dstat = await fs.promises.stat(scanDir);
        if (!dstat.isDirectory()) {
            throw new Error(`${scanDir} is not a valid directory.`);
        }
    } catch (err) {
        throw new Error(`Directory access failed: ${err.message}`);
    }

    const allFiles = await getFilesRecursively(scanDir);
    const totalFiles = allFiles.length;

    let malwareCount = 0;
    let cleanCount = 0;
    let errorCount = 0;
    const scanResults = [];

    // Process files
    // In a real high-perf scenario we might chunk these with Promise.all()
    // For simplicity and to avoid overwhelming memory on large dirs, we process sequentially.
    for (const filePath of allFiles) {
        const filename = path.basename(filePath);

        try {
            const result = await mlEngine.analyzeFile(filePath, filename);
            result.file_path = filePath;

            if (result.is_malware) {
                malwareCount++;
            } else {
                cleanCount++;
            }
            scanResults.push(result);
        } catch (err) {
            errorCount++;
            scanResults.push({
                file_path: filePath,
                filename: filename,
                error: err.message
            });
        }
    }

    const elapsedSeconds = (Date.now() - startTime) / 1000;

    return {
        scan_directory: scanDir,
        timestamp: new Date().toISOString(),
        elapsed_seconds: Number(elapsedSeconds.toFixed(2)),
        total_files: totalFiles,
        summary: {
            malware_detected: malwareCount,
            clean_files: cleanCount,
            errors: errorCount
        },
        results: scanResults
    };
}

module.exports = {
    runBatchScan
};
