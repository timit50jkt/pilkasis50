import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { CandidatePair, ElectionSettings, VoterToken, VoteRecord, AuditLogItem, VoterCategory, TimelineItem } from '../types/election';
import { CANDIDATE_PAIRS, INITIAL_SETTINGS, generateInitialTokensAndVotes, INITIAL_TIMELINE } from '../data/initialData';
import { audioManager } from '../utils/audio';
import { initSupabaseClient, fetchAllFromSupabase, testSupabaseConnection, safeSupabaseOperation, getSupabaseCredentials, pushAllToSupabase, cleanSupabaseUrl } from '../utils/supabase';
import { generateUniqueToken } from '../utils/tokenGenerator';

const STORAGE_KEY = 'smpn50_election_store_v2';
const BROADCAST_NAME = 'smpn50_election_broadcast';

export interface CategoryStatItem {
  candidate1: number;
  candidate2: number;
  total: number;
  votesPerCandidate: Record<number, number>;
}

export interface ElectionStats {
  totalVotes: number;
  totalVoters: number;
  turnoutPercentage: number;
  votesPerCandidate: Record<number, number>;
  percentagePerCandidate: Record<number, number>;
  leaderCandidateId: number | null;
  margin: number;
  marginPercentage: number;
  byCategory: Record<string, CategoryStatItem>;
  byClass: Record<string, CategoryStatItem>;
}

export interface ElectionContextType {
  candidates: CandidatePair[];
  tokens: VoterToken[];
  votes: VoteRecord[];
  settings: ElectionSettings;
  auditLogs: AuditLogItem[];
  stats: ElectionStats;
  lastVoteTime: string | null;
  supabaseConnected: boolean;
  validateToken: (tokenString: string) => { isValid: boolean; error?: string; tokenData?: VoterToken };
  castVote: (tokenString: string, candidateId: number) => { success: boolean; error?: string; receipt?: { receiptNumber: string; timestamp: string; classGroup: string } };
  toggleElectionStatus: () => void;
  // Candidates Management
  updateCandidate: (updated: CandidatePair) => Promise<{ success: boolean; message: string }>;
  addCandidate: (candidate: CandidatePair) => Promise<{ success: boolean; message: string }>;
  deleteCandidate: (candidateId: number) => Promise<{ success: boolean; message: string }>;
  // Voter (DPT) Management
  addVoter: (voter: VoterToken) => void;
  updateVoter: (tokenStr: string, updated: Partial<VoterToken>) => void;
  deleteVoter: (tokenStr: string) => void;
  bulkDeleteVoters: (tokenStrings: string[]) => void;
  importVoters: (newVoters: VoterToken[], replaceAll?: boolean) => void;
  generateBatchTokens: (classGroup: string, category: VoterCategory, count: number) => VoterToken[];
  fixDuplicateTokens: () => number;
  // Simulation & Reset
  simulateVotes: (count: number) => void;
  resetAllElectionData: () => void;
  resetToDefaultSampleData: () => void;
  resetVotersList: () => void;
  resetTokensVoteStatus: () => void;
  // Settings, Security & Supabase
  updateSettings: (newSettings: Partial<ElectionSettings>) => void;
  validateAdminPassword: (attempt: string) => boolean;
  updateAdminPassword: (newPin: string) => { success: boolean; message: string };
  connectSupabase: (url: string, key: string) => Promise<{ success: boolean; message: string }>;
  disconnectSupabase: () => void;
  uploadToSupabase: () => Promise<{ success: boolean; message: string }>;
  refreshFromSupabase: () => Promise<{ success: boolean; message: string }>;
  addAuditLog: (action: string, details: string, type?: AuditLogItem['type']) => void;
  // Timeline Pilkasis Management
  timeline: TimelineItem[];
  addTimelineItem: (item: TimelineItem) => void;
  updateTimelineItem: (id: string, updated: Partial<TimelineItem>) => void;
  deleteTimelineItem: (id: string) => void;
  reorderTimeline: (startIndex: number, endIndex: number) => void;
  resetTimelineToDefault: () => void;
}

const ElectionContext = createContext<ElectionContextType | undefined>(undefined);


