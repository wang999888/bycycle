const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');
const { randomUUID } = require('node:crypto');

const port = Number(process.env.PORT) || 3000;
const root = __dirname;
const dataFile = path.join(root, 'data', 'records.json');

async function readRecords() {
  try {
    return JSON.parse(await fs.readFile(dataFile, 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
}

async function writeRecords(records) {
  await fs.mkdir(path.dirname(dataFile), { recursive: true });
  await fs.writeFile(dataFile, JSON.stringify(records, null, 2) + '\n', 'utf8');
}

function sendJson(response, status, body) {
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store, no-cache, must-revalidate',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  response.end(JSON.stringify(body));
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    let body = '';
    request.on('data', chunk => { body += chunk; });
    request.on('end', () => {
      try { resolve(JSON.parse(body || '{}')); } catch (error) { reject(error); }
    });
    request.on('error', reject);
  });
}

async function handleApi(request, response, pathname) {
  if (request.method === 'OPTIONS') return sendJson(response, 204, {});
  if (pathname !== '/api/records') {
    const match = pathname.match(/^\/api\/records\/(\d+)$/);
    if (!match) return sendJson(response, 404, { error: '接口不存在' });
    if (request.method !== 'PUT') return sendJson(response, 405, { error: '不支持此方法' });
    const index = Number(match[1]);
    const records = await readRecords();
    if (!records[index]) return sendJson(response, 404, { error: '记录不存在' });
    const body = await readBody(request);
    records[index] = { ...records[index], ...body };
    await writeRecords(records);
    return sendJson(response, 200, records[index]);
  }

  if (request.method === 'GET') return sendJson(response, 200, await readRecords());
  if (request.method === 'DELETE') {
    await writeRecords([]);
    return sendJson(response, 200, []);
  }
  if (request.method === 'POST') {
    const body = await readBody(request);
    if (!body.userNo) return sendJson(response, 400, { error: '用户 No 不能为空' });
    const records = await readRecords();
    const record = { id: randomUUID(), ...body };
    records.push(record);
    await writeRecords(records);
    return sendJson(response, 201, record);
  }
  return sendJson(response, 405, { error: '不支持此方法' });
}

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url, `http://${request.headers.host || 'localhost'}`);
  try {
    if (url.pathname.startsWith('/api/')) return await handleApi(request, response, url.pathname);
    const fileName = url.pathname === '/' ? 'index.html' : url.pathname.slice(1);
    if (fileName.includes('..')) return sendJson(response, 400, { error: '非法路径' });
    const file = await fs.readFile(path.join(root, fileName));
    const contentType = fileName.endsWith('.html') ? 'text/html; charset=utf-8' : 'application/octet-stream';
    response.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-store, no-cache, must-revalidate'
    });
    response.end(file);
  } catch (error) {
    if (error.code === 'ENOENT') return sendJson(response, 404, { error: '页面不存在' });
    console.error(error);
    sendJson(response, 500, { error: '服务器内部错误' });
  }
});

server.listen(port, '0.0.0.0', () => console.log(`Bycycle server running at http://localhost:${port}`));