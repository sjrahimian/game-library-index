import React, { useEffect, useState } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Local libraries
import GameLibraryTable from '../components/GameLibraryGrid';
import GOGImportModal from '../components/GOGImportModal';
import SteamSyncModal from '../components/SteamSyncModal';
import { useHydration } from '../hooks/HydrationContext';
import "../assets/css/App.css"

import gogLight from '../assets/icons/gog-light.svg';
import gogDark from '../assets/icons/gog-light.svg';
import steam from '../assets/icons/steam-logo.svg';

const UpdateToast = () => (
  <div>
    Update Downloaded! Restart the app to apply changes.
    <button 
      onClick={() => window.electron.ipcRenderer.restartApp()}
      style={{
        marginLeft: '10px',
        padding: '4px 8px',
        background: '#2ecc71',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer'
      }}
    >
      Restart Now
    </button>
  </div>
);

export default function App() {
  const [showImport, setShowImport] = useState(false);
  const [showSteamImport, setShowSteamImport] = useState(false);
  const [stats, setStats] = useState({ steam: 0, gog: 0, total: 0, duplicates: 0 });
  const { isHydrating } = useHydration();

  // Magic for the updater
  useEffect(() => {
    const toastId = "app-updater";

    // Show update in progress
    const unsubscribeProgress = window.electron.ipcRenderer.on('update-progress', (percent: number) => {
      // Calculate 0.0 to 1.0 for the library
      const progress = percent / 100;
      if (!toast.isActive(toastId)) {
        toast.info(`Downloading Update... ${Math.round(percent)}%`, {
          toastId: toastId,
          progress: progress,
          autoClose: false,
          closeOnClick: false,
        });
      } else {
        toast.update(toastId, {
          render: `Downloading Update... ${Math.round(percent)}%`,
          progress: progress,
        });
      }
    });

    // Handle Completion (Morphs the progress bar into the Button)
    const unsubscribeReady = window.electron.ipcRenderer.on('update-ready', () => {
      toast.update(toastId, {
        render: <UpdateToast />,
        type: 'success',
        progress: undefined,
        autoClose: false,
        closeButton: true
      });
    });

    return () => {
      if (unsubscribeProgress) unsubscribeProgress();
      if (unsubscribeReady) unsubscribeReady();
    };
  }, []);

  // Refresh stats whenever a sync completes
  const refreshStats = async () => {
    const data = await window.api.getLibraryStats();
    setStats(data);
  };

  useEffect(() => {
    refreshStats();
    return window.api.onSyncComplete(refreshStats);
  }, []);

  return (
    <>
      <header className="toolbar">
        <div className="button-group">
          <button className="btn-gog" onClick={() => setShowImport(true)}>
            <img width="30" alt="gog icon" src={gogLight} />
            GOG Library
          </button>
          <button className="btn-steam" onClick={() => setShowSteamImport(true)}>
            <img width="30" alt="steam icon" src={steam} />
            Steam Library
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
          {stats.gog !== 0 && (
            <span className="stat-badge stat-gog">
              <img width="20" alt="gog icon" src={gogLight} />
              {stats.gog}
            </span>
          )}
          {stats.steam !== 0 && (
            <span className="stat-badge stat-steam">
              <img width="20" alt="steam icon" src={steam} />
              {stats.steam}
            </span>
          )}
          {stats.total !== 0 && stats.duplicates !== 0 && (
            <span className="stat-badge stat-total">
              Unique: {stats.total - stats.duplicates}
            </span>
          )}
            <span className="stat-badge stat-total">
              Owned: {stats.total}
            </span>
          {stats.duplicates !== 0 && (
            <span className="stat-badge stat-dupe">
              Duplicates ♊ {stats.duplicates}
            </span>
          )}
        </div>
      </header>
      
      <GameLibraryTable />

      {/* Modals... */}
      {showImport && <GOGImportModal onClose={() => setShowImport(false)} />}
      {showSteamImport && <SteamSyncModal onClose={() => setShowSteamImport(false)} />}
      
      {/* Notification */}
      <div>
        <ToastContainer 
          position="top-left"
          autoClose={3000}
          theme="dark" // Matches your app's dark theme
        />
      </div>
    </>
  );
}
