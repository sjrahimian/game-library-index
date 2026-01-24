import React, { useEffect, useState, useMemo } from 'react';
import { ModuleRegistry, AllCommunityModule, ColDef  } from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import { Game } from '../assets/types';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import '../assets/css/game-table.css';

ModuleRegistry.registerModules([AllCommunityModule]);

export default function GameLibraryTable() {
  const [games, setGames] = useState<Game[]>([]);
  const [quickFilter, setQuickFilter] = useState('');

  useEffect(() => {
    // Fetch your games from backend
    window.api.getGames().then(setGames);
  }, []);

  // Column definitions
  const columnDefs: ColDef[] = useMemo(
    () => [
      { field: 'title', headerName: 'Title', sortable: true, filter: true },
      { field: 'genre', headerName: 'Genre', sortable: true, filter: true },
      {
        field: 'stores',
        headerName: 'Stores',
        cellRenderer: (params) => (
          <>
            {params.value.map((store: string) => (
              <span
                key={store}
                className={`store-badge store-${store.toLowerCase()}`}
              >
                {store}
              </span>
            ))}
          </>
        ),
      },
      {
        field: 'pricePaid',
        headerName: 'Price Paid',
        valueFormatter: (params) => `$${params.value?.toFixed(2) || 0}`,
        sortable: true,
      },
      {
        field: 'duplicate',
        headerName: 'Duplicate',
        valueFormatter: (params) => (params.value ? 'Yes' : 'No'),
        sortable: true,
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
    <div>
      {/* Quick filter search box */}
      <div style={{ marginBottom: 10 }}>
        <input
          type="text"
          placeholder="Search..."
          value={quickFilter}
          onChange={(e) => setQuickFilter(e.target.value)}
          style={{ width: 300, padding: '6px 8px' }}
        />
      </div>

      {/* AG Grid table */}
      <div className="ag-theme-alpine" style={{ height: 500, width: '100%' }}>
        <AgGridReact
          rowData={games}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          quickFilterText={quickFilter} // 🔹 Out-of-the-box filtering
          rowClassRules={{
            'duplicate-row': (params) => Boolean(params.data.duplicate),
          }}
          pagination={true}
          paginationPageSize={10}
        />
      </div>
    </div>
  );
}
