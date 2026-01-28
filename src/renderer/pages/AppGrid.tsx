import React, { useState } from 'react';

// Local libraries
// import GameLibraryTable from '../components/GameLibraryTable';
import GameLibraryTable from '../components/GameLibraryGrid';

import GOGImportModal from '../components/GOGImportModal';
import SteamSyncModal from '../components/SteamSyncModal';

export default function App() {
  const [showImport, setShowImport] = useState(false);

  return (
    <>
      <header className="toolbar">
        <button onClick={() => setShowImport(true)} style={{marginRight: 1+"em"}}>GOG Library</button>
        <button onClick={() => setShowImport(true)}>Steam Library</button>
      </header>
      <br></br>
      <GameLibraryTable />

      {showImport && <GOGImportModal onClose={() => setShowImport(false)} />}
      {showImport && <SteamSyncModal onClose={() => setShowImport(false)} />}
    </>
  );
}
