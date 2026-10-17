import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { CandidatePair, ElectionSettings, VoterToken, VoteRecord, AuditLogItem, TimelineItem } from '../types/election';

let cachedClient: SupabaseClient | null = null;
let currentUrl: string = '';
let currentKey: string = '';

export function cleanSupabaseUrl(url: unknown): string {
  if (typeof url !== 'string') return '';
  let trimmed = url.trim();
  if (!trimmed) return '';
  if (!trimmed.startsWith('https://') && !trimmed.startsWith('http://')) {
    trimmed = `https://${trimmed}`;
  }
  try {
    const parsed = new URL(trimmed);
    // Always extracts pure origin: https://xyz.supabase.co
    // Automatically strips /rest/v1/, /rest/v1, trailing slashes, or extra paths
    return parsed.origin;
  } catch {
    return trimmed.replace(/\/rest\/v1\/?.*$/i, '').replace(/\/+$/, '');
  }
}

export function isValidSupabaseUrl(url: unknown): boolean {
  const cleaned = cleanSupabaseUrl(url);
  if (!cleaned) return false;
  try {
    const parsed = new URL(cleaned);
    return (parsed.protocol === 'https:' || parsed.protocol === 'http:') && parsed.hostname.length > 3;
  } catch {
    return false;
  }
}

/**
 * Retrieve Supabase credentials with priority:
 * 1. URL Query parameters (?sb_url=...&sb_key=...) - Auto-stores to localStorage for instant phone sync via QR/link
 * 2. Custom passed arguments
 * 3. LocalStorage
 * 4. Environment Variables (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
 */
export function getSupabaseCredentials(customUrl?: string, customKey?: string) {
  const envUrl = (import.meta as unknown as { env: Record<string, string> }).env?.VITE_SUPABASE_URL || '';
  const envKey = (import.meta as unknown as { env: Record<string, string> }).env?.VITE_SUPABASE_ANON_KEY || '';

  // 1. Check URL parameters if in browser environment
  if (typeof window !== 'undefined' && window.location) {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const paramUrl = urlParams.get('sb_url') || urlParams.get('supabase_url');
      const paramKey = urlParams.get('sb_key') || urlParams.get('supabase_key');

      if (paramUrl && paramKey && isValidSupabaseUrl(paramUrl) && paramKey.length > 10) {
        localStorage.setItem('smpn50_supabase_url', paramUrl.trim());
        localStorage.setItem('smpn50_supabase_key', paramKey.trim());
        // Clean URL params silently
        const cleanUrl = window.location.pathname + window.location.hash;
        window.history.replaceState({}, document.title, cleanUrl);
      }
    } catch {
      // ignore
    }
  }

  let storedUrl = '';
  try {
    storedUrl = localStorage.getItem('smpn50_supabase_url') || '';
    if (storedUrl) {
      storedUrl = cleanSupabaseUrl(storedUrl);
    }
  } catch {
    // ignore
  }

  let storedKey = '';
  try {
    storedKey = localStorage.getItem('smpn50_supabase_key') || '';
  } catch {
    // ignore
  }

  const rawCandidateUrl = (customUrl && isValidSupabaseUrl(customUrl) ? customUrl : storedUrl) || (isValidSupabaseUrl(envUrl) ? envUrl : '');
  const candidateUrl = cleanSupabaseUrl(rawCandidateUrl);
  const candidateKey = (customKey || storedKey || envKey).trim();

  return { url: candidateUrl, key: candidateKey };
}

export function initSupabaseClient(customUrl?: string, customKey?: string): SupabaseClient | null {
  const { url, key } = getSupabaseCredentials(customUrl, customKey);

  if (!isValidSupabaseUrl(url) || !key || key.length < 10) {
    return null;
  }

  if (cachedClient && currentUrl === url && currentKey === key) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      },
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      }
    });
    currentUrl = url;
    currentKey = key;
    return cachedClient;
  } catch (err) {
    console.warn('Supabase initialization error:', err);
    return null;
  }
}

export async function testSupabaseConnection(url: string, key: string): Promise<{
  success: boolean;
  message: string;
  missingTables?: string[];
  cleanedUrl?: string;
}> {
  try {
    const cleanedUrl = cleanSupabaseUrl(url);
    if (!isValidSupabaseUrl(cleanedUrl)) {
      return { success: false, message: 'URL Supabase tidak valid. Gunakan format https://xyz.supabase.co tanpa tambahan /rest/v1/ di belakangnya.' };
    }
    if (!key || key.trim().length < 10) {
      return { success: false, message: 'Anon Key tidak valid. Masukkan Anon/Public Key Supabase Anda.' };
    }
    const testClient = createClient(cleanedUrl, key.trim(), {
      auth: { persistSession: false }
    });

    // Test tables existence
    const [settingsTest, candidatesTest, votersTest, votesTest] = await Promise.all([
      testClient.from('settings').select('id').limit(1),
      testClient.from('candidates').select('id').limit(1),
      testClient.from('voters').select('token').limit(1),
      testClient.from('votes').select('id').limit(1)
    ]);

    const missingTables: string[] = [];
    if (settingsTest.error) missingTables.push('settings');
    if (candidatesTest.error) missingTables.push('candidates');
    if (votersTest.error) missingTables.push('voters');
    if (votesTest.error) missingTables.push('votes');

    if (missingTables.length > 0) {
      return {
        success: false,
        message: `Tabel berikut belum dibuat di Supabase: ${missingTables.join(', ')}. Silakan jalankan Skrip SQL di Supabase SQL Editor.`,
        missingTables
      };
    }

    return {
      success: true,
      message: 'Koneksi ke database Supabase berhasil! Seluruh tabel terverifikasi aktif.'
    };
  } catch (err: unknown) {
    const error = err as Error;
    return { success: false, message: `Gagal terhubung: ${error?.message || 'Periksa URL dan Key'}` };
  }
}

