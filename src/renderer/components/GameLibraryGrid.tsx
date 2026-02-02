import React, { useEffect, useState, useMemo, useRef } from 'react';
import { ModuleRegistry, AllCommunityModule, ColDef } from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import '../assets/css/game-table.css';
// import { FaWindows, FaApple, FaLinux } from 'react-icons/fa';


import dup from '../assets/icons/duplicate.svg';

ModuleRegistry.registerModules([AllCommunityModule]);

export default function GameLibraryTable() {
  const [rowData, setRowData] = useState([]);
  const [quickFilter, setQuickFilter] = useState('');
  const gridRef = useRef<AgGridReact>(null);

  useEffect(() => {
    window.api.getGames().then((data) => { setRowData(data); });

    // Listen for a 'sync-complete' event from main to auto-refresh
    const unsubscribe = window.api.onSyncComplete(() => {
      window.api.getGames().then(setRowData);
    });

    return () => unsubscribe();
  }, []);


// Inside GameLibraryGrid.tsx
useEffect(() => {
  const handleUpdate = (data: any) => {
    // 1. Update the React State first
    setRowData(prevRows => {
      return prevRows.map(row => {
        if (row.id === data.gameId) {
          // Safety check: Ensure stores exists before mapping
          const currentStores = row.stores || [];
          const updatedStores = currentStores.map((s: any) => 
            s && s.name === 'Steam' ? { ...s, os: data.os } : s
          );

          return { 
            ...row, 
            stores: updatedStores,
            category: data.category,
            genre: data.genre,
            releaseDate: data.releaseDate
          };
        }
        return row;
      });
    });

    const api = gridRef.current?.api;
    if (api) {
      const rowNode = api.getRowNode(data.gameId.toString());
      if (rowNode) {
        api.refreshCells({ rowNodes: [rowNode], force: true });
      }
    }
  };

  window.api.onGameHydrated(handleUpdate);
  return () => window.api.removeGameHydratedListener(handleUpdate);
}, []);

  // For the OS support
  const OS_KEYS = ['Windows', 'Mac', 'Linux'] as const;
  const OS_LETTERS: Record<string, string> = {
    'Windows': 'W',
    'Mac': 'M',
    'Linux': 'L'
  };
  
  const OSCompatibilityRenderer = (params: any) => {
    if (!params || !params.value) return null;
    const stores = params.value || [];
    if (stores.length === 0) return null;
    if (!Array.isArray(stores)) return null;


    // Ensure s and s.os exist during the loop
  
    const renderOSLetter = (osType: typeof OS_KEYS[number]) => {
      const letter = OS_LETTERS[osType];
      const lookupKey = osType.toLowerCase();
      
      const supportList = stores.filter(s => s && s.name).map((s: any) => {
        const supportOS = s.os ? (s.os[osType] === true || s.os[lookupKey] === true) : false;

        return { name: s.name, supported: supportOS };
      });

      const isSupportedAnywhere = supportList.some(s => s.supported);
      const isConsistent = supportList.every(s => s.supported === supportList[0].supported);
  
      const tooltipText = `${osType}: \n` + supportList
        .map(s => `• ${s.name}: ${s.supported ? 'Supported' : 'No'}`)
        .join('\n');
  
      return (
        <div 
          key={osType}
          title={tooltipText}
          style={{ 
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            fontWeight: 'bold',
            fontSize: '0.9rem',
            width: '20px', // Fixed width keeps letters aligned in columns
            color: !isConsistent ? '#dcba1d' : isSupportedAnywhere ? '#256e35' : '#bb382c',
            cursor: 'help'
          }}
        >
          <span style={{
              transition: 'all 0.4s ease-in-out',
              border: `1px solid ${!isConsistent ? '#8e781d' : isSupportedAnywhere ? '#d6eadf' : '#f5e2ea'}`,
              borderRadius: '3px',
              padding: '1px 4px',
              backgroundColor: !isConsistent ? '#8e781d' : isSupportedAnywhere ? '#d6eadf' : '#f5e2ea'
            }}>
            {letter}
          </span>
          
          {/* The conflict indicator badge */}
          {!isConsistent && (
            <span style={{ 
              fontSize: '7px', 
              position: 'absolute', 
              top: '-2px', 
              right: '-2px',
              borderRadius: '50%',
              width: '8px',
              height: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>!</span>
          )}
        </div>
      );
    };
  
    return (
      <div style={{ 
        display: 'flex', 
        gap: '4px', 
        alignItems: 'center', 
        height: '100%',
        fontFamily: 'monospace' // Monospace ensures letters align vertically across rows
      }}>
        {OS_KEYS.map(os => renderOSLetter(os))}
      </div>
    );
  };

  const columnDefs: ColDef[] = useMemo(
    () => [
      { 
        field: 'title', 
        headerName: 'Title', 
        sortable: true, 
        filter: true,
        // Optional: Add a small indicator for duplicates in the title cell
        cellRenderer: (params: any) => (
          <span>
            {params.data.duplicate ? '♊ ' : ''}
            {params.value}
          </span>
        )
      },
      { 
        field: 'category',
        headerName: 'Genre',
        sortable: true,
        filter: true,
        cellRenderer: (params: any) => (
          params.data.category? params.data.category : 'Unknown'
        ),
      },
      {
        field: 'stores',
        headerName: 'Stores',
        // Updated to handle the array of objects: [{name: 'GOG', ...}]
        cellRenderer: (params: any) => (
          <div className="store-badge-container">
            {params.value?.map((store: any) => (
              <span
                key={store.name}
                className={`store-badge store-${store.name.toLowerCase()}`}
              >
                {store.name}
              </span>
            ))}
          </div>
        ),
      },
      {
        headerName: 'Release Date',
        field: 'releaseDate',
        sortable: true,
        cellRenderer: (params: any) => (
            params.data.releaseDate? params.data.releaseDate : 'N/A'
        ),
      },
      {
        headerName: 'Multi-Store',
        valueGetter: (params) => (params.data.duplicate ? 'Yes' : 'No'),
        sortable: true,
        filter: true,
      },
      {
        headerName: 'OS Support',
        field: 'stores',
        cellRenderer: OSCompatibilityRenderer,
        valueFormatter: (params) => {
          const os = params.value?.[0]?.os;
          if (!os) return "";
          
          // Check both cases for each platform
          const w = os.Windows || os.windows;
          const m = os.Mac || os.mac;
          const l = os.Linux || os.linux;
          
          return `${w ? 'W' : ''}${m ? 'M' : ''}${l ? 'L' : ''}`;
        }
      },
    ],
    [],
  );

  const defaultColDef: ColDef = useMemo(
    () => ({
      flex: 1,
      minWidth: 100,
      resizable: true,
    }),
    [],
  );

  return (
    <div className="table-container">
      <div style={{ marginBottom: 10 }}>
        <input
          type="text"
          placeholder="Search library..."
          value={quickFilter}
          onChange={(e) => setQuickFilter(e.target.value)}
          style={{ width: 300, padding: '6px 8px' }}
        />
      </div>

      <div className="ag-theme-alpine" style={{ height: 'calc(100vh - 150px)', width: '100%' }}>
        <AgGridReact
          rowData={rowData}
          columnDefs={columnDefs}
          ref={gridRef}
          defaultColDef={defaultColDef}
          getRowId={(params) => params.data.id.toString()} // CRITICAL for refresh logic
          quickFilterText={quickFilter}
          // Applies your existing .duplicate-row class from CSS
          rowClassRules={{
            'duplicate-row': (params) => Boolean(params.data.duplicate),
          }}
          pagination={true}
          paginationPageSize={50}
        />
      </div>
    </div>
  );
}