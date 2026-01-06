/* ============================================
   Simple CORS Proxy Server
   Bypasses CORS restrictions for n8n webhooks
   ============================================ */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const PORT = 3000;

// MIME types for serving static files
const MIME_TYPES = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
};

const server = http.createServer(async (req, res) => {
    // Set CORS headers for all responses
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }
    
    // Proxy endpoint for forwarding requests to n8n
    if (req.url.startsWith('/proxy/') && req.method === 'POST') {
        const targetUrl = decodeURIComponent(req.url.replace('/proxy/', ''));
        console.log(`Proxying request to: ${targetUrl}`);
        
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            proxyRequest(targetUrl, body, res);
        });
        return;
    }
    
    // Serve static files
    let filePath = req.url === '/' ? '/index.html' : req.url;
    filePath = path.join(__dirname, filePath);
    
    const ext = path.extname(filePath);
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    
    fs.readFile(filePath, (err, content) => {
        if (err) {
            if (err.code === 'ENOENT') {
                res.writeHead(404);
                res.end('File not found');
            } else {
                res.writeHead(500);
                res.end('Server error');
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content);
        }
    });
});

function proxyRequest(targetUrl, body, res) {
    const url = new URL(targetUrl);
    const protocol = url.protocol === 'https:' ? https : http;
    
    const options = {
        hostname: url.hostname,
        port: url.port || (url.protocol === 'https:' ? 443 : 80),
        path: url.pathname + url.search,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(body)
        }
    };
    
    console.log('Sending request with body:', body);
    
    const proxyReq = protocol.request(options, (proxyRes) => {
        console.log('Received response status:', proxyRes.statusCode);
        
        const chunks = [];
        proxyRes.on('data', chunk => chunks.push(chunk));
        proxyRes.on('end', () => {
            const responseBuffer = Buffer.concat(chunks);
            console.log('Response size:', responseBuffer.length, 'bytes');
            
            // Forward response headers
            res.writeHead(proxyRes.statusCode, {
                'Content-Type': proxyRes.headers['content-type'] || 'application/json',
                'Access-Control-Allow-Origin': '*'
            });
            res.end(responseBuffer);
        });
    });
    
    proxyReq.on('error', (err) => {
        console.error('Proxy error:', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
    });
    
    proxyReq.write(body);
    proxyReq.end();
}

server.listen(PORT, () => {
    console.log(`\n🚀 Server running at http://localhost:${PORT}`);
    console.log(`📁 Serving static files from: ${__dirname}`);
    console.log(`🔄 Proxy endpoint: POST /proxy/{encoded-url}\n`);
});
