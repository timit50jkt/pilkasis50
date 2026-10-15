export interface CandidatePair {
  id: number; // 1 or 2
  number: string; // "01" or "02"
  chairman: {
    name: string;
    class: string;
    role: string;
    avatar?: string;
  };
  viceChairman: {
    name: string;
    class: string;
    role: string;
    avatar?: string;
  };
  tagline: string;
  posterImage: string;
  color: {
    primary: string;
    accent: string;
    bgSoft: string;
    border: string;
    text: string;
  };
  vision: string;
  missions: string[];
  workPrograms: {
    title: string;
    desc: string;
  }[];
}

export type VoterCategory = 'Kelas 7' | 'Kelas 8' | 'Kelas 9' | 'Guru & Staf';

export interface VoterToken {
  token: string;
  voterName?: string;
  classGroup: string; // e.g. "7A", "8B", "9C", "Guru"
  category: VoterCategory;
  isUsed: boolean;
  usedAt?: string; // ISO string
}

export interface VoteRecord {
  id: string;
  candidateId: number;
  voterCategory: VoterCategory;
  classGroup: string;
  timestamp: string; // ISO string
}

export interface AuditLogItem {
  id: string;
  action: string;
  timestamp: string;
  details: string;
  type: 'vote' | 'token' | 'config' | 'system';
}

export interface ElectionSettings {
  electionName: string;
  academicYear: string;
  schoolName: string;
  schoolAddress: string;
  logoUrl?: string;
  isOpen: boolean;
  totalRegisteredVoters: number;
  adminPin: string;
  announcementText?: string;
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  useSupabase?: boolean;
}
