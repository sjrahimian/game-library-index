import React, { useEffect, useState, useMemo } from 'react';
import { ModuleRegistry, AllCommunityModule, ColDef } from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import '../assets/css/game-table.css';

ModuleRegistry.registerModules([AllCommunityModule]);

export default function GameLibraryTable() {
  const [games, setGames] = useState([]);
  const [quickFilter, setQuickFilter] = useState('');

  useEffect(() => {
    // Fetch from your updated IPC handler
    window.api.getGames().then((data) => {
      setGames(data);
    });
  }, []);

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
            {params.value}
            {params.data.duplicate ? ' 📄' : ''}
          </span>
        )
      },
      { field: 'category', headerName: 'Genre', sortable: true, filter: true },
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
        field: 'releaseDate',
        headerName: 'Release Date',
        sortable: true,
      },
      {
        headerName: 'Multi-Store',
        valueGetter: (params) => (params.data.duplicate ? 'Yes' : 'No'),
        sortable: true,
        filter: true,
      },
    ],
    [],
  );

  const defaultColDef: ColDef = useMemo(
    () => ({
      flex: 1,
      minWidth: 100,
      resizable: true,
      filter: true,
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
          paginationPageSize={20}
        />
      </div>
    </div>
  );
}