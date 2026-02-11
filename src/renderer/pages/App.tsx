import React, { useEffect, useState } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Local libraries
import GOGImportModal from '../components/ModalGogImport';
import SteamSyncModal from '../components/ModalSteamSync';
import { GameDataTable } from "../components/GameDataTable";
import { columns } from "../components/table/columns";
import { HeaderToolbar } from "../components/HeaderToolbar"; // Import the new component
import { CurrentTheme } from "../hooks/CurrentTheme";
import "../assets/css/App.css"
import "../assets/css/dist.css"

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
  const theme = CurrentTheme();
  const [globalFilter, setGlobalFilter] = useState("");
  const [showImport, setShowImport] = useState(false);
  const [showSteamImport, setShowSteamImport] = useState(false);
  const [stats, setStats] = useState({ steam: 0, gog: 0, total: 0, duplicates: 0 });
  const [rowData, setRowData] = useState([]);

  useEffect(() => {
    window.api.getGames().then(setRowData);
    
    // Your existing hydration/sync listeners go here, 
    // just calling setRowData(newData) will refresh the TanStack table.
  }, []);

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
    <div className="mx-auto max-w-5xl px-6 py-8">
      {/* Header with search input, actions, & stats */}
      <HeaderToolbar 
        stats={stats}
        searchQuery={globalFilter}
        onSearchChange={setGlobalFilter}
        onImportGOG={() => setShowImport(true)}
        onImportSteam={() => setShowSteamImport(true)}
      />

      {/** Table that shows games */}
      <GameDataTable 
        columns={columns} 
        data={rowData} 
        globalFilter={globalFilter} 
        setGlobalFilter={setGlobalFilter}
      />

      {/* Modals... */}
      {showImport && <GOGImportModal onClose={() => setShowImport(false)} />}
      {showSteamImport && <SteamSyncModal onClose={() => setShowSteamImport(false)} />}
      
      {/* Notification */}
      <div>
        <ToastContainer 
          position="top-left"
          autoClose={3000}
          theme={ theme }
        />
      </div>
    </div>
  );
}
