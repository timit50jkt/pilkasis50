/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ElectionProvider, useElection } from './context/ElectionContext';
import { Navbar, ActiveTab } from './components/Navbar';
import { QuickCountView } from './components/QuickCountView';
import { VotingBooth } from './components/VotingBooth';
import { CandidateCards } from './components/CandidateCards';
import { ProjectorMode } from './components/ProjectorMode';
import { AdminPanel } from './components/AdminPanel';
import { CandidateDetailModal } from './components/CandidateDetailModal';
import { CandidatePair } from './types/election';
import { ShieldCheck, School, Heart } from 'lucide-react';

function ElectionApp() {
  const { settings } = useElection();
  const [activeTab, setActiveTab] = useState<ActiveTab>('quickcount');
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [selectedCandidateDetail, setSelectedCandidateDetail] = useState<CandidatePair | null>(null);

  // If in Projector / Fullscreen mode, render dedicated view
  if (activeTab === 'projector') {
    return (
      <ProjectorMode onExit={() => setActiveTab('quickcount')} />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      {/* Top Bar adhering to top bar contract */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAdmin={() => setIsAdminOpen(true)}
      />

      {/* Main Viewport Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
        {activeTab === 'quickcount' && (
          <QuickCountView
            onGoToVoting={() => setActiveTab('voting')}
            onViewCandidateDetails={(candidate) => setSelectedCandidateDetail(candidate)}
          />
        )}

        {activeTab === 'voting' && (
          <VotingBooth
            onGoToQuickCount={() => setActiveTab('quickcount')}
            onViewCandidateDetails={(candidate) => setSelectedCandidateDetail(candidate)}
          />
        )}

        {activeTab === 'candidates' && (
          <CandidateCards
            onGoToVoting={() => setActiveTab('voting')}
            selectedCandidateDetail={selectedCandidateDetail}
            setSelectedCandidateDetail={setSelectedCandidateDetail}
          />
        )}
      </main>

      {/* Candidate Detail Modal */}
      <CandidateDetailModal
        candidate={selectedCandidateDetail}
        onClose={() => setSelectedCandidateDetail(null)}
        onVote={() => {
          setSelectedCandidateDetail(null);
          setActiveTab('voting');
        }}
      />

      {/* Admin Panel Modal */}
      <AdminPanel
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
      />

      {/* Clean Institutional Footer */}
      <footer className="bg-white border-t border-slate-200 mt-auto py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <div className="flex items-center gap-3">
              <img
                src={settings.logoUrl || '/src/assets/images/logo_smpn50_jakarta_1792047092022.jpg'}
                alt={settings.schoolName}
                referrerPolicy="no-referrer"
                className="w-8 h-8 rounded-full object-cover"
              />
              <div>
                <div className="font-bold text-slate-800">
                  {settings.schoolName}
                </div>
                <div className="text-[11px] text-slate-400">
                  {settings.schoolAddress}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 text-center md:text-right">
              <div>
                <div className="font-medium text-slate-700">
                  Panitia Pemilihan OSIS & Majelis Perwakilan Kelas (MPK)
                </div>
                <div className="text-[11px] text-slate-400">
                  Sistem Quick Count & E-Voting Mandiri · Asas LUBER JURDIL
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <ElectionProvider>
      <ElectionApp />
    </ElectionProvider>
  );
}
