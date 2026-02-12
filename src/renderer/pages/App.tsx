import React, { useEffect, useState } from 'react';
import { toast, ToastContainer, ToastIcon } from 'react-toastify';
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
import { Gamepad2 } from 'lucide-react';

const UpdateToast = () => (
  <div style={{ display: 'inline-flex', alignItems: 'center', flexWrap: 'wrap' }}>
    <span>Update Downloaded!</span>
    <button 
      onClick={() => window.api.restartApp()}
      style={{
        marginLeft: '5px',
        marginRight: '5px',
        padding: '4px 8px',
        background: '#2ecc71',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '14px',
        lineHeight: '1'
      }}
      >
      Restart Now
    </button>
    <span>to apply changes.</span>
  </div>
);

export default function App() {
  const theme = CurrentTheme();
  const [globalFilter, setGlobalFilter] = useState("");
  const [showImport, setShowImport] = useState(false);
  const [showSteamImport, setShowSteamImport] = useState(false);
  const [stats, setStats] = useState({ steam: 0, gog: 0, total: 0, duplicates: 0 });
  const [rowData, setRowData] = useState([]);
  const [showDuplicatesOnly, setShowDuplicatesOnly] = useState(false); // Add this

  // Fetch & refresh game data for table
  useEffect(() => {
    const loadGames = () => {
      window.api.getGames().then((data: any[]) => {
        // Ensure the array is sorted before it ever touches the state
        const sorted = [...data].sort((a, b) => 
          (a.normalizedTitle || "").localeCompare(b.normalizedTitle || "")
        );
        setRowData(sorted);
      });
    };
  
    loadGames();
    
    // Listen for a 'sync-complete' event from main to auto-refresh
    const unsubscribe = window.api.onSyncComplete(loadGames);

    return () => unsubscribe();
    
  }, []);

  // Listener for when a specific game finishes hydrating
  useEffect(() => {
    const handleUpdate = (data: any) => {
      // 1. Handle overall success/failure
      if (!data.success) {
        console.error(`Hydration failed: ${data.msg}`);
        toast.error(`Failed to sync: ${data.msg}`);
      } else {
        console.log(`Success! Game ${data.gameId} hydrated.`);
      }
  
      // 2. Update the local rowData state
      setRowData(prevRows => {  
        const updated = prevRows.map(row => {
          // Find the specific row that was just hydrated
          if (row.id === data.gameId) {
            const currentStores = row.stores || [];
            const updatedStores = currentStores.map((s: any) => 
              s && s.name === 'Steam' ? { ...s, os: data.os } : s
            );
  
            return { 
              ...row, 
              stores: updatedStores,
              category: data.category || row.category,
              releaseDate: data.releaseDate || row.releaseDate,
              duplicate: data.duplicate ?? row.duplicate // Update duplicate status if provided
            };
          }
          return row;
        });

        return [...updated].sort((a, b) => a.title.localeCompare(b.title));
      });
    };
  
    // Subscribe to the event
    window.api.onGameHydrated(handleUpdate);
  
    // Cleanup the listener when the component unmounts
    return () => {
      if (window.api.removeGameHydratedListener) {
          window.api.removeGameHydratedListener(handleUpdate);
      }
    };
  }, []);

  // Magic for the application updater
  useEffect(() => {
    const toastId = "app-updater";

    // Show update in progress
    const unsubscribeProgress = window.api.onUpdateProgress((percent: number) => {
      const progress = percent / 100;      // Calculate 0.0 to 1.0

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

    // Handle completion (morph the progress bar into button)
    const unsubscribeReady = window.api.onUpdateReady(() => {
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

  // Logic to filter the rows before passing them to the table
  const filteredRowData = showDuplicatesOnly 
    ? rowData.filter((game: any) => game.duplicate === true || game.duplicate === 1)
    : rowData;

  const handleSurpriseMe = () => {
    if (filteredRowData.length === 0) {
      toast.warn("No games found in the current view!");
      return;
    }

    // Pick a random game from the ALREADY filtered/sorted list
    const randomIndex = Math.floor(Math.random() * filteredRowData.length);
    const selectedGame = filteredRowData[randomIndex];

    // Notify the user
    toast.info(`Why not play: ${selectedGame.title}?`, {
      position: "top-center",
      autoClose: 5000,
      icon: <Gamepad2 className="text-blue-500" />,
      className: "border-2 border-primary border-blue-500",
    });

    // OPTIONAL: If you want the table to jump to that game, 
    // you would need to calculate the page index and set it:
    // const pageSize = 20; 
    // const pageIndex = Math.floor(randomIndex / pageSize);
    // table.setPageIndex(pageIndex); 
  };

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      
      {/* Notification */}
      <div>
        <ToastContainer 
          position="top-left"
          autoClose={3000}
          theme={theme}
        />
      </div>

      {/* Header with search input, actions, & stats */}
      <HeaderToolbar 
        stats={stats}
        searchQuery={globalFilter}
        onSearchChange={setGlobalFilter}
        onImportGOG={() => setShowImport(true)}
        onImportSteam={() => setShowSteamImport(true)}
        showDuplicatesOnly={showDuplicatesOnly}
        setShowDuplicatesOnly={setShowDuplicatesOnly}
        onSurpriseMe={handleSurpriseMe}
      />

      {/** Table that shows games */}
      <GameDataTable 
        columns={columns} 
        data={filteredRowData} 
        globalFilter={globalFilter} 
        setGlobalFilter={setGlobalFilter}
      />

      {/* Modals... */}
      {showImport && <GOGImportModal onClose={() => setShowImport(false)} />}
      {showSteamImport && <SteamSyncModal onClose={() => setShowSteamImport(false)} />}

    </div>
  );
}
