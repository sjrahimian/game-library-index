import React, { useState } from 'react';

// Local libraries
// import GameLibraryTable from '../components/GameLibraryTable';
import GameLibraryTable from '../components/GameLibraryTan';

import GOGImportModal from '../components/GOGImportModal';

export default function App() {
  const [showImport, setShowImport] = useState(false);

  return (
    <>
      <header className="toolbar">
        <button onClick={() => setShowImport(true)}>Sync GOG Library</button>
      </header>

      <GameLibraryTable />

      {showImport && <GOGImportModal onClose={() => setShowImport(false)} />}
    </>
  );
}
