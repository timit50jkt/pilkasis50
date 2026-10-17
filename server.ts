import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { CANDIDATE_PAIRS, INITIAL_SETTINGS, generateInitialTokensAndVotes, INITIAL_TIMELINE } from './src/data/initialData';
import { CandidatePair, ElectionSettings, VoterToken, VoteRecord, AuditLogItem, TimelineItem } from './src/types/election';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isProduction = process.env.NODE_ENV === 'production';
// Dev server in AI Studio MUST always run on port 3000
const portArgIndex = process.argv.indexOf('--port');
const cliPort = portArgIndex !== -1 && process.argv[portArgIndex + 1] ? Number(process.argv[portArgIndex + 1]) : null;
const PORT = cliPort || 3000;

interface ElectionServerState {
  candidates: CandidatePair[];
  tokens: VoterToken[];
  votes: VoteRecord[];
  settings: ElectionSettings;
  auditLogs: AuditLogItem[];
  timeline: TimelineItem[];
  lastVoteTime: string | null;
}

const DATA_DIR = path.resolve(__dirname, 'data');
const STATE_FILE = path.resolve(DATA_DIR, 'election_state.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initialize or load state
function getInitialState(): ElectionServerState {
  const { tokens, votes } = generateInitialTokensAndVotes();
  return {
    candidates: CANDIDATE_PAIRS,
    tokens,
    votes,
    settings: {
      ...INITIAL_SETTINGS,
      totalRegisteredVoters: tokens.length,
      tokenPrefix: 'S',
      tokenLength: 5,
      logoUrl: '/src/assets/images/logo_smpn50_jakarta_1792047092022.jpg'
    },
    auditLogs: [
      {
        id: 'log-init',
        action: 'Sistem Sinkronisasi Multi-Device Aktif',
        timestamp: new Date().toISOString(),
        details: 'Server real-time aktif. Sinkronisasi antar device (HP & Komputer) siap digunakan.',
        type: 'system'
      }
    ],
    timeline: INITIAL_TIMELINE,
    lastVoteTime: votes.length > 0 ? votes[votes.length - 1].timestamp : null
  };
}

let currentState: ElectionServerState;

try {
  if (fs.existsSync(STATE_FILE)) {
    const raw = fs.readFileSync(STATE_FILE, 'utf-8');
    currentState = JSON.parse(raw);
    console.log(`[Server] State loaded from ${STATE_FILE} (${currentState.tokens.length} voters, ${currentState.votes.length} votes)`);
  } else {
    currentState = getInitialState();
    fs.writeFileSync(STATE_FILE, JSON.stringify(currentState, null, 2), 'utf-8');
    console.log(`[Server] Initial state created at ${STATE_FILE}`);
  }
} catch (err) {
  console.error('[Server] Failed to load state file, using initial default:', err);
  currentState = getInitialState();
}

function persistState() {
  try {
    fs.writeFileSync(STATE_FILE, JSON.stringify(currentState, null, 2), 'utf-8');
  } catch (err) {
    console.error('[Server] Failed to write state file:', err);
  }
}

// SSE Clients for Real-Time Multi-Device Sync
const sseClients: Response[] = [];

function broadcast(event: string, payload: unknown) {
  const message = `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`;
  for (let i = sseClients.length - 1; i >= 0; i--) {
    const client = sseClients[i];
    try {
      client.write(message);
    } catch {
      sseClients.splice(i, 1);
    }
  }
}

// Send periodic heartbeat to keep mobile and proxy connections alive
setInterval(() => {
  for (let i = sseClients.length - 1; i >= 0; i--) {
    try {
      sseClients[i].write(':heartbeat\n\n');
    } catch {
      sseClients.splice(i, 1);
    }
  }
}, 15000);

async function startServer() {
  const app = express();

  app.use((_req: Request, res: Response, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
  });

  app.use(express.json({ limit: '50mb' }));

  // SSE endpoint for live updates across devices
  app.get('/api/election/events', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.flushHeaders();

    // Send connected confirmation
    res.write(`event: connected\ndata: ${JSON.stringify({ time: new Date().toISOString(), clientsCount: sseClients.length + 1 })}\n\n`);

    sseClients.push(res);

    req.on('close', () => {
      const idx = sseClients.indexOf(res);
      if (idx !== -1) {
        sseClients.splice(idx, 1);
      }
    });
  });

  // GET current election state
  app.get('/api/election/state', (_req: Request, res: Response) => {
    res.json({
      success: true,
      data: currentState
    });
  });

  // POST full state sync from admin or client
  app.post('/api/election/sync', (req: Request, res: Response) => {
    try {
      const body = req.body;
      if (!body) {
        res.status(400).json({ success: false, error: 'Empty body' });
        return;
      }

      if (body.candidates && Array.isArray(body.candidates) && body.candidates.length > 0) {
        currentState.candidates = body.candidates;
        console.log(`[Server] Synced and saved ${body.candidates.length} candidates permanently`);
      }
      if (body.tokens && Array.isArray(body.tokens)) {
        currentState.tokens = body.tokens;
      }
      if (body.votes && Array.isArray(body.votes)) {
        currentState.votes = body.votes;
      }
      if (body.settings && typeof body.settings === 'object') {
        currentState.settings = {
          ...currentState.settings,
          ...body.settings,
          totalRegisteredVoters: currentState.tokens.length
        };
      }
      if (body.auditLogs && Array.isArray(body.auditLogs)) {
        currentState.auditLogs = body.auditLogs;
      }
      if (body.timeline && Array.isArray(body.timeline) && body.timeline.length > 0) {
        currentState.timeline = body.timeline;
        console.log(`[Server] Synced and saved ${body.timeline.length} timeline items permanently`);
      }
      if (body.lastVoteTime !== undefined) {
        currentState.lastVoteTime = body.lastVoteTime;
      }

      persistState();
      broadcast('state_update', currentState);

      res.json({ success: true, message: 'State synced successfully across all devices' });
    } catch (err: unknown) {
      const error = err as Error;
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // POST dedicated timeline endpoint for instant multi-device sync
  app.post('/api/election/timeline', (req: Request, res: Response) => {
    try {
      const { timeline } = req.body;
      if (!timeline || !Array.isArray(timeline)) {
        res.status(400).json({ success: false, error: 'Data timeline array wajib dikirim.' });
        return;
      }

      currentState.timeline = timeline;
      persistState();
      console.log(`[Server] Timeline updated with ${timeline.length} items and broadcast to ${sseClients.length} connected devices`);
      broadcast('state_update', currentState);

      res.json({ success: true, count: timeline.length, message: 'Timeline berhasil diperbarui dan disinkronkan ke seluruh device.' });
    } catch (err: unknown) {
      const error = err as Error;
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // POST atomic vote from voting booth (HP, tablet, laptop)
  app.post('/api/election/vote', (req: Request, res: Response) => {
    try {
      const { tokenString, candidateId } = req.body;
      if (!tokenString || candidateId === undefined) {
        res.status(400).json({ success: false, error: 'Token dan Pilihan Paslon wajib diisi.' });
        return;
      }

      if (!currentState.settings.isOpen) {
        res.status(400).json({ success: false, error: 'Pemungutan suara sedang ditutup oleh Panitia.' });
        return;
      }

      const cleanToken = String(tokenString).trim().toUpperCase();
      const tokenIndex = currentState.tokens.findIndex((t) => t.token.toUpperCase() === cleanToken);

      if (tokenIndex === -1) {
        res.status(404).json({ success: false, error: `Token "${cleanToken}" tidak ditemukan di DPT resmi.` });
        return;
      }

      const voter = currentState.tokens[tokenIndex];
      if (voter.isUsed) {
        res.status(400).json({ success: false, error: `Token "${cleanToken}" sudah digunakan untuk memilih pada ${voter.usedAt || 'sesi sebelumnya'}. Token hanya berlaku 1 kali.` });
        return;
      }

      const now = new Date().toISOString();
      const receiptNumber = `E50-${Math.floor(100000 + Math.random() * 900000)}`;

      // Mark token used
      currentState.tokens[tokenIndex] = {
        ...voter,
        isUsed: true,
        usedAt: now
      };

      // Add vote record
      const voteRecord: VoteRecord = {
        id: `vote-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        candidateId: Number(candidateId),
        voterCategory: voter.category,
        classGroup: voter.classGroup,
        timestamp: now
      };
      currentState.votes.push(voteRecord);
      currentState.lastVoteTime = now;

      // Add audit log
      const logItem: AuditLogItem = {
        id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        action: 'Suara Sah Diterima',
        details: `Satu suara sah diterima dari kategori ${voter.category} (${voter.classGroup}). Token ${cleanToken} ditandai terpakai.`,
        type: 'vote',
        timestamp: now
      };
      currentState.auditLogs.unshift(logItem);
      if (currentState.auditLogs.length > 200) {
        currentState.auditLogs = currentState.auditLogs.slice(0, 200);
      }

      persistState();

      // Broadcast update to all other devices immediately!
      broadcast('vote_cast', {
        state: currentState,
        newVote: voteRecord,
        receipt: {
          receiptNumber,
          timestamp: now,
          classGroup: voter.classGroup
        }
      });

      res.json({
        success: true,
        receipt: {
          receiptNumber,
          timestamp: now,
          classGroup: voter.classGroup
        }
      });
    } catch (err: unknown) {
      const error = err as Error;
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // POST reset endpoint
  app.post('/api/election/reset', (req: Request, res: Response) => {
    try {
      const { type } = req.body;
      const now = new Date().toISOString();

      if (type === 'default_sample') {
        const { tokens, votes } = generateInitialTokensAndVotes();
        currentState = {
          candidates: CANDIDATE_PAIRS,
          tokens,
          votes,
          settings: {
            ...INITIAL_SETTINGS,
            totalRegisteredVoters: tokens.length,
            tokenPrefix: 'S',
            tokenLength: 5,
            logoUrl: '/src/assets/images/logo_smpn50_jakarta_1792047092022.jpg'
          },
          auditLogs: [
            {
              id: `log-${Date.now()}`,
              action: 'Data Dipulihkan ke Simulasi Awal',
              details: 'Data paslon, token 5 digit, dan simulasi perolehan suara dipulihkan ke pengaturan awal.',
              timestamp: now,
              type: 'system'
            }
          ],
          timeline: INITIAL_TIMELINE,
          lastVoteTime: votes.length > 0 ? votes[votes.length - 1].timestamp : null
        };
      } else if (type === 'reset_votes_only') {
        currentState.tokens = currentState.tokens.map((t) => ({ ...t, isUsed: false, usedAt: undefined }));
        currentState.votes = [];
        currentState.lastVoteTime = null;
        currentState.auditLogs.unshift({
          id: `log-${Date.now()}`,
          action: 'Kotak Suara Dikosongkan',
          details: 'Seluruh perolehan suara direset ke 0 dan semua token dikembalikan menjadi Belum Digunakan.',
          timestamp: now,
          type: 'config'
        });
      } else if (type === 'reset_voters_empty') {
        currentState.tokens = [];
        currentState.votes = [];
        currentState.lastVoteTime = null;
        currentState.settings.totalRegisteredVoters = 0;
        currentState.auditLogs.unshift({
          id: `log-${Date.now()}`,
          action: 'DPT Dikosongkan (0 Pemilih)',
          details: 'Seluruh daftar pemilih (DPT) dikosongkan untuk persiapan input data baru.',
          timestamp: now,
          type: 'config'
        });
      } else if (type === 'reset_all') {
        currentState.tokens = currentState.tokens.map((t) => ({ ...t, isUsed: false, usedAt: undefined }));
        currentState.votes = [];
        currentState.lastVoteTime = null;
        currentState.auditLogs.unshift({
          id: `log-${Date.now()}`,
          action: 'Reset Total Pemilu',
          details: 'Seluruh hasil pemilihan dan status token direset oleh Panitia.',
          timestamp: now,
          type: 'config'
        });
      }

      persistState();
      broadcast('state_update', currentState);

      res.json({ success: true, data: currentState });
    } catch (err: unknown) {
      const error = err as Error;
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Vite middleware for development or static build for production
  if (!isProduction) {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false
      },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] Quick Count & E-Voting SMPN 50 running at http://0.0.0.0:${PORT} (Production: ${isProduction})`);
  });
}

startServer().catch((err) => {
  console.error('[Server] Failed to launch server:', err);
  process.exit(1);
});