// Fetch all data from Supabase
export async function fetchAllFromSupabase(client: SupabaseClient): Promise<{
  settings?: ElectionSettings;
  candidates?: CandidatePair[];
  tokens?: VoterToken[];
  votes?: VoteRecord[];
  auditLogs?: AuditLogItem[];
  timeline?: TimelineItem[];
} | null> {
  try {
    const [settingsRes, candidatesRes, votersRes, votesRes, logsRes, timelineRes] = await Promise.all([
      client.from('settings').select('*').eq('id', 'main').maybeSingle(),
      client.from('candidates').select('*').order('id', { ascending: true }),
      client.from('voters').select('*').limit(2500),
      client.from('votes').select('*').order('timestamp', { ascending: true }),
      client.from('audit_logs').select('*').order('timestamp', { ascending: false }).limit(100),
      client.from('timeline').select('*').order('order_index', { ascending: true })
    ]);

    let loadedSettings: ElectionSettings | undefined = undefined;
    if (settingsRes.data) {
      const d = settingsRes.data;
      loadedSettings = {
        electionName: d.election_name || 'Pemilihan Ketua & Wakil Ketua OSIS',
        academicYear: d.academic_year || '2024/2025',
        schoolName: d.school_name || 'SMP Negeri 50 Jakarta',
        schoolAddress: d.school_address || 'Jl. Cipinang Muara I No. 57, Jatinegara, Jakarta Timur',
        logoUrl: d.logo_url || '/images/logo_smpn50_jakarta_1792047092022.jpg',
        isOpen: d.is_open ?? true,
        totalRegisteredVoters: d.total_registered_voters || (votersRes.data?.length ?? 720),
        adminPin: d.admin_pin || '5050',
        announcementText: d.announcement_text || '',
        quickCountTitle: d.quick_count_title || 'Quick Count Perhitungan Suara Pemilihan OSIS',
        quickCountSubtitle: d.quick_count_subtitle || 'Pantau perolehan suara resmi secara real-time, transparan, dan akurat.',
        votingTitle: d.voting_title || 'Masuk dengan Token Pemilihan',
        votingSubtitle: d.voting_subtitle || 'Gunakan token unik Anda yang telah dibagikan oleh Panitia. Setiap token hanya berlaku satu kali coblos.',
        tokenPrefix: d.token_prefix || 'S',
        tokenLength: d.token_length || 5,
        useSupabase: true
      };
    }

    let loadedCandidates: CandidatePair[] | undefined = undefined;
    if (candidatesRes.data && candidatesRes.data.length > 0) {
      loadedCandidates = candidatesRes.data.map((c) => ({
        id: c.id,
        number: c.number,
        chairman: typeof c.chairman === 'string' ? JSON.parse(c.chairman) : c.chairman,
        viceChairman: typeof c.vice_chairman === 'string' ? JSON.parse(c.vice_chairman) : c.vice_chairman,
        tagline: c.tagline,
        posterImage: c.poster_image,
        color: typeof c.color === 'string' ? JSON.parse(c.color) : c.color,
        vision: c.vision,
        missions: Array.isArray(c.missions) ? c.missions : (typeof c.missions === 'string' ? JSON.parse(c.missions) : []),
        workPrograms: Array.isArray(c.work_programs) ? c.work_programs : (typeof c.work_programs === 'string' ? JSON.parse(c.work_programs) : [])
      }));
    }

    let loadedTokens: VoterToken[] | undefined = undefined;
    if (votersRes.data && votersRes.data.length > 0) {
      loadedTokens = votersRes.data.map((v) => ({
        token: v.token,
        voterName: v.voter_name || '',
        classGroup: v.class_group || '',
        category: v.category || 'Siswa',
        isUsed: !!v.is_used,
        usedAt: v.used_at || undefined
      }));
    }

    let loadedVotes: VoteRecord[] | undefined = undefined;
    if (votesRes.data) {
      loadedVotes = votesRes.data.map((vt) => ({
        id: vt.id,
        candidateId: vt.candidate_id,
        voterCategory: vt.voter_category,
        classGroup: vt.class_group,
        timestamp: vt.timestamp
      }));
    }

    let loadedLogs: AuditLogItem[] | undefined = undefined;
    if (logsRes.data) {
      loadedLogs = logsRes.data.map((l) => ({
        id: l.id,
        action: l.action,
        details: l.details,
        type: l.type,
        timestamp: l.timestamp
      }));
    }

    let loadedTimeline: TimelineItem[] | undefined = undefined;
    if (timelineRes.data && timelineRes.data.length > 0) {
      loadedTimeline = timelineRes.data.map((t) => ({
        id: t.id,
        time: t.time,
        dayDate: t.day_date,
        activity: t.activity,
        status: t.status,
        badgeText: t.badge_text,
        badgeColor: t.badge_color,
        description: t.description
      }));
    }

    return {
      settings: loadedSettings,
      candidates: loadedCandidates,
      tokens: loadedTokens,
      votes: loadedVotes,
      auditLogs: loadedLogs,
      timeline: loadedTimeline
    };
  } catch (err) {
    console.error('Error fetching data from Supabase:', err);
    return null;
  }
}

