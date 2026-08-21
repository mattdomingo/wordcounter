const http = require('node:http');

const MAX_TEXT_LENGTH = 10_000;

function sendJson(response, statusCode, body) {
  response.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
  });
  response.end(JSON.stringify(body));
}

function readJson(request) {
  return new Promise((resolve, reject) => {
    let body = '';

    request.setEncoding('utf8');
    request.on('data', (chunk) => {
      body += chunk;
      if (body.length > MAX_TEXT_LENGTH + 10_000) {
        reject(new Error('Request body is too large.'));
        request.destroy();
      }
    });
    request.on('end', () => {
      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error('Request body must be valid JSON.'));
      }
    });
    request.on('error', reject);
  });
}

function countWords(text) {
  return text.trim().split(/\s+/).length;
}

function createServer() {
  return http.createServer(async (request, response) => {
    if (request.method !== 'POST' || request.url !== '/api/word-count') {
      sendJson(response, 404, { error: 'Not found.' });
      return;
    }

    let payload;
    try {
      payload = await readJson(request);
    } catch (error) {
      if (!response.writableEnded) {
        sendJson(response, 400, { error: error.message });
      }
      return;
    }

    if (!payload || typeof payload.text !== 'string') {
      sendJson(response, 400, { error: 'Text must be a string.' });
      return;
    }

    if (payload.text.trim().length === 0) {
      sendJson(response, 400, { error: 'Text cannot be empty.' });
      return;
    }

    if (payload.text.length > MAX_TEXT_LENGTH) {
      sendJson(response, 400, { error: 'Text must be 10,000 characters or fewer.' });
      return;
    }

    sendJson(response, 200, {
      words: countWords(payload.text),
      characters: payload.text.length,
    });
  });
}

if (require.main === module) {
  const port = Number(process.env.PORT) || 3000;
  createServer().listen(port, () => {
    console.log(`Word counter API listening on port ${port}`);
  });
}

module.exports = { createServer, countWords, MAX_TEXT_LENGTH };
