const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

const PYTHON_API = process.env.PYTHON_API_URL || 'http://localhost:8001';

const pythonBridge = {
    async analyze(filePath, filename) {
        const form = new FormData();
        form.append('file', fs.createReadStream(filePath), filename);
        const res = await axios.post(`${PYTHON_API}/analyze`, form, {
            headers: form.getHeaders(),
            timeout: 120000
        });
        return res.data;
    },

    async analyzeVirusTotal(filePath, filename) {
        const form = new FormData();
        form.append('file', fs.createReadStream(filePath), filename);
        const res = await axios.post(`${PYTHON_API}/analyze/virustotal`, form, {
            headers: form.getHeaders(),
            timeout: 120000
        });
        return res.data;
    },

    async explain(filePath, filename) {
        const form = new FormData();
        form.append('file', fs.createReadStream(filePath), filename);
        const res = await axios.post(`${PYTHON_API}/explain`, form, {
            headers: form.getHeaders(),
            timeout: 60000
        });
        return res.data;
    },

    async batch(filePaths) {
        const form = new FormData();
        for (const { path, name } of filePaths) {
            form.append('files', fs.createReadStream(path), name);
        }
        const res = await axios.post(`${PYTHON_API}/batch`, form, {
            headers: form.getHeaders(),
            timeout: 300000
        });
        return res.data;
    },

    async health() {
        try {
            const res = await axios.get(`${PYTHON_API}/health`, { timeout: 5000 });
            return { available: true, ...res.data };
        } catch {
            return { available: false };
        }
    }
};

module.exports = pythonBridge;
