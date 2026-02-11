import React, { useState } from 'react';
import { toast } from 'react-toastify';

// Local
import { useHydration } from '../hooks/HydrationContext';

import '../assets/css/modal.css';
import steam from '../assets/icons/steam-logo.svg';

type Props = {
  onClose: () => void;
};

export default function SteamSyncModal({ onClose }: Props) {
  const [loading, setLoading] = useState<boolean>(false);
  const { isHydrating } = useHydration();

  // New state for inputs
  const [apiKey, setApiKey] = useState('');
  const [steamId, setSteamId] = useState('');

  const runAction = async (type: 'official' | 'unofficial') => {

    // Validation Logic
    if (!steamId) {
      toast.warn('Warning: User ID is required.');
      return;
    }

    if (type === 'official' && !apiKey) {
      toast.warn('Warning: API Key is required for Official Sync.');
      return;
    }

    // 2. Execution Logic
    setLoading(true);
    try {
      const result = type === 'official' 
        ? await window.api.syncSteam(apiKey, steamId) 
        : await window.api.syncSteamUnofficial(steamId);
      
      toast.success(`Success! Added ${result.count} new games.`);
    } catch (err: any) {
      console.error(err);
      if (err?.message.includes("Failed to parse Steam response")) {
        toast.error("Failed library sync. Provide correct User ID and API Key.")
      } else {
        toast.error(err?.message || `Failed to sync.`);
      }

    } finally {
      setLoading(false);
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
            disabled={!!loading || !!isHydrating}
            onClick={() => runAction('official')}
            className="btn-primary"
          >
            Official API Sync
          </button>

          {/* Unofficial Sync Button */}
          {/* <button
            disabled
            onClick={() => runAction('unofficial')}
            className="btn-secondary"
          >
            Unofficial Sync
          </button> */}

          <button disabled={!!loading} onClick={onClose}>
            Close
          </button>
        </div>

        {loading && (
          <div className="loading">
            <div className="spinner" />
            <span>Syncing games…</span>
          </div>
        )}

        {isHydrating && (
          <div className="loading">
            <div className="spinner" />
            <span>Enriching data...</span>
          </div>
        )}

      </div>
    </div>
  );
}