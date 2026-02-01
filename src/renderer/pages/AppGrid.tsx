import React, { useEffect, useState } from 'react';

// Local libraries
// import GameLibraryTable from '../components/GameLibraryTable';
import GameLibraryTable from '../components/GameLibraryGrid';
import GOGImportModal from '../components/GOGImportModal';
import SteamSyncModal from '../components/SteamSyncModal';
import "../assets/css/App.css"

import gogLight from '../assets/icons/gog-light.svg';
import gogDark from '../assets/icons/gog-light.svg';
import steam from '../assets/icons/steam-logo.svg';



export default function App() {
  const [showImport, setShowImport] = useState(false);
  const [showSteamImport, setShowSteamImport] = useState(false);
  const [stats, setStats] = useState({ steam: 0, gog: 0, total: 0, duplicates: 0 });
  const [isHydrating, setIsHydrating] = useState(false);
  
  // Refresh stats whenever a sync completes
  const refreshStats = async () => {
    const data = await window.api.getLibraryStats();
    setStats(data);
  };

  useEffect(() => {
    refreshStats();
    return window.api.onSyncComplete(refreshStats);
  }, []);

  // Show that data is being populated in the background.
  useEffect(() => {
    const handleStart = () => setIsHydrating(true);
    const handleFinished = () => setIsHydrating(false);
  
    window.api.onHydrationStarted(handleStart);
    window.api.onHydrationFinished(handleFinished);
  
    return () => {
      // Clean up listeners
      window.api.removeHydrationStartedListener(handleStart);
      window.api.removeHydrationFinishedListener(handleFinished);
    };
  }, []);

  return (
    <>
      <header className="toolbar">
        <div className="button-group">
          <button className="btn-gog" onClick={() => setShowImport(true)}>
            <img width="30" alt="gog icon" src={gogLight} />
            Sync GOG Library
          </button>
          <button className="btn-steam" onClick={() => setShowSteamImport(true)}>
            <img width="30" alt="steam icon" src={steam} />
            Sync Steam Library
          </button>
        </div>

        {isHydrating && (
          <div className="stats-container">
          <span className="stat-badge stat-hydrate">
            <div className="stat-badge" style={{ background: '#004225' }}>
              Enriching Data <span className="hydrating-dot"></span>
            </div>
          </span>
          </div>
        )}

        <div className="stats-container">
          <span className="stat-badge stat-gog">
            <img width="20" alt="gog icon" src={gogLight} />
            {stats.gog}
          </span>
          <span className="stat-badge stat-steam">
            <img width="20" alt="steam icon" src={steam} />
            {stats.steam}
          </span>
          <span className="stat-badge stat-total">
            Total: {stats.total}
          </span>
          <span className="stat-badge stat-dupe">Duplicates ♊ {stats.duplicates}</span>
        </div>
      </header>
      
      <GameLibraryTable />

      {/* Modals... */}
      {showImport && <GOGImportModal onClose={() => setShowImport(false)} />}
      {showSteamImport && <SteamSyncModal onClose={() => setShowSteamImport(false)} />}
    </>
  );
}
