import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { CandidatePair, ElectionSettings, VoterToken, VoteRecord, AuditLogItem } from '../types/election';

let cachedClient: SupabaseClient | null = null;
let currentUrl: string = '';
let currentKey: string = '';

export function isValidSupabaseUrl(url: unknown): boolean {
  if (typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (!trimmed) return false;
  if (!trimmed.startsWith('https://') && !trimmed.startsWith('http://')) return false;
  try {
    const parsed = new URL(trimmed);
    return (parsed.protocol === 'https:' || parsed.protocol === 'http:') && parsed.hostname.length > 3;
  } catch {
    return false;
  }
}

export function getSupabaseCredentials(customUrl?: string, customKey?: string) {
  const envUrl = (import.meta as unknown as { env: Record<string, string> }).env?.VITE_SUPABASE_URL || '';
  const envKey = (import.meta as unknown as { env: Record<string, string> }).env?.VITE_SUPABASE_ANON_KEY || '';

  let storedUrl = '';
  try {
    storedUrl = localStorage.getItem('smpn50_supabase_url') || '';
    if (storedUrl && !isValidSupabaseUrl(storedUrl)) {
      localStorage.removeItem('smpn50_supabase_url');
      storedUrl = '';
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

  const candidateUrl = (customUrl && isValidSupabaseUrl(customUrl) ? customUrl : storedUrl) || (isValidSupabaseUrl(envUrl) ? envUrl : '');
  const candidateKey = customKey || storedKey || envKey;

  return { url: candidateUrl.trim(), key: candidateKey.trim() };
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
        persistSession: false
      }
    });
    currentUrl = url;
    currentKey = key;
    return cachedClient;
  } catch (err) {
    console.warn('Supabase initialization skipped:', err);
    return null;
  }
}

export async function testSupabaseConnection(url: string, key: string): Promise<{ success: boolean; message: string }> {
  try {
    if (!isValidSupabaseUrl(url)) {
      return { success: false, message: 'URL Supabase tidak valid. URL harus diawali dengan https:// (contoh: https://xyzcompany.supabase.co).' };
    }
    if (!key || key.trim().length < 10) {
      return { success: false, message: 'Anon Key tidak valid. Masukkan Anon/Public Key Supabase Anda.' };
    }
    const testClient = createClient(url.trim(), key.trim());
    const { error } = await testClient.from('settings').select('id').limit(1);

    if (error) {
      return { success: false, message: `Error Supabase: ${error.message}` };
    }
    return { success: true, message: 'Koneksi ke database Supabase berhasil!' };
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
} | null> {
  try {
    const [settingsRes, candidatesRes, votersRes, votesRes, logsRes] = await Promise.all([
      client.from('settings').select('*').eq('id', 'main').single(),
      client.from('candidates').select('*').order('id', { ascending: true }),
      client.from('voters').select('*'),
      client.from('votes').select('*').order('timestamp', { ascending: true }),
      client.from('audit_logs').select('*').order('timestamp', { ascending: false }).limit(100)
    ]);

    let loadedSettings: ElectionSettings | undefined = undefined;
    if (settingsRes.data) {
      const d = settingsRes.data;
      loadedSettings = {
        electionName: d.election_name,
        academicYear: d.academic_year,
        schoolName: d.school_name,
        schoolAddress: d.school_address,
        logoUrl: d.logo_url,
        isOpen: d.is_open,
        totalRegisteredVoters: d.total_registered_voters,
        adminPin: d.admin_pin,
        announcementText: d.announcement_text,
        quickCountTitle: d.quick_count_title,
        quickCountSubtitle: d.quick_count_subtitle,
        votingTitle: d.voting_title,
        votingSubtitle: d.voting_subtitle,
        tokenPrefix: d.token_prefix,
        tokenLength: d.token_length,
        useSupabase: true
      };
    }

    let loadedCandidates: CandidatePair[] | undefined = undefined;
    if (candidatesRes.data && candidatesRes.data.length > 0) {
      loadedCandidates = candidatesRes.data.map((c) => ({
        id: c.id,
        number: c.number,
        chairman: c.chairman,
        viceChairman: c.vice_chairman,
        tagline: c.tagline,
        posterImage: c.poster_image,
        color: c.color,
        vision: c.vision,
        missions: Array.isArray(c.missions) ? c.missions : [],
        workPrograms: Array.isArray(c.work_programs) ? c.work_programs : []
      }));
    }

    let loadedTokens: VoterToken[] | undefined = undefined;
    if (votersRes.data) {
      loadedTokens = votersRes.data.map((v) => ({
        token: v.token,
        voterName: v.voter_name,
        classGroup: v.class_group,
        category: v.category,
        isUsed: v.is_used,
        usedAt: v.used_at
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

    return {
      settings: loadedSettings,
      candidates: loadedCandidates,
      tokens: loadedTokens,
      votes: loadedVotes,
      auditLogs: loadedLogs
    };
  } catch (err) {
    console.error('Error fetching data from Supabase:', err);
    return null;
  }
}

export function safeSupabaseOperation(promiseLike: PromiseLike<unknown>): void {
  Promise.resolve(promiseLike).catch((err) => {
    console.warn('Background Supabase operation notice:', err);
  });
}

