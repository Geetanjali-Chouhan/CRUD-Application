const http = require('http');
const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const PORT = 3000;
const DB_PATH = path.join(__dirname, 'crud.db');

// ==========================================
// 1. SQLite Database Initialization
// ==========================================
const db = new DatabaseSync(DB_PATH);

// Create members table if it doesn't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS members (
    id TEXT PRIMARY KEY,
    fullName TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT NOT NULL,
    department TEXT NOT NULL,
    role TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Active',
    salary INTEGER DEFAULT 0,
    avatarColor TEXT DEFAULT 'indigo',
    skills TEXT DEFAULT '[]',
    joinedDate TEXT NOT NULL,
    createdAt TEXT NOT NULL
  )
`);

console.log(`[DB] Connected to SQLite database at: ${DB_PATH}`);

// ==========================================
// 2. MIME Types for Static File Serving
// ==========================================
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.png': 'image/png',
  '.jpg': 'image/jpeg'
};

// ==========================================
// 3. Helper Functions
// ==========================================
function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(JSON.stringify(data));
}

function parseRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', err => reject(err));
  });
}

// Convert DB row (with skills as JSON string) to JS object
function formatMemberRow(row) {
  if (!row) return null;
  let parsedSkills = [];
  try {
    parsedSkills = JSON.parse(row.skills || '[]');
  } catch (e) {
    parsedSkills = [];
  }
  return {
    ...row,
    skills: parsedSkills
  };
}

// ==========================================
// 4. HTTP Server & Request Dispatcher
// ==========================================
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = url.pathname;
  const method = req.method.toUpperCase();

  // Handle CORS preflight
  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    res.end();
    return;
  }

  // ----------------------------------------
  // API ROUTE: GET /api/members (List all)
  // ----------------------------------------
  if (pathname === '/api/members' && method === 'GET') {
    try {
      const stmt = db.prepare('SELECT * FROM members ORDER BY createdAt DESC');
      const rows = stmt.all();
      const members = rows.map(formatMemberRow);
      sendJson(res, 200, { success: true, count: members.length, data: members });
    } catch (err) {
      console.error('[API GET /api/members error]:', err);
      sendJson(res, 500, { success: false, error: 'Database fetch error: ' + err.message });
    }
    return;
  }

  // ----------------------------------------
  // API ROUTE: POST /api/members (Create)
  // ----------------------------------------
  if (pathname === '/api/members' && method === 'POST') {
    try {
      const payload = await parseRequestBody(req);

      if (!payload.fullName || !payload.email || !payload.phone || !payload.department || !payload.role) {
        sendJson(res, 400, { success: false, error: 'Missing required member fields.' });
        return;
      }

      // Check unique email
      const checkEmailStmt = db.prepare('SELECT id FROM members WHERE LOWER(email) = LOWER(?)');
      const existing = checkEmailStmt.get(payload.email.trim());
      if (existing) {
        sendJson(res, 409, { success: false, error: 'A member with this email already exists in the database.' });
        return;
      }

      const id = payload.id || 'rec_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
      const joinedDate = payload.joinedDate || new Date().toISOString().split('T')[0];
      const createdAt = new Date().toISOString();
      const skillsJson = JSON.stringify(Array.isArray(payload.skills) ? payload.skills : []);

      const insertStmt = db.prepare(`
        INSERT INTO members (id, fullName, email, phone, department, role, status, salary, avatarColor, skills, joinedDate, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      insertStmt.run(
        id,
        payload.fullName.trim(),
        payload.email.trim(),
        payload.phone.trim(),
        payload.department.trim(),
        payload.role.trim(),
        payload.status || 'Active',
        Number(payload.salary) || 0,
        payload.avatarColor || 'indigo',
        skillsJson,
        joinedDate,
        createdAt
      );

      const createdMember = formatMemberRow(db.prepare('SELECT * FROM members WHERE id = ?').get(id));
      sendJson(res, 201, { success: true, message: 'Member created successfully in database', data: createdMember });
    } catch (err) {
      console.error('[API POST /api/members error]:', err);
      sendJson(res, 500, { success: false, error: 'Database insert error: ' + err.message });
    }
    return;
  }

  // ----------------------------------------
  // API ROUTE: PUT /api/members/:id (Update)
  // ----------------------------------------
  const updateMatch = pathname.match(/^\/api\/members\/([^/]+)$/);
  if (updateMatch && method === 'PUT') {
    const memberId = updateMatch[1];
    try {
      const payload = await parseRequestBody(req);

      const existingMember = db.prepare('SELECT * FROM members WHERE id = ?').get(memberId);
      if (!existingMember) {
        sendJson(res, 404, { success: false, error: 'Member not found in database.' });
        return;
      }

      // Check unique email among other members
      if (payload.email) {
        const checkEmailStmt = db.prepare('SELECT id FROM members WHERE LOWER(email) = LOWER(?) AND id != ?');
        const duplicate = checkEmailStmt.get(payload.email.trim(), memberId);
        if (duplicate) {
          sendJson(res, 409, { success: false, error: 'Email is already taken by another member.' });
          return;
        }
      }

      const skillsJson = JSON.stringify(Array.isArray(payload.skills) ? payload.skills : []);

      const updateStmt = db.prepare(`
        UPDATE members
        SET fullName = ?, email = ?, phone = ?, department = ?, role = ?, status = ?, salary = ?, avatarColor = ?, skills = ?
        WHERE id = ?
      `);

      updateStmt.run(
        payload.fullName ? payload.fullName.trim() : existingMember.fullName,
        payload.email ? payload.email.trim() : existingMember.email,
        payload.phone ? payload.phone.trim() : existingMember.phone,
        payload.department ? payload.department.trim() : existingMember.department,
        payload.role ? payload.role.trim() : existingMember.role,
        payload.status || existingMember.status,
        payload.salary !== undefined ? Number(payload.salary) : existingMember.salary,
        payload.avatarColor || existingMember.avatarColor,
        skillsJson,
        memberId
      );

      const updatedMember = formatMemberRow(db.prepare('SELECT * FROM members WHERE id = ?').get(memberId));
      sendJson(res, 200, { success: true, message: 'Member updated successfully in database', data: updatedMember });
    } catch (err) {
      console.error('[API PUT /api/members error]:', err);
      sendJson(res, 500, { success: false, error: 'Database update error: ' + err.message });
    }
    return;
  }

  // ----------------------------------------
  // API ROUTE: DELETE /api/members/:id (Delete)
  // ----------------------------------------
  const deleteMatch = pathname.match(/^\/api\/members\/([^/]+)$/);
  if (deleteMatch && method === 'DELETE') {
    const memberId = deleteMatch[1];
    try {
      const existing = db.prepare('SELECT fullName FROM members WHERE id = ?').get(memberId);
      if (!existing) {
        sendJson(res, 404, { success: false, error: 'Member not found in database.' });
        return;
      }

      const deleteStmt = db.prepare('DELETE FROM members WHERE id = ?');
      deleteStmt.run(memberId);

      sendJson(res, 200, { success: true, message: `Member ${existing.fullName} deleted from database.` });
    } catch (err) {
      console.error('[API DELETE /api/members error]:', err);
      sendJson(res, 500, { success: false, error: 'Database delete error: ' + err.message });
    }
    return;
  }

  // ----------------------------------------
  // Static File Serving (HTML, CSS, JS, SVG, etc.)
  // ----------------------------------------
  let safePath = pathname === '/' ? '/index.html' : pathname;
  // Security: prevent directory traversal
  const normalizedPath = path.normalize(safePath).replace(/^(\.\.[/\\])+/, '');
  const filePath = path.join(__dirname, normalizedPath);
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('404 Not Found');
      } else {
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end(`Server Error: ${err.code}`);
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    }
  });
});

// ==========================================
// 5. Start Server
// ==========================================
server.listen(PORT, () => {
  console.log(`PulseCRUD Server with SQLite Database running at: http://localhost:${PORT}/`);
  console.log(`Database File: ${DB_PATH}`);
});