/**
 * Push complete state to Supabase so that all devices (HP, laptops) instantly receive
 * candidates, program kerja, settings, voters, and votes.
 */
export async function pushAllToSupabase(
  client: SupabaseClient,
  state: {
    settings: ElectionSettings;
    candidates: CandidatePair[];
    tokens: VoterToken[];
    votes: VoteRecord[];
    auditLogs: AuditLogItem[];
    timeline?: TimelineItem[];
  }
): Promise<{ success: boolean; message: string }> {
  try {
    // 1. Settings
    const settingsRow = {
      id: 'main',
      election_name: state.settings.electionName,
      academic_year: state.settings.academicYear,
      school_name: state.settings.schoolName,
      school_address: state.settings.schoolAddress,
      logo_url: state.settings.logoUrl,
      is_open: state.settings.isOpen,
      total_registered_voters: state.tokens.length || state.settings.totalRegisteredVoters,
      admin_pin: state.settings.adminPin,
      announcement_text: state.settings.announcementText || '',
      quick_count_title: state.settings.quickCountTitle || '',
      quick_count_subtitle: state.settings.quickCountSubtitle || '',
      voting_title: state.settings.votingTitle || '',
      voting_subtitle: state.settings.votingSubtitle || '',
      token_prefix: state.settings.tokenPrefix || 'S',
      token_length: 5,
      updated_at: new Date().toISOString()
    };
    await client.from('settings').upsert(settingsRow);

    // 2. Candidates
    if (state.candidates && state.candidates.length > 0) {
      const candidateRows = state.candidates.map((c) => ({
        id: c.id,
        number: c.number,
        chairman: c.chairman,
        vice_chairman: c.viceChairman,
        tagline: c.tagline,
        poster_image: c.posterImage,
        color: c.color,
        vision: c.vision,
        missions: c.missions,
        work_programs: c.workPrograms,
        updated_at: new Date().toISOString()
      }));
      await client.from('candidates').upsert(candidateRows);
    }

    // 3. Voters (chunked in batches of 100)
    if (state.tokens && state.tokens.length > 0) {
      const chunkSize = 100;
      for (let i = 0; i < state.tokens.length; i += chunkSize) {
        const batch = state.tokens.slice(i, i + chunkSize).map((v) => ({
          token: v.token,
          voter_name: v.voterName || '',
          class_group: v.classGroup,
          category: v.category,
          is_used: v.isUsed,
          used_at: v.usedAt || null
        }));
        await client.from('voters').upsert(batch);
      }
    }

    // 4. Votes
    if (state.votes && state.votes.length > 0) {
      const voteRows = state.votes.map((v) => ({
        id: v.id,
        candidate_id: v.candidateId,
        voter_category: v.voterCategory,
        class_group: v.classGroup,
        timestamp: v.timestamp
      }));
      await client.from('votes').upsert(voteRows);
    }

    // 5. Timeline
    if (state.timeline && state.timeline.length > 0) {
      const timelineRows = state.timeline.map((t, idx) => ({
        id: t.id,
        order_index: idx + 1,
        time: t.time,
        day_date: t.dayDate,
        activity: t.activity,
        status: t.status,
        badge_text: t.badgeText,
        badge_color: t.badgeColor,
        description: t.description || ''
      }));
      await client.from('timeline').upsert(timelineRows);
    }

    return {
      success: true,
      message: `Seluruh data (${state.candidates.length} Paslon, ${state.tokens.length} DPT, ${state.votes.length} Suara) berhasil diunggah ke Supabase!`
    };
  } catch (err: unknown) {
    const error = err as Error;
    console.error('Error pushing data to Supabase:', err);
    return {
      success: false,
      message: `Gagal mengunggah data: ${error?.message || 'Periksa koneksi Supabase'}`
    };
  }
}

export function safeSupabaseOperation(promiseLike: PromiseLike<unknown>): void {
  Promise.resolve(promiseLike).catch((err) => {
    console.warn('Background Supabase operation notice:', err);
  });
}
