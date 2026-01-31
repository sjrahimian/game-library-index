import React, { useEffect, useState } from 'react';

// Local libraries
// import GameLibraryTable from '../components/GameLibraryTable';
import GameLibraryTable from '../components/GameLibraryGrid';
import GOGImportModal from '../components/GOGImportModal';
import SteamSyncModal from '../components/SteamSyncModal';
import "../assets/css/App.css"



export default function App() {
  const [showImport, setShowImport] = useState(false);
  const [showSteamImport, setShowSteamImport] = useState(false);
  const [stats, setStats] = useState({ steam: 0, gog: 0, duplicates: 0 });
  
  const refreshStats = async () => {
    const data = await window.api.getLibraryStats();
    setStats(data);
  };

  useEffect(() => {
    refreshStats();
    // Refresh stats whenever a sync completes
    return window.api.onSyncComplete(refreshStats);
  }, []);

  return (
    <>
      <header className="toolbar">
        <div className="button-group">
          <button className="btn-gog" onClick={() => setShowImport(true)}>
            GOG Library
          </button>
          <button className="btn-steam" onClick={() => setShowSteamImport(true)}>
            Steam Library
          </button>
        </div>

        <div className="stats-container">
          <span className="stat-badge stat-gog">GOG: {stats.gog}</span>
          <span className="stat-badge stat-steam">Steam: {stats.steam}</span>
          <span className="stat-badge stat-dupe">Duplicates: {stats.duplicates}</span>
        </div>
      </header>
      
      <GameLibraryTable />

      {/* Modals... */}
      {showImport && <GOGImportModal onClose={() => setShowImport(false)} />}
      {showSteamImport && <SteamSyncModal onClose={() => setShowSteamImport(false)} />}
    </>
  );
}