export const ElectionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [candidates, setCandidates] = useState<CandidatePair[]>(() => {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY}_candidates`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }
    return CANDIDATE_PAIRS;
  });

  const [tokens, setTokens] = useState<VoterToken[]>(() => {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY}_tokens`);
      if (stored) {
        const parsed = JSON.parse(stored) as VoterToken[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Check for old formats or duplicates
          const seen = new Set<string>();
          let hasDuplicatesOrOld = false;
          for (const t of parsed) {
            const raw = (t.token || '').trim().toUpperCase();
            if (!raw || raw.includes('-') || raw.includes('SMP50') || raw.length > 5 || seen.has(raw)) {
              hasDuplicatesOrOld = true;
              break;
            }
            seen.add(raw);
          }

          if (hasDuplicatesOrOld) {
            const usedSet = new Set<string>();
            const classCounts: Record<string, number> = {};
            return parsed.map((t) => {
              const cleanToken = (t.token || '').trim().toUpperCase();
              if (
                cleanToken &&
                !cleanToken.includes('-') &&
                !cleanToken.includes('SMP50') &&
                cleanToken.length === 5 &&
                !usedSet.has(cleanToken)
              ) {
                usedSet.add(cleanToken);
                return { ...t, token: cleanToken };
              }

              const cat = t.category || 'Siswa';
              let pfx = 'S';
              let code = '7A';
              if (cat === 'Guru' || (t.classGroup || '').toUpperCase().includes('GURU')) {
                pfx = 'G';
                code = '50';
              } else if (cat === 'Tata Usaha' || (t.classGroup || '').toUpperCase().includes('TU')) {
                pfx = 'T';
                code = '50';
              } else if (
                cat === 'Tendik' ||
                (t.classGroup || '').toUpperCase().includes('TENDIK') ||
                (t.classGroup || '').toUpperCase().includes('STAF')
              ) {
                pfx = 'K';
                code = '50';
              } else {
                pfx = 'S';
                const clean = (t.classGroup || '7A').replace(/[^A-Z0-9]/gi, '').toUpperCase();
                code = clean.slice(0, 2) || '7A';
              }

              const key = `${pfx}${code}`;
              classCounts[key] = (classCounts[key] || 0) + 1;
              let numVal = classCounts[key];
              let newToken = `${pfx}${code}${String(numVal).padStart(2, '0')}`.toUpperCase().slice(0, 5);

              while (usedSet.has(newToken)) {
                numVal++;
                newToken = `${pfx}${code}${String(numVal).padStart(2, '0')}`.toUpperCase().slice(0, 5);
              }
              usedSet.add(newToken);

              return {
                ...t,
                token: newToken
              };
            });
          }
          return parsed;
        }
      }
    } catch {
      // fallback
    }
    const initial = generateInitialTokensAndVotes();
    return initial.tokens;
  });

  const [votes, setVotes] = useState<VoteRecord[]>(() => {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY}_votes`);
      if (stored) return JSON.parse(stored);
    } catch {
      // fallback
    }
    const initial = generateInitialTokensAndVotes();
    return initial.votes;
  });

  const [settings, setSettings] = useState<ElectionSettings>(() => {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY}_settings`);
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          ...parsed,
          tokenPrefix: parsed.tokenPrefix && !parsed.tokenPrefix.includes('SMP50') ? parsed.tokenPrefix : 'S',
          tokenLength: 5,
          totalRegisteredVoters: tokens.length
        };
      }
    } catch {
      // fallback
    }
    return {
      ...INITIAL_SETTINGS,
      tokenPrefix: 'S',
      tokenLength: 5,
      totalRegisteredVoters: tokens.length,
      logoUrl: '/src/assets/images/logo_smpn50_jakarta_1792047092022.jpg'
    };
  });

  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>(() => {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY}_logs`);
      if (stored) return JSON.parse(stored);
    } catch {
      // fallback
    }
    return [
      {
        id: 'log-0',
        action: 'Sistem Diinisialisasi',
        timestamp: new Date().toISOString(),
        details: 'Sistem Quick Count & E-Voting SMPN 50 Jakarta aktif.',
        type: 'system'
      }
    ];
  });

  const [timeline, setTimeline] = useState<TimelineItem[]>(() => {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY}_timeline`);
      if (stored) return JSON.parse(stored);
    } catch {
      // fallback
    }
    return INITIAL_TIMELINE;
  });

  const [supabaseConnected, setSupabaseConnected] = useState(false);
  const [lastVoteTime, setLastVoteTime] = useState<string | null>(() => {
    return votes.length > 0 ? votes[votes.length - 1].timestamp : null;
  });
  const localCandidateModifiedTimeRef = useRef<number>(0);
  const localTimelineModifiedTimeRef = useRef<number>(0);
  const candidatesRef = useRef<CandidatePair[]>(candidates);
  const timelineRef = useRef<TimelineItem[]>(timeline);
  const tokensRef = useRef<VoterToken[]>(tokens);
  const votesRef = useRef<VoteRecord[]>(votes);
  const settingsRef = useRef<ElectionSettings>(settings);
  const auditLogsRef = useRef<AuditLogItem[]>(auditLogs);

  useEffect(() => { candidatesRef.current = candidates; }, [candidates]);
  useEffect(() => { timelineRef.current = timeline; }, [timeline]);
  useEffect(() => { tokensRef.current = tokens; }, [tokens]);
  useEffect(() => { votesRef.current = votes; }, [votes]);
  useEffect(() => { settingsRef.current = settings; }, [settings]);
  useEffect(() => { auditLogsRef.current = auditLogs; }, [auditLogs]);

  // LocalStorage Persistence
  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY}_candidates`, JSON.stringify(candidates));
      localStorage.setItem(`${STORAGE_KEY}_tokens`, JSON.stringify(tokens));
      localStorage.setItem(`${STORAGE_KEY}_votes`, JSON.stringify(votes));
      localStorage.setItem(`${STORAGE_KEY}_settings`, JSON.stringify(settings));
      localStorage.setItem(`${STORAGE_KEY}_logs`, JSON.stringify(auditLogs));
      localStorage.setItem(`${STORAGE_KEY}_timeline`, JSON.stringify(timeline));
    } catch {
      // ignore
    }
  }, [candidates, tokens, votes, settings, auditLogs, timeline]);

  // Keep settings.totalRegisteredVoters strictly synchronized with tokens.length (ensuring DPT matches exact voter list)
  useEffect(() => {
    if (settings.totalRegisteredVoters !== tokens.length) {
      setSettings((prev) => ({ ...prev, totalRegisteredVoters: tokens.length }));
    }
  }, [tokens.length, settings.totalRegisteredVoters]);

  // Attempt to load Supabase if configured in env, url params, or settings
  useEffect(() => {
    const creds = getSupabaseCredentials(settings.supabaseUrl, settings.supabaseAnonKey);
    const client = initSupabaseClient(creds.url, creds.key);
    if (!client) {
      setSupabaseConnected(false);
      return;
    }

    let isMounted = true;

    // Helper to apply fetched data
    const applyRemoteData = (data: NonNullable<Awaited<ReturnType<typeof fetchAllFromSupabase>>>) => {
      if (!isMounted) return;
      setSupabaseConnected(true);
      const isRecentlyModified = Date.now() - localCandidateModifiedTimeRef.current < 30000;
      if (!isRecentlyModified && data.candidates && data.candidates.length > 0) {
        setCandidates(data.candidates);
      }
      if (data.tokens && data.tokens.length > 0) setTokens(data.tokens);
      if (data.votes) setVotes(data.votes);
      if (data.settings) {
        setSettings((prev) => ({
          ...prev,
          ...data.settings,
          supabaseUrl: creds.url,
          supabaseAnonKey: creds.key,
          useSupabase: true
        }));
      }
      if (data.auditLogs && data.auditLogs.length > 0) setAuditLogs(data.auditLogs);
      if (data.timeline && data.timeline.length > 0) setTimeline(data.timeline);
    };

    fetchAllFromSupabase(client)
      .then((data) => {
        if (!isMounted || !data) return;
        applyRemoteData(data);
      })
      .catch((err) => {
        console.warn('Could not fetch Supabase data:', err);
      });

    // Realtime subscription across all tables
    let channel: ReturnType<typeof client.channel> | null = null;
    try {
      channel = client
        .channel('schema-db-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'votes' }, () => {
          fetchAllFromSupabase(client).then((d) => {
            if (d?.votes) {
              setVotes(d.votes);
              setLastVoteTime(new Date().toISOString());
              audioManager.playVoteBlip();
            }
          });
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'voters' }, () => {
          fetchAllFromSupabase(client).then((d) => {
            if (d?.tokens) setTokens(d.tokens);
          });
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'candidates' }, () => {
          const isRecentlyModified = Date.now() - localCandidateModifiedTimeRef.current < 10000;
          if (!isRecentlyModified) {
            fetchAllFromSupabase(client).then((d) => {
              if (d?.candidates && d.candidates.length > 0) setCandidates(d.candidates);
            });
          }
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'settings' }, () => {
          fetchAllFromSupabase(client).then((d) => {
            if (d?.settings) {
              setSettings((prev) => ({ ...prev, ...d.settings }));
            }
          });
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'timeline' }, () => {
          fetchAllFromSupabase(client).then((d) => {
            if (d?.timeline && d.timeline.length > 0) setTimeline(d.timeline);
          });
        })
        .subscribe();
    } catch (err) {
      console.warn('Realtime subscription skipped:', err);
    }

    // Mobile resilience: Re-fetch on tab focus or screen unlock
    const handleFocusOrVisible = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        fetchAllFromSupabase(client).then((d) => {
          if (d) applyRemoteData(d);
        });
      }
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('focus', handleFocusOrVisible);
      document.addEventListener('visibilitychange', handleFocusOrVisible);
    }

    // Periodic sync every 7 seconds for mobile browser resilience
    const intervalTimer = setInterval(() => {
      fetchAllFromSupabase(client).then((d) => {
        if (d) applyRemoteData(d);
      });
    }, 7000);

    return () => {
      isMounted = false;
      clearInterval(intervalTimer);
      if (typeof window !== 'undefined') {
        window.removeEventListener('focus', handleFocusOrVisible);
        document.removeEventListener('visibilitychange', handleFocusOrVisible);
      }
      if (channel) {
        try {
          client.removeChannel(channel);
        } catch {
          // ignore
        }
      }
    };
  }, [settings.supabaseUrl, settings.supabaseAnonKey]);

  // Sync state to backend server so changes immediately propagate to HP, tablets & other computers
  const syncToServer = useCallback(
    (payload: {
      candidates?: CandidatePair[];
      tokens?: VoterToken[];
      votes?: VoteRecord[];
      settings?: ElectionSettings;
      auditLogs?: AuditLogItem[];
      timeline?: TimelineItem[];
      lastVoteTime?: string | null;
    }) => {
      try {
        fetch('/api/election/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }).catch((err) => {
          console.warn('[Sync] Server sync warning:', err);
        });
      } catch {
        // ignore
      }
    },
    []
  );

  // Broadcast updates to other browser tabs AND to backend server (reaches any device)
  const broadcastUpdate = useCallback(
    (
      newCandidates?: CandidatePair[],
      newTokens?: VoterToken[],
      newVotes?: VoteRecord[],
      newSettings?: ElectionSettings,
      newLogs?: AuditLogItem[],
      newTimeline?: TimelineItem[]
    ) => {
      const c = newCandidates ?? candidatesRef.current;
      const t = newTokens ?? tokensRef.current;
      const v = newVotes ?? votesRef.current;
      const s = newSettings ?? settingsRef.current;
      const l = newLogs ?? auditLogsRef.current;
      const tm = newTimeline ?? timelineRef.current;

      // 1. Cross-tab BroadcastChannel on same browser
      if (typeof window !== 'undefined' && window.BroadcastChannel) {
        try {
          const channel = new BroadcastChannel(BROADCAST_NAME);
          channel.postMessage({
            type: 'SYNC_STATE',
            payload: {
              newCandidates: c,
              newTokens: t,
              newVotes: v,
              newSettings: s,
              newLogs: l,
              newTimeline: tm,
              timestamp: new Date().toISOString()
            }
          });
          channel.close();
        } catch {
          // ignore
        }
      }

      // 2. Real-Time Multi-Device push to server (reaches HP, tablets, laptops instantly)
      const payload: Record<string, unknown> = {
        candidates: c,
        tokens: t,
        votes: v,
        settings: s,
        auditLogs: l,
        lastVoteTime: v.length > 0 ? v[v.length - 1].timestamp : null
      };

      // CRITICAL: Only include timeline when it was explicitly modified to prevent stale overwrites from other devices
      if (newTimeline) {
        payload.timeline = newTimeline;
        payload.isTimelineExplicitUpdate = true;
      }

      syncToServer(payload);
    },
    [syncToServer]
  );

  // Real-Time Multi-Device Sync via Server (SSE + initial state fetch + background fallback poll)
  useEffect(() => {
    let isMounted = true;

    const fetchServerState = async () => {
      try {
        const res = await fetch('/api/election/state');
        if (!res.ok) return;
        const resJson = await res.json();
        if (resJson.success && resJson.data && isMounted) {
          const d = resJson.data;
          const isRecentlyModified = Date.now() - localCandidateModifiedTimeRef.current < 45000;
          if (!isRecentlyModified && d.candidates && Array.isArray(d.candidates) && d.candidates.length > 0) {
            candidatesRef.current = d.candidates;
            setCandidates(d.candidates);
          }
          if (d.tokens && Array.isArray(d.tokens)) {
            tokensRef.current = d.tokens;
            setTokens(d.tokens);
          }
          if (d.votes && Array.isArray(d.votes)) {
            votesRef.current = d.votes;
            setVotes(d.votes);
          }
          if (d.settings) {
            settingsRef.current = d.settings;
            setSettings(d.settings);
          }
          if (d.auditLogs && Array.isArray(d.auditLogs)) {
            auditLogsRef.current = d.auditLogs;
            setAuditLogs(d.auditLogs);
          }
          const isTimelineRecentlyModified = Date.now() - localTimelineModifiedTimeRef.current < 2000;
          if (!isTimelineRecentlyModified && d.timeline && Array.isArray(d.timeline) && d.timeline.length > 0) {
            timelineRef.current = d.timeline;
            setTimeline(d.timeline);
            try {
              localStorage.setItem(`${STORAGE_KEY}_timeline`, JSON.stringify(d.timeline));
            } catch {
              // ignore
            }
          }
          if (d.lastVoteTime !== undefined) setLastVoteTime(d.lastVoteTime);
        }
      } catch (err) {
        console.warn('Initial server state fetch failed:', err);
      }
    };

    fetchServerState();

    // 10-second polling fallback to guarantee 100% sync even on sleep/lock screen mobile devices
    const pollInterval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchServerState();
      }
    }, 10000);

    // Setup Server-Sent Events (SSE) for Real-Time Multi-Device updates (<50ms)
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource('/api/election/events');

      eventSource.addEventListener('state_update', (e: MessageEvent) => {
        try {
          const updated = JSON.parse(e.data);
          if (!updated || !isMounted) return;
          const isRecentlyModified = Date.now() - localCandidateModifiedTimeRef.current < 45000;
          if (!isRecentlyModified && updated.candidates && Array.isArray(updated.candidates) && updated.candidates.length > 0) {
            candidatesRef.current = updated.candidates;
            setCandidates(updated.candidates);
          }
          if (updated.tokens && Array.isArray(updated.tokens)) {
            tokensRef.current = updated.tokens;
            setTokens(updated.tokens);
          }
          if (updated.votes && Array.isArray(updated.votes)) {
            votesRef.current = updated.votes;
            setVotes(updated.votes);
          }
          if (updated.settings) {
            settingsRef.current = updated.settings;
            setSettings(updated.settings);
          }
          if (updated.auditLogs && Array.isArray(updated.auditLogs)) {
            auditLogsRef.current = updated.auditLogs;
            setAuditLogs(updated.auditLogs);
          }
          const isTimelineRecentlyModified = Date.now() - localTimelineModifiedTimeRef.current < 2000;
          if (!isTimelineRecentlyModified && updated.timeline && Array.isArray(updated.timeline) && updated.timeline.length > 0) {
            timelineRef.current = updated.timeline;
            setTimeline(updated.timeline);
            try {
              localStorage.setItem(`${STORAGE_KEY}_timeline`, JSON.stringify(updated.timeline));
            } catch {
              // ignore
            }
          }
          if (updated.lastVoteTime !== undefined) setLastVoteTime(updated.lastVoteTime);
        } catch {
          // ignore
        }
      });

      eventSource.addEventListener('vote_cast', (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data);
          if (!data || !isMounted) return;
          if (data.state) {
            if (data.state.tokens) {
              tokensRef.current = data.state.tokens;
              setTokens(data.state.tokens);
            }
            if (data.state.votes) {
              votesRef.current = data.state.votes;
              setVotes(data.state.votes);
            }
            if (data.state.auditLogs) {
              auditLogsRef.current = data.state.auditLogs;
              setAuditLogs(data.state.auditLogs);
            }
            if (data.state.lastVoteTime !== undefined) setLastVoteTime(data.state.lastVoteTime);
          }
          audioManager.playVoteBlip();
        } catch {
          // ignore
        }
      });
    } catch (err) {
      console.warn('EventSource connection error:', err);
    }

    // Auto-refresh when user switches back to browser, unlocks phone screen, or comes online
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchServerState();
      }
    };
    const onOnline = () => {
      fetchServerState();
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('online', onOnline);

    // Cross-tab broadcast listener (for same browser)
    let localChannel: BroadcastChannel | null = null;
    if (typeof window !== 'undefined' && window.BroadcastChannel) {
      localChannel = new BroadcastChannel(BROADCAST_NAME);
      localChannel.onmessage = (event) => {
        if (event.data && event.data.type === 'SYNC_STATE' && isMounted) {
          const { newCandidates, newTokens, newVotes, newSettings, newLogs, newTimeline, timestamp } = event.data.payload;
          if (newCandidates) {
            candidatesRef.current = newCandidates;
            setCandidates(newCandidates);
          }
          if (newTokens) {
            tokensRef.current = newTokens;
            setTokens(newTokens);
          }
          if (newVotes) {
            votesRef.current = newVotes;
            setVotes(newVotes);
            setLastVoteTime(timestamp || new Date().toISOString());
            audioManager.playVoteBlip();
          }
          if (newSettings) {
            settingsRef.current = newSettings;
            setSettings(newSettings);
          }
          if (newLogs) {
            auditLogsRef.current = newLogs;
            setAuditLogs(newLogs);
          }
          if (newTimeline) {
            timelineRef.current = newTimeline;
            setTimeline(newTimeline);
          }
        }
      };
    }

    return () => {
      isMounted = false;
      clearInterval(pollInterval);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('online', onOnline);
      if (eventSource) {
        eventSource.close();
      }
      if (localChannel) {
        localChannel.close();
      }
    };
  }, []);

  const addAuditLog = useCallback((action: string, details: string, type: AuditLogItem['type'] = 'system') => {
    const newItem: AuditLogItem = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      action,
      details,
      timestamp: new Date().toISOString(),
      type
    };
    setAuditLogs((prev) => [newItem, ...prev].slice(0, 100));

    // Push log to Supabase if connected
    const client = initSupabaseClient();
    if (client) {
      safeSupabaseOperation(
        client.from('audit_logs').insert([{
          id: newItem.id,
          action: newItem.action,
          details: newItem.details,
          type: newItem.type,
          timestamp: newItem.timestamp
        }])
      );
    }
  }, []);

  // Validate Token (Flexible 5-digit matching without hyphens, e.g. S7A01)
  const validateToken = useCallback(
    (rawToken: string) => {
      const cleanToken = (rawToken || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');

      if (!cleanToken) {
        return { isValid: false, error: 'Silakan masukkan kode token 5 digit Anda (contoh: S7A01).' };
      }

      if (!settings.isOpen) {
        return {
          isValid: false,
          error: 'Pemungutan suara saat ini sedang DITUTUP oleh Panitia Pemilihan SMPN 50 Jakarta.'
        };
      }

      const found = tokens.find(
        (t) =>
          t.token.toUpperCase().replace(/[^A-Z0-9]/g, '') === cleanToken ||
          t.token.toUpperCase() === rawToken.trim().toUpperCase()
      );
      if (!found) {
        return {
          isValid: false,
          error: `Token "${rawToken.trim().toUpperCase()}" tidak terdaftar dalam DPT SMPN 50 Jakarta. Harap periksa kembali token Anda atau hubungi panitia MPK.`
        };
      }

      if (found.isUsed) {
        const timeFormatted = found.usedAt
          ? new Date(found.usedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
          : 'sebelumnya';
        return {
          isValid: false,
          error: `Token ini SUDAH DIGUNAKAN untuk memilih pada pukul ${timeFormatted} WIB. Setiap pemilih hanya dapat memilih satu kali.`
        };
      }

      return { isValid: true, tokenData: found };
    },
    [tokens, settings.isOpen]
  );

  // Cast Vote
  const castVote = useCallback(
    (rawToken: string, candidateId: number) => {
      const validation = validateToken(rawToken);
      if (!validation.isValid || !validation.tokenData) {
        audioManager.playError();
        return { success: false, error: validation.error };
      }

      const tokenData = validation.tokenData;

      // Atomic server vote call for real-time multi-device synchronization
      try {
        fetch('/api/election/vote', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tokenString: tokenData.token, candidateId })
        }).catch((err) => {
          console.warn('[Vote] Server call notice:', err);
        });
      } catch {
        // ignore
      }

      const nowIso = new Date().toISOString();
      const receiptNumber = `BUKTI-50-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

      const updatedTokens = tokens.map((t) => {
        if (t.token.toUpperCase() === tokenData.token.toUpperCase()) {
          return { ...t, isUsed: true, usedAt: nowIso };
        }
        return t;
      });

      const newVoteRecord: VoteRecord = {
        id: `vote-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        candidateId,
        voterCategory: tokenData.category,
        classGroup: tokenData.classGroup,
        timestamp: nowIso
      };

      const updatedVotes = [...votes, newVoteRecord];

      const newLogItem: AuditLogItem = {
        id: `log-${Date.now()}`,
        action: 'Hak Suara Diberikan',
        details: `Satu suara sah diterima dari kategori ${tokenData.category} (${tokenData.classGroup}). Token ditandai terpakai.`,
        timestamp: nowIso,
        type: 'vote'
      };
      const updatedLogs = [newLogItem, ...auditLogs].slice(0, 100);

      setTokens(updatedTokens);
      setVotes(updatedVotes);
      setAuditLogs(updatedLogs);
      setLastVoteTime(nowIso);

      audioManager.playVoteSuccess();
      broadcastUpdate(candidates, updatedTokens, updatedVotes, settings, updatedLogs);

      // Push to Supabase if connected
      const client = initSupabaseClient();
      if (client) {
        safeSupabaseOperation(
          client.from('voters').update({ is_used: true, used_at: nowIso }).eq('token', tokenData.token)
        );
        safeSupabaseOperation(
          client.from('votes').insert([{
            id: newVoteRecord.id,
            candidate_id: newVoteRecord.candidateId,
            voter_category: newVoteRecord.voterCategory,
            class_group: newVoteRecord.classGroup,
            timestamp: newVoteRecord.timestamp
          }])
        );
      }

      return {
        success: true,
        receipt: {
          receiptNumber,
          timestamp: nowIso,
          classGroup: tokenData.classGroup
        }
      };
    },
    [tokens, votes, settings, auditLogs, candidates, validateToken, broadcastUpdate]
  );

  // Toggle Election Status
  const toggleElectionStatus = useCallback(() => {
    setSettings((prev) => {
      const newSettings = { ...prev, isOpen: !prev.isOpen };
      addAuditLog('Status Pemilihan Diubah', `Status pemungutan suara diubah menjadi ${newSettings.isOpen ? 'DIBUKA' : 'DITUTUP'}.`, 'config');
      broadcastUpdate(candidates, tokens, votes, newSettings, auditLogs);

      const client = initSupabaseClient();
      if (client) {
        safeSupabaseOperation(
          client.from('settings').update({ is_open: newSettings.isOpen, updated_at: new Date().toISOString() }).eq('id', 'main')
        );
      }

      return newSettings;
    });
  }, [candidates, tokens, votes, auditLogs, addAuditLog, broadcastUpdate]);

  // Candidate Management
  const updateCandidate = useCallback(
    async (updated: CandidatePair): Promise<{ success: boolean; message: string }> => {
      localCandidateModifiedTimeRef.current = Date.now();

      const prev = candidatesRef.current;
      const nextCandidates = prev.map((c) => (c.id === updated.id ? updated : c));
      candidatesRef.current = nextCandidates;
      setCandidates(nextCandidates);

      // Synchronously write to LocalStorage
      try {
        localStorage.setItem(`${STORAGE_KEY}_candidates`, JSON.stringify(nextCandidates));
        localStorage.setItem(`${STORAGE_KEY}_candidates_modified_at`, String(Date.now()));
      } catch (err) {
        console.warn('LocalStorage candidate write warning:', err);
      }

      addAuditLog(
        'Profil Paslon Diperbarui',
        `Data dan program kerja Paslon No. ${updated.number} (${updated.chairman.name}) berhasil diperbarui oleh Panitia.`,
        'config'
      );

      broadcastUpdate(nextCandidates, tokens, votes, settings, auditLogs);

      // Push to backend server
      try {
        await fetch('/api/election/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ candidates: nextCandidates })
        });
      } catch (err) {
        console.warn('[Sync] Candidate server sync warning:', err);
      }

      // Direct push to Supabase if connected
      const client = initSupabaseClient();
      if (client) {
        try {
          const { error } = await client.from('candidates').upsert({
            id: updated.id,
            number: updated.number,
            chairman: updated.chairman,
            vice_chairman: updated.viceChairman,
            tagline: updated.tagline,
            poster_image: updated.posterImage,
            color: updated.color,
            vision: updated.vision,
            missions: updated.missions,
            work_programs: updated.workPrograms,
            updated_at: new Date().toISOString()
          });
          if (error) {
            console.error('[Supabase] Candidate upsert error:', error);
          }
        } catch (sbErr) {
          console.warn('[Supabase] Candidate update error:', sbErr);
        }
      }

      return {
        success: true,
        message: `Data Paslon No. ${updated.number} (${updated.chairman.name}) berhasil disimpan!`
      };
    },
    [tokens, votes, settings, auditLogs, addAuditLog, broadcastUpdate]
  );

  const addCandidate = useCallback(
    async (newCand: CandidatePair): Promise<{ success: boolean; message: string }> => {
      localCandidateModifiedTimeRef.current = Date.now();

      const prev = candidatesRef.current;
      const nextCandidates = [...prev, newCand];
      candidatesRef.current = nextCandidates;
      setCandidates(nextCandidates);

      try {
        localStorage.setItem(`${STORAGE_KEY}_candidates`, JSON.stringify(nextCandidates));
        localStorage.setItem(`${STORAGE_KEY}_candidates_modified_at`, String(Date.now()));
      } catch (err) {
        console.warn('LocalStorage candidate write warning:', err);
      }

      addAuditLog(
        'Paslon Baru Ditambahkan',
        `Pasangan Calon No. ${newCand.number} (${newCand.chairman.name}) ditambahkan oleh Panitia.`,
        'config'
      );

      broadcastUpdate(nextCandidates, tokens, votes, settings, auditLogs);

      try {
        await fetch('/api/election/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ candidates: nextCandidates })
        });
      } catch (err) {
        console.warn('[Sync] Candidate server sync warning:', err);
      }

      const client = initSupabaseClient();
      if (client) {
        try {
          await client.from('candidates').upsert({
            id: newCand.id,
            number: newCand.number,
            chairman: newCand.chairman,
            vice_chairman: newCand.viceChairman,
            tagline: newCand.tagline,
            poster_image: newCand.posterImage,
            color: newCand.color,
            vision: newCand.vision,
            missions: newCand.missions,
            work_programs: newCand.workPrograms,
            updated_at: new Date().toISOString()
          });
        } catch (err) {
          console.warn('[Supabase] Candidate add error:', err);
        }
      }

      return {
        success: true,
        message: `Paslon No. ${newCand.number} berhasil ditambahkan!`
      };
    },
    [tokens, votes, settings, auditLogs, addAuditLog, broadcastUpdate]
  );

  const deleteCandidate = useCallback(
    async (candId: number): Promise<{ success: boolean; message: string }> => {
      localCandidateModifiedTimeRef.current = Date.now();

      const prev = candidatesRef.current;
      const nextCandidates = prev.filter((c) => c.id !== candId);
      candidatesRef.current = nextCandidates;
      setCandidates(nextCandidates);

      try {
        localStorage.setItem(`${STORAGE_KEY}_candidates`, JSON.stringify(nextCandidates));
        localStorage.setItem(`${STORAGE_KEY}_candidates_modified_at`, String(Date.now()));
      } catch (err) {
        console.warn('LocalStorage candidate write warning:', err);
      }

      addAuditLog(
        'Paslon Dihapus',
        `Pasangan Calon dengan ID ${candId} telah dihapus dari sistem.`,
        'config'
      );

      broadcastUpdate(nextCandidates, tokens, votes, settings, auditLogs);

      try {
        await fetch('/api/election/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ candidates: nextCandidates })
        });
      } catch (err) {
        console.warn('[Sync] Candidate server sync warning:', err);
      }

      const client = initSupabaseClient();
      if (client) {
        try {
          await client.from('candidates').delete().eq('id', candId);
        } catch (err) {
          console.warn('[Supabase] Candidate delete error:', err);
        }
      }

      return {
        success: true,
        message: 'Paslon berhasil dihapus.'
      };
    },
    [tokens, votes, settings, auditLogs, addAuditLog, broadcastUpdate]
  );

  // Voter Management
  const addVoter = useCallback(
    (newVoter: VoterToken) => {
      setTokens((prev) => {
        const next = [newVoter, ...prev];
        addAuditLog('Pemilih Baru Ditambahkan', `Token ${newVoter.token} (${newVoter.voterName || newVoter.classGroup}) ditambahkan ke DPT.`, 'token');
        broadcastUpdate(candidates, next, votes, settings, auditLogs);

        const client = initSupabaseClient();
        if (client) {
          safeSupabaseOperation(
            client.from('voters').upsert({
              token: newVoter.token,
              voter_name: newVoter.voterName,
              class_group: newVoter.classGroup,
              category: newVoter.category,
              is_used: newVoter.isUsed,
              used_at: newVoter.usedAt,
              created_at: new Date().toISOString()
            })
          );
        }

        return next;
      });
    },
    [candidates, votes, settings, auditLogs, addAuditLog, broadcastUpdate]
  );

  const updateVoter = useCallback(
    (tokenStr: string, updated: Partial<VoterToken>) => {
      setTokens((prev) => {
        const next = prev.map((t) => (t.token === tokenStr ? { ...t, ...updated } : t));
        addAuditLog(
          'Data Pemilih Diubah',
          `Informasi pemilih ${tokenStr} telah disesuaikan${updated.token && updated.token !== tokenStr ? ` (Token baru: ${updated.token})` : ''}.`,
          'token'
        );
        broadcastUpdate(candidates, next, votes, settings, auditLogs);

        const client = initSupabaseClient();
        if (client) {
          const match = next.find((t) => (updated.token ? t.token === updated.token : t.token === tokenStr));
          if (match) {
            safeSupabaseOperation(
              client.from('voters').update({
                token: match.token,
                voter_name: match.voterName,
                class_group: match.classGroup,
                category: match.category,
                is_used: match.isUsed,
                used_at: match.usedAt
              }).eq('token', tokenStr)
            );
          }
        }

        return next;
      });
    },
    [candidates, votes, settings, auditLogs, addAuditLog, broadcastUpdate]
  );

  const deleteVoter = useCallback(
    (tokenStr: string) => {
      setTokens((prev) => {
        const next = prev.filter((t) => t.token !== tokenStr);
        addAuditLog('Pemilih Dihapus', `Token ${tokenStr} telah dihapus dari DPT.`, 'token');
        broadcastUpdate(candidates, next, votes, settings, auditLogs);

        const client = initSupabaseClient();
        if (client) {
          safeSupabaseOperation(
            client.from('voters').delete().eq('token', tokenStr)
          );
        }

        return next;
      });
    },
    [candidates, votes, settings, auditLogs, addAuditLog, broadcastUpdate]
  );

  const bulkDeleteVoters = useCallback(
    (tokenStrings: string[]) => {
      setTokens((prev) => {
        const setDel = new Set(tokenStrings);
        const next = prev.filter((t) => !setDel.has(t.token));
        addAuditLog('Hapus DPT Massal', `Sebanyak ${tokenStrings.length} pemilih telah dihapus dari sistem.`, 'token');
        broadcastUpdate(candidates, next, votes, settings, auditLogs);

        const client = initSupabaseClient();
        if (client) {
          safeSupabaseOperation(
            client.from('voters').delete().in('token', tokenStrings)
          );
        }

        return next;
      });
    },
    [candidates, votes, settings, auditLogs, addAuditLog, broadcastUpdate]
  );

  const importVoters = useCallback(
    (newVoters: VoterToken[], replaceAll: boolean = false) => {
      setTokens((prev) => {
        let next: VoterToken[];
        if (replaceAll) {
          next = newVoters;
          addAuditLog('DPT Disinkronkan Penuh', `Seluruh DPT disinkronkan dengan ${newVoters.length} pemilih baru dari file/tabel.`, 'token');
        } else {
          // Dedup by token
          const existingTokens = new Set(prev.map((t) => t.token));
          const filteredNew = newVoters.filter((nv) => !existingTokens.has(nv.token));
          next = [...prev, ...filteredNew];
          addAuditLog('Import DPT Berhasil', `Berhasil menambahkan ${filteredNew.length} pemilih baru ke DPT.`, 'token');
        }

        // Also update totalRegisteredVoters in settings so quick count calculation is immediately synced!
        setSettings((prevSettings) => ({
          ...prevSettings,
          totalRegisteredVoters: next.length
        }));

        broadcastUpdate(candidates, next, votes, settings, auditLogs);

        const client = initSupabaseClient();
        if (client) {
          if (replaceAll) {
            safeSupabaseOperation(client.from('voters').delete().neq('token', 'placeholder'));
          }
          if (next.length > 0) {
            const rows = (replaceAll ? next : newVoters).map((nv) => ({
              token: nv.token,
              voter_name: nv.voterName,
              class_group: nv.classGroup,
              category: nv.category,
              is_used: nv.isUsed || false,
              created_at: new Date().toISOString()
            }));
            safeSupabaseOperation(client.from('voters').upsert(rows));
          }
        }

        return next;
      });
    },
    [candidates, votes, settings, auditLogs, addAuditLog, broadcastUpdate]
  );

  const generateBatchTokens = useCallback(
    (classGroup: string, category: VoterCategory, count: number): VoterToken[] => {
      const newTokens: VoterToken[] = [];
      const cleanGroup = (classGroup || '').replace(/[^A-Z0-9]/gi, '').toUpperCase() || '7A';
      const existingTokensSet = new Set(tokens.map((t) => t.token));

      for (let i = 1; i <= count; i++) {
        const uniqueTokenStr = generateUniqueToken(
          cleanGroup,
          category,
          existingTokensSet,
          settings.tokenPrefix || 'S',
          i
        );
        newTokens.push({
          token: uniqueTokenStr,
          voterName: `${category} - ${cleanGroup} #${i}`,
          classGroup: cleanGroup,
          category,
          isUsed: false
        });
      }

      setTokens((prev) => {
        const merged = [...prev, ...newTokens];
        addAuditLog('Token Dibuat', `Berhasil membuat ${count} token baru untuk ${category} (${cleanGroup}).`, 'token');
        broadcastUpdate(candidates, merged, votes, settings, auditLogs);

        const client = initSupabaseClient();
        if (client) {
          const rows = newTokens.map((nv) => ({
            token: nv.token,
            voter_name: nv.voterName,
            class_group: nv.classGroup,
            category: nv.category,
            is_used: false,
            created_at: new Date().toISOString()
          }));
          safeSupabaseOperation(
            client.from('voters').upsert(rows)
          );
        }

        return merged;
      });

      return newTokens;
    },
    [candidates, votes, settings, auditLogs, addAuditLog, broadcastUpdate]
  );

  // Scan and fix any duplicate tokens in current DPT
  const fixDuplicateTokens = useCallback((): number => {
    let fixedCount = 0;
    const usedSet = new Set<string>();
    const classCounters: Record<string, number> = {};

    const updatedTokens = tokens.map((t) => {
      const clean = (t.token || '').trim().toUpperCase();
      if (clean && !clean.includes('-') && !clean.includes('SMP50') && clean.length === 5 && !usedSet.has(clean)) {
        usedSet.add(clean);
        return { ...t, token: clean };
      }

      fixedCount++;
      const cat = t.category || 'Siswa';
      const grp = (t.classGroup || '7A').toUpperCase();
      classCounters[grp] = (classCounters[grp] || 0) + 1;
      const newToken = generateUniqueToken(grp, cat, usedSet, settings.tokenPrefix || 'S', classCounters[grp]);
      usedSet.add(newToken);
      return {
        ...t,
        token: newToken
      };
    });

    if (fixedCount > 0) {
      setTokens(updatedTokens);
      broadcastUpdate(candidates, updatedTokens, votes, settings, auditLogs);
      try {
        localStorage.setItem(`${STORAGE_KEY}_tokens`, JSON.stringify(updatedTokens));
      } catch {
        // ignore
      }
      addAuditLog(
        'Perbaikan Token Duplikat',
        `Sistem berhasil memperbaiki ${fixedCount} token duplikat menjadi token 5 digit yang 100% unik.`,
        'token'
      );
    }

    return fixedCount;
  }, [tokens, candidates, votes, settings, auditLogs, broadcastUpdate, addAuditLog]);

  // Simulation
  const simulateVotes = useCallback(
    (count: number) => {
      const unusedTokens = tokens.filter((t) => !t.isUsed);
      if (unusedTokens.length === 0) {
        return;
      }

      const toProcess = unusedTokens.slice(0, count);
      const now = new Date();
      const updatedTokens = [...tokens];
      const newVotes: VoteRecord[] = [];

      toProcess.forEach((t, idx) => {
        const indexInAll = updatedTokens.findIndex((tk) => tk.token === t.token);
        if (indexInAll !== -1) {
          const voteTime = new Date(now.getTime() - (count - idx) * 30000).toISOString();
          updatedTokens[indexInAll] = {
            ...updatedTokens[indexInAll],
            isUsed: true,
            usedAt: voteTime
          };

          const candIds = candidates.map((c) => c.id);
          const randomCand = candIds.length > 0 ? candIds[Math.floor(Math.random() * candIds.length)] : 1;

          newVotes.push({
            id: `sim-vote-${Date.now()}-${idx}`,
            candidateId: randomCand,
            voterCategory: t.category,
            classGroup: t.classGroup,
            timestamp: voteTime
          });
        }
      });

      const updatedAllVotes = [...votes, ...newVotes];
      const logItem: AuditLogItem = {
        id: `sim-log-${Date.now()}`,
        action: 'Simulasi Suara Dijalankan',
        details: `Ditambahkan simulasi ${newVotes.length} suara otomatis ke sistem.`,
        timestamp: new Date().toISOString(),
        type: 'vote'
      };
      const updatedLogs = [logItem, ...auditLogs].slice(0, 100);

      setTokens(updatedTokens);
      setVotes(updatedAllVotes);
      setAuditLogs(updatedLogs);
      setLastVoteTime(new Date().toISOString());

      audioManager.playVoteSuccess();
      broadcastUpdate(candidates, updatedTokens, updatedAllVotes, settings, updatedLogs);
    },
    [tokens, votes, candidates, settings, auditLogs, broadcastUpdate]
  );

  // Reset all
  const resetAllElectionData = useCallback(() => {
    const clearedTokens = tokens.map((t) => ({
      ...t,
      isUsed: false,
      usedAt: undefined
    }));
    const clearedVotes: VoteRecord[] = [];
    const logItem: AuditLogItem = {
      id: `reset-log-${Date.now()}`,
      action: 'Kotak Suara Dikosongkan',
      details: 'Seluruh perolehan suara direset ke 0 dan semua token dikembalikan menjadi Belum Digunakan.',
      timestamp: new Date().toISOString(),
      type: 'config'
    };
    const newLogs = [logItem];

    const newSettings = { ...settings, totalRegisteredVoters: clearedTokens.length };
    setTokens(clearedTokens);
    setVotes(clearedVotes);
    setAuditLogs(newLogs);
    setLastVoteTime(null);
    setSettings(newSettings);

    try {
      localStorage.setItem(`${STORAGE_KEY}_tokens`, JSON.stringify(clearedTokens));
      localStorage.setItem(`${STORAGE_KEY}_votes`, JSON.stringify(clearedVotes));
      localStorage.setItem(`${STORAGE_KEY}_settings`, JSON.stringify(newSettings));
    } catch {
      // ignore
    }

    broadcastUpdate(candidates, clearedTokens, clearedVotes, newSettings, newLogs);

    try {
      fetch('/api/election/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'reset_all' })
      }).catch(() => {});
    } catch {
      // ignore
    }

    const client = initSupabaseClient();
    if (client) {
      safeSupabaseOperation(
        client.from('votes').delete().neq('id', 'placeholder')
      );
      safeSupabaseOperation(
        client.from('voters').update({ is_used: false, used_at: null }).neq('token', 'placeholder')
      );
    }
  }, [candidates, tokens, settings, broadcastUpdate]);

  // Reset to default sample
  const resetToDefaultSampleData = useCallback(() => {
    const { tokens: initTokens, votes: initVotes } = generateInitialTokensAndVotes();
    const logItem: AuditLogItem = {
      id: `default-log-${Date.now()}`,
      action: 'Muat Data Sampel Default',
      details: 'Memulihkan data sampel DPT lengkap SMPN 50 Jakarta dengan perolehan suara awal.',
      timestamp: new Date().toISOString(),
      type: 'system'
    };
    const defaultSettings: ElectionSettings = {
      ...INITIAL_SETTINGS,
      totalRegisteredVoters: initTokens.length
    };
    setCandidates(CANDIDATE_PAIRS);
    setTokens(initTokens);
    setVotes(initVotes);
    setSettings(defaultSettings);
    setTimeline(INITIAL_TIMELINE);
    setAuditLogs([logItem]);
    setLastVoteTime(new Date().toISOString());

    try {
      localStorage.setItem(`${STORAGE_KEY}_candidates`, JSON.stringify(CANDIDATE_PAIRS));
      localStorage.setItem(`${STORAGE_KEY}_tokens`, JSON.stringify(initTokens));
      localStorage.setItem(`${STORAGE_KEY}_votes`, JSON.stringify(initVotes));
      localStorage.setItem(`${STORAGE_KEY}_settings`, JSON.stringify(defaultSettings));
      localStorage.setItem(`${STORAGE_KEY}_timeline`, JSON.stringify(INITIAL_TIMELINE));
      localStorage.setItem(`${STORAGE_KEY}_logs`, JSON.stringify([logItem]));
    } catch {
      // ignore
    }

    broadcastUpdate(CANDIDATE_PAIRS, initTokens, initVotes, defaultSettings, [logItem]);

    try {
      fetch('/api/election/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'default_sample' })
      }).catch(() => {});
    } catch {
      // ignore
    }
  }, [broadcastUpdate]);

  // Update Settings
  const updateSettings = useCallback(
    (newSettings: Partial<ElectionSettings>) => {
      setSettings((prev) => {
        const merged = { ...prev, ...newSettings };
        addAuditLog('Pengaturan Sekolah Diperbarui', 'Informasi identitas sekolah / logo / PIN diperbarui oleh Panitia.', 'config');
        broadcastUpdate(candidates, tokens, votes, merged, auditLogs);

        const client = initSupabaseClient();
        if (client) {
          const settingsPayload: Record<string, unknown> = {
            id: 'main',
            election_name: merged.electionName,
            academic_year: merged.academicYear,
            school_name: merged.schoolName,
            school_address: merged.schoolAddress,
            logo_url: merged.logoUrl,
            is_open: merged.isOpen,
            total_registered_voters: merged.totalRegisteredVoters,
            admin_pin: merged.adminPin,
            announcement_text: merged.announcementText,
            updated_at: new Date().toISOString()
          };
          if (merged.quickCountTitle !== undefined) settingsPayload.quick_count_title = merged.quickCountTitle;
          if (merged.quickCountSubtitle !== undefined) settingsPayload.quick_count_subtitle = merged.quickCountSubtitle;
          if (merged.votingTitle !== undefined) settingsPayload.voting_title = merged.votingTitle;
          if (merged.votingSubtitle !== undefined) settingsPayload.voting_subtitle = merged.votingSubtitle;
          if (merged.tokenPrefix !== undefined) settingsPayload.token_prefix = merged.tokenPrefix;
          if (merged.tokenLength !== undefined) settingsPayload.token_length = merged.tokenLength;

          safeSupabaseOperation(
            client.from('settings').upsert(settingsPayload)
          );
        }

        return merged;
      });
    },
    [candidates, tokens, votes, auditLogs, addAuditLog, broadcastUpdate]
  );

  // Validate Admin Password
  const validateAdminPassword = useCallback((attempt: string): boolean => {
    const cleanAttempt = attempt.trim();
    if (!cleanAttempt) return false;
    const storedPin = localStorage.getItem('smpn50_admin_password') || settings.adminPin || '5050';
    return cleanAttempt === storedPin.trim();
  }, [settings.adminPin]);

  // Update Admin Password
  const updateAdminPassword = useCallback((newPin: string): { success: boolean; message: string } => {
    const clean = newPin.trim();
    if (clean.length < 4) {
      return { success: false, message: 'Kata sandi / PIN minimal 4 karakter.' };
    }

    try {
      localStorage.setItem('smpn50_admin_password', clean);
    } catch {
      // ignore
    }

    setSettings((prev) => {
      const next = { ...prev, adminPin: clean };
      try {
        localStorage.setItem(`${STORAGE_KEY}_settings`, JSON.stringify(next));
      } catch {
        // ignore
      }

      const client = initSupabaseClient();
      if (client) {
        safeSupabaseOperation(
          client.from('settings').update({ admin_pin: clean, updated_at: new Date().toISOString() }).eq('id', 'main')
        );
      }
      return next;
    });

    addAuditLog('Kata Sandi Diubah', 'Kata sandi Panitia MPK berhasil diperbarui.', 'config');
    return { success: true, message: 'Kata sandi Panitia MPK berhasil disimpan!' };
  }, [addAuditLog]);

  // Reset Voters List (DPT Kosong)
  const resetVotersList = useCallback(() => {
    const updatedSettings = { ...settings, totalRegisteredVoters: 0 };
    setTokens([]);
    setVotes([]);
    setLastVoteTime(null);
    setSettings(updatedSettings);
    addAuditLog('DPT Dikosongkan', 'Seluruh daftar pemilih (DPT) dan kotak suara dikosongkan oleh Panitia.', 'config');
    broadcastUpdate(candidates, [], [], updatedSettings, auditLogs);

    try {
      localStorage.setItem(`${STORAGE_KEY}_tokens`, JSON.stringify([]));
      localStorage.setItem(`${STORAGE_KEY}_votes`, JSON.stringify([]));
      localStorage.setItem(`${STORAGE_KEY}_settings`, JSON.stringify(updatedSettings));
    } catch {
      // ignore
    }

    try {
      fetch('/api/election/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'reset_voters_empty' })
      }).catch(() => {});
    } catch {
      // ignore
    }

    const client = initSupabaseClient();
    if (client) {
      safeSupabaseOperation(client.from('votes').delete().neq('id', 'placeholder'));
      safeSupabaseOperation(client.from('voters').delete().neq('token', 'placeholder'));
    }
  }, [candidates, settings, auditLogs, addAuditLog, broadcastUpdate]);

  // Reset Status Memilih (Kembalikan status semua token menjadi belum coblos, kosongkan suara)
  const resetTokensVoteStatus = useCallback(() => {
    const unvotedTokens = tokens.map((t) => ({ ...t, isUsed: false, usedAt: undefined }));
    const updatedSettings = { ...settings, totalRegisteredVoters: unvotedTokens.length };
    setTokens(unvotedTokens);
    setVotes([]);
    setLastVoteTime(null);
    setSettings(updatedSettings);
    addAuditLog('Status Memilih Direset', 'Semua pemilih dikembalikan statusnya menjadi Belum Memilih dan kotak suara dikosongkan.', 'config');
    broadcastUpdate(candidates, unvotedTokens, [], updatedSettings, auditLogs);

    try {
      localStorage.setItem(`${STORAGE_KEY}_tokens`, JSON.stringify(unvotedTokens));
      localStorage.setItem(`${STORAGE_KEY}_votes`, JSON.stringify([]));
      localStorage.setItem(`${STORAGE_KEY}_settings`, JSON.stringify(updatedSettings));
    } catch {
      // ignore
    }

    try {
      fetch('/api/election/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'reset_votes_only' })
      }).catch(() => {});
    } catch {
      // ignore
    }

    const client = initSupabaseClient();
    if (client) {
      safeSupabaseOperation(client.from('votes').delete().neq('id', 'placeholder'));
      safeSupabaseOperation(client.from('voters').update({ is_used: false, used_at: null }).neq('token', 'placeholder'));
    }
  }, [candidates, tokens, settings, auditLogs, addAuditLog, broadcastUpdate]);

  // Connect Supabase
  const connectSupabase = useCallback(async (url: string, key: string) => {
    const cleanedUrl = cleanSupabaseUrl(url);
    const cleanedKey = key.trim();
    const test = await testSupabaseConnection(cleanedUrl, cleanedKey);
    if (!test.success) {
      return test;
    }

    localStorage.setItem('smpn50_supabase_url', cleanedUrl);
    localStorage.setItem('smpn50_supabase_key', cleanedKey);

    setSettings((prev) => ({
      ...prev,
      supabaseUrl: cleanedUrl,
      supabaseAnonKey: cleanedKey,
      useSupabase: true
    }));

    const client = initSupabaseClient(cleanedUrl, cleanedKey);
    if (client) {
      const data = await fetchAllFromSupabase(client);
      if (data && data.candidates && data.candidates.length > 0) {
        // Supabase already has data - adopt it
        if (data.candidates) setCandidates(data.candidates);
        if (data.tokens && data.tokens.length > 0) setTokens(data.tokens);
        if (data.votes) setVotes(data.votes);
        if (data.settings) setSettings(data.settings);
        if (data.auditLogs && data.auditLogs.length > 0) setAuditLogs(data.auditLogs);
        if (data.timeline && data.timeline.length > 0) setTimeline(data.timeline);
      } else {
        // Supabase is empty or fresh - upload all local state immediately so other devices (HP, laptops) can see everything!
        await pushAllToSupabase(client, {
          settings,
          candidates,
          tokens,
          votes,
          auditLogs,
          timeline
        });
      }
      setSupabaseConnected(true);
    }

    return { success: true, message: 'Koneksi ke Supabase berhasil! Seluruh data disinkronkan secara langsung.' };
  }, [candidates, tokens, votes, settings, auditLogs, timeline]);

  const disconnectSupabase = useCallback(() => {
    localStorage.removeItem('smpn50_supabase_url');
    localStorage.removeItem('smpn50_supabase_key');
    setSupabaseConnected(false);
    setSettings((prev) => ({ ...prev, useSupabase: false, supabaseUrl: '', supabaseAnonKey: '' }));
  }, []);

  // Upload complete state to Supabase
  const uploadToSupabase = useCallback(async () => {
    const client = initSupabaseClient();
    if (!client) {
      return { success: false, message: 'Database Supabase belum terhubung. Konfigurasikan URL dan Key terlebih dahulu.' };
    }
    return await pushAllToSupabase(client, {
      settings,
      candidates,
      tokens,
      votes,
      auditLogs,
      timeline
    });
  }, [settings, candidates, tokens, votes, auditLogs, timeline]);

  // Pull latest state from Supabase
  const refreshFromSupabase = useCallback(async () => {
    const client = initSupabaseClient();
    if (!client) {
      return { success: false, message: 'Database Supabase belum terhubung.' };
    }
    const data = await fetchAllFromSupabase(client);
    if (!data) {
      return { success: false, message: 'Gagal mengambil data dari Supabase.' };
    }
    if (data.candidates && data.candidates.length > 0) setCandidates(data.candidates);
    if (data.tokens && data.tokens.length > 0) setTokens(data.tokens);
    if (data.votes) setVotes(data.votes);
    if (data.settings) setSettings(data.settings);
    if (data.auditLogs && data.auditLogs.length > 0) setAuditLogs(data.auditLogs);
    if (data.timeline && data.timeline.length > 0) setTimeline(data.timeline);
    return { success: true, message: 'Data berhasil disegarkan dari Supabase!' };
  }, []);

  // Timeline Management with Server & Supabase sync
  const addTimelineItem = useCallback((item: TimelineItem) => {
    localTimelineModifiedTimeRef.current = Date.now();
    const prev = timelineRef.current;
    const next = [...prev, item];
    timelineRef.current = next;
    setTimeline(next);

    try {
      localStorage.setItem(`${STORAGE_KEY}_timeline`, JSON.stringify(next));
    } catch {
      // ignore
    }

    addAuditLog('Agenda Pilkasis Ditambahkan', `Kegiatan "${item.activity}" pada ${item.dayDate} ditambahkan.`, 'config');
    broadcastUpdate(undefined, undefined, undefined, undefined, undefined, next);

    fetch('/api/election/timeline', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ timeline: next })
    })
      .then(() => {
        localTimelineModifiedTimeRef.current = 0;
      })
      .catch(console.warn);

    const client = initSupabaseClient();
    if (client) {
      safeSupabaseOperation(
        client.from('timeline').upsert({
          id: item.id,
          order_index: next.length,
          time: item.time,
          day_date: item.dayDate,
          activity: item.activity,
          status: item.status,
          badge_text: item.badgeText,
          badge_color: item.badgeColor,
          description: item.description || ''
        })
      );
    }
  }, [addAuditLog, broadcastUpdate]);

  const updateTimelineItem = useCallback((id: string, updated: Partial<TimelineItem>) => {
    localTimelineModifiedTimeRef.current = Date.now();
    const prev = timelineRef.current;
    const next = prev.map((item) => (item.id === id ? { ...item, ...updated } : item));
    timelineRef.current = next;
    setTimeline(next);

    try {
      localStorage.setItem(`${STORAGE_KEY}_timeline`, JSON.stringify(next));
    } catch {
      // ignore
    }

    addAuditLog('Agenda Pilkasis Diperbarui', `Kegiatan timeline ID ${id} berhasil diperbarui.`, 'config');
    broadcastUpdate(undefined, undefined, undefined, undefined, undefined, next);

    fetch('/api/election/timeline', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ timeline: next })
    })
      .then(() => {
        localTimelineModifiedTimeRef.current = 0;
      })
      .catch(console.warn);

    const client = initSupabaseClient();
    if (client) {
      const item = next.find((t) => t.id === id);
      if (item) {
        safeSupabaseOperation(
          client.from('timeline').upsert({
            id: item.id,
            time: item.time,
            day_date: item.dayDate,
            activity: item.activity,
            status: item.status,
            badge_text: item.badgeText,
            badge_color: item.badgeColor,
            description: item.description || ''
          })
        );
      }
    }
  }, [addAuditLog, broadcastUpdate]);

  const deleteTimelineItem = useCallback((id: string) => {
    localTimelineModifiedTimeRef.current = Date.now();
    const prev = timelineRef.current;
    const next = prev.filter((item) => item.id !== id);
    timelineRef.current = next;
    setTimeline(next);

    try {
      localStorage.setItem(`${STORAGE_KEY}_timeline`, JSON.stringify(next));
    } catch {
      // ignore
    }

    addAuditLog('Agenda Pilkasis Dihapus', `Tahapan timeline ID ${id} dihapus.`, 'config');
    broadcastUpdate(undefined, undefined, undefined, undefined, undefined, next);

    fetch('/api/election/timeline', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ timeline: next })
    })
      .then(() => {
        localTimelineModifiedTimeRef.current = 0;
      })
      .catch(console.warn);

    const client = initSupabaseClient();
    if (client) {
      safeSupabaseOperation(client.from('timeline').delete().eq('id', id));
    }
  }, [addAuditLog, broadcastUpdate]);

  const reorderTimeline = useCallback((startIndex: number, endIndex: number) => {
    localTimelineModifiedTimeRef.current = Date.now();
    const prev = timelineRef.current;
    const result = Array.from(prev);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    timelineRef.current = result;
    setTimeline(result);

    try {
      localStorage.setItem(`${STORAGE_KEY}_timeline`, JSON.stringify(result));
    } catch {
      // ignore
    }

    broadcastUpdate(undefined, undefined, undefined, undefined, undefined, result);

    fetch('/api/election/timeline', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ timeline: result })
    })
      .then(() => {
        localTimelineModifiedTimeRef.current = 0;
      })
      .catch(console.warn);

    const client = initSupabaseClient();
    if (client) {
      safeSupabaseOperation(
        client.from('timeline').upsert(
          result.map((item, idx) => ({
            id: item.id,
            order_index: idx + 1,
            time: item.time,
            day_date: item.dayDate,
            activity: item.activity,
            status: item.status,
            badge_text: item.badgeText,
            badge_color: item.badgeColor,
            description: item.description || ''
          }))
        )
      );
    }
  }, [broadcastUpdate]);

  const resetTimelineToDefault = useCallback(() => {
    localTimelineModifiedTimeRef.current = Date.now();
    timelineRef.current = INITIAL_TIMELINE;
    setTimeline(INITIAL_TIMELINE);

    try {
      localStorage.setItem(`${STORAGE_KEY}_timeline`, JSON.stringify(INITIAL_TIMELINE));
    } catch {
      // ignore
    }

    addAuditLog('Agenda Pilkasis Direset', 'Timeline proses Pilkasis dipulihkan ke data standar bawaan.', 'config');
    broadcastUpdate(undefined, undefined, undefined, undefined, undefined, INITIAL_TIMELINE);

    fetch('/api/election/timeline', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ timeline: INITIAL_TIMELINE })
    })
      .then(() => {
        localTimelineModifiedTimeRef.current = 0;
      })
      .catch(console.warn);

    const client = initSupabaseClient();
    if (client) {
      safeSupabaseOperation(
        client.from('timeline').upsert(
          INITIAL_TIMELINE.map((item, idx) => ({
            id: item.id,
            order_index: idx + 1,
            time: item.time,
            day_date: item.dayDate,
            activity: item.activity,
            status: item.status,
            badge_text: item.badgeText,
            badge_color: item.badgeColor,
            description: item.description || ''
          }))
        )
      );
    }
  }, [addAuditLog, broadcastUpdate]);

  // Compute stats
  const stats = useMemo<ElectionStats>(() => {
    const totalVotes = votes.length;
    const totalVoters = tokens.length;
    const turnoutPercentage = totalVoters > 0 ? Number(((totalVotes / totalVoters) * 100).toFixed(1)) : 0;

    const votesPerCandidate: Record<number, number> = {};
    candidates.forEach((c) => {
      votesPerCandidate[c.id] = 0;
    });

    const byCategory: Record<string, CategoryStatItem> = {
      'Siswa': { candidate1: 0, candidate2: 0, total: 0, votesPerCandidate: {} },
      'Guru': { candidate1: 0, candidate2: 0, total: 0, votesPerCandidate: {} },
      'Tata Usaha': { candidate1: 0, candidate2: 0, total: 0, votesPerCandidate: {} },
      'Tendik': { candidate1: 0, candidate2: 0, total: 0, votesPerCandidate: {} }
    };
    const byClass: Record<string, CategoryStatItem> = {};

    votes.forEach((v) => {
      if (votesPerCandidate[v.candidateId] !== undefined) {
        votesPerCandidate[v.candidateId]++;
      } else {
        votesPerCandidate[v.candidateId] = 1;
      }

      const cat = v.voterCategory || 'Siswa';
      if (!byCategory[cat]) {
        byCategory[cat] = { candidate1: 0, candidate2: 0, total: 0, votesPerCandidate: {} };
      }
      byCategory[cat].total++;
      byCategory[cat].votesPerCandidate[v.candidateId] = (byCategory[cat].votesPerCandidate[v.candidateId] || 0) + 1;
      if (v.candidateId === 1) byCategory[cat].candidate1++;
      if (v.candidateId === 2) byCategory[cat].candidate2++;

      const cls = v.classGroup || 'Umum';
      if (!byClass[cls]) {
        byClass[cls] = { candidate1: 0, candidate2: 0, total: 0, votesPerCandidate: {} };
      }
      byClass[cls].total++;
      byClass[cls].votesPerCandidate[v.candidateId] = (byClass[cls].votesPerCandidate[v.candidateId] || 0) + 1;
      if (v.candidateId === 1) byClass[cls].candidate1++;
      if (v.candidateId === 2) byClass[cls].candidate2++;
    });

    const percentagePerCandidate: Record<number, number> = {};
    candidates.forEach((c) => {
      const vCount = votesPerCandidate[c.id] || 0;
      percentagePerCandidate[c.id] = totalVotes > 0 ? Number(((vCount / totalVotes) * 100).toFixed(1)) : 0;
    });

    // Check leader
    let maxVotes = -1;
    let leaderCandidateId: number | null = null;
    let tie = false;

    Object.entries(votesPerCandidate).forEach(([idStr, count]) => {
      const id = Number(idStr);
      if (count > maxVotes) {
        maxVotes = count;
        leaderCandidateId = id;
        tie = false;
      } else if (count === maxVotes && maxVotes > 0) {
        tie = true;
      }
    });

    if (tie || maxVotes === 0) {
      leaderCandidateId = null;
    }

    // Sort counts to find margin between top 2
    const sortedCounts = Object.values(votesPerCandidate).sort((a, b) => b - a);
    const margin = sortedCounts.length >= 2 ? sortedCounts[0] - sortedCounts[1] : (sortedCounts[0] || 0);
    const marginPercentage =
      totalVotes > 0 ? Number(((margin / totalVotes) * 100).toFixed(1)) : 0;

    return {
      totalVotes,
      totalVoters,
      turnoutPercentage,
      votesPerCandidate,
      percentagePerCandidate,
      leaderCandidateId,
      margin,
      marginPercentage,
      byCategory,
      byClass
    };
  }, [votes, tokens, candidates]);

  return (
    <ElectionContext.Provider
      value={{
        candidates,
        tokens,
        votes,
        settings,
        auditLogs,
        stats,
        lastVoteTime,
        supabaseConnected,
        validateToken,
        castVote,
        toggleElectionStatus,
        updateCandidate,
        addCandidate,
        deleteCandidate,
        addVoter,
        updateVoter,
        deleteVoter,
        bulkDeleteVoters,
        importVoters,
        generateBatchTokens,
        fixDuplicateTokens,
        simulateVotes,
        resetAllElectionData,
        resetToDefaultSampleData,
        resetVotersList,
        resetTokensVoteStatus,
        updateSettings,
        validateAdminPassword,
        updateAdminPassword,
        connectSupabase,
        disconnectSupabase,
        uploadToSupabase,
        refreshFromSupabase,
        addAuditLog,
        timeline,
        addTimelineItem,
        updateTimelineItem,
        deleteTimelineItem,
        reorderTimeline,
        resetTimelineToDefault
      }}
    >
      {children}
    </ElectionContext.Provider>
  );
};

export function useElection() {
  const context = useContext(ElectionContext);
  if (!context) {
    throw new Error('useElection must be used within an ElectionProvider');
  }
  return context;
}

