import React, { useEffect, useState, useMemo } from 'react';
import { ModuleRegistry, AllCommunityModule, ColDef } from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import '../assets/css/game-table.css';
// import { FaWindows, FaApple, FaLinux } from 'react-icons/fa';


import dup from '../assets/icons/duplicate.svg';

ModuleRegistry.registerModules([AllCommunityModule]);

export default function GameLibraryTable() {
  const [games, setGames] = useState([]);
  const [quickFilter, setQuickFilter] = useState('');

  useEffect(() => {
    window.api.getGames().then((data) => { setGames(data); });

    // Listen for a 'sync-complete' event from main to auto-refresh
    const unsubscribe = window.api.onSyncComplete(() => {
      window.api.getGames().then(setGames);
    });

    return () => unsubscribe();
  }, []);
 
  const OS_KEYS = ['Windows', 'Mac', 'Linux'] as const;
  const OS_LETTERS: Record<string, string> = {
    'Windows': 'W',
    'Mac': 'M',
    'Linux': 'L'
  };
  
  const OSCompatibilityRenderer = (params: any) => {
    const stores = params.data.stores || [];
    if (stores.length === 0) return null;
  
    const renderOSLetter = (osType: typeof OS_KEYS[number]) => {
      const letter = OS_LETTERS[osType];
      
      const supportList = stores.map((s: any) => ({
        name: s.name,
        supported: !!s.os?.[osType]
      }));
  
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
            // Logic: Yellow for conflict, White for supported, Dimmed for unsupported
            color: !isConsistent ? '#ffcc00' : isSupportedAnywhere ? '#444444' : '#e22727',
            cursor: 'help'
          }}
        >
          <span style={{
              border: `1px solid ${!isConsistent ? '#ffcc00' : isSupportedAnywhere ? '#666' : '#333'}`,
              borderRadius: '3px',
              padding: '1px 4px',
              backgroundColor: isSupportedAnywhere ? 'rgba(255,255,255,0.05)' : 'transparent'
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
              background: '#ffcc00',
              color: '#000',
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
            {params.data.duplicate ? ' ✨' : ''}
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
          rowData={games}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
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