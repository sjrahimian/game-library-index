import React, { useState } from 'react';
import '../assets/css/modal-gog.css';

type Props = {
  onClose: () => void;
};

export default function SteamSyncModal({ onClose }: Props) {
  const [loading, setLoading] = useState<'sync' | 'unofficial' | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<boolean>(false);

  // New state for inputs
  const [apiKey, setApiKey] = useState('');
  const [steamId, setSteamId] = useState('');

  const runAction = async (
    type: 'official' | 'unofficial',
  ) => {
    setStatus(null);
    setError(false);

    // 1. Validation Logic
    if (!steamId) {
      setStatus('Warning: User ID is required.');
      setError(true);
      return;
    }

    if (type === 'official' && !apiKey) {
      setStatus('Warning: API Key is required for Official Sync.');
      setError(true);
      return;
    }

    // 2. Execution Logic
    setLoading('sync');
    try {
      const result = type === 'official' 
        ? await window.api.syncSteam(apiKey, steamId) 
        : await window.api.syncSteamUnofficial(steamId);
      
      setStatus(result || `${type} sync completed successfully`);
    } catch (err: any) {
      setStatus(err?.message || `Failed to ${type} sync`);
      setError(true);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <h2>Sync Steam Library</h2>

        {/* New Input Fields */}
        <div className="input-group" style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Steam ID (Required)</label>
          <input 
            type="text" 
            value={steamId} 
            onChange={(e) => setSteamId(e.target.value)}
            placeholder="Enter SteamID64"
            style={{ width: '100%', padding: '8px' }}
          />
        </div>

        <div className="input-group" style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>API Key (Official Only)</label>
          <input 
            type="text" 
            value={apiKey} 
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Enter Steam Web API Key"
            style={{ width: '100%', padding: '8px' }}
          />
        </div>

        <div className="modal-actions">
          {/* Official Sync Button */}
          <button
            disabled={!!loading}
            onClick={() => runAction('official')}
            className="btn-primary"
          >
            Official API Sync
          </button>

          {/* Unofficial Sync Button */}
          <button
            disabled={!!loading}
            onClick={() => runAction('unofficial')}
            className="btn-secondary"
          >
            Unofficial Sync
          </button>

          <button disabled={!!loading} onClick={onClose}>
            Cancel
          </button>
        </div>

        {loading && (
          <div className="loading">
            <div className="spinner" />
            <span>Syncing games…</span>
          </div>
        )}

        {status && (
          <div className={`status ${error ? 'error' : 'success'}`}>
            {status}
          </div>
        )}
      </div>
    </div>
  );
}