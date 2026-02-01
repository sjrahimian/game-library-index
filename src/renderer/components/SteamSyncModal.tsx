import React, { useState } from 'react';

// Local
import '../assets/css/modal.css';
import steam from '../assets/icons/steam-logo.svg';

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

  const runAction = async (type: 'official' | 'unofficial') => {
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
      
      setStatus(`Success! Added ${result.count} new games.`);
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
        <h2>
          <img width="35" alt="steam icon" src={steam} />
          Sync Steam Library
        </h2>

        {/* New Input Fields */}
        <div className="input-group">
          <input 
            type="text" 
            id="steamId"
            value={steamId} 
            onChange={(e) => setSteamId(e.target.value)}
            placeholder=" "
          />
          <label htmlFor="steamId">Steam User ID (Required)</label>
        </div>

        <div className="input-group">
          <input 
            type="text" 
            id="apiKey"
            value={apiKey} 
            onChange={(e) => setApiKey(e.target.value)}
            placeholder=" " 
          />
          <label htmlFor="apiKey">API Key (Official Only)</label>
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
            disabled
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