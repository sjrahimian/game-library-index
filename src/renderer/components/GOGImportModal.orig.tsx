import React, { useState } from 'react';
import { toast } from 'react-toastify';

// Local
import '../assets/css/modal.css';
import gogLight from '../assets/icons/gog-light.svg';
import gogDark from '../assets/icons/gog-light.svg';

type Props = {
  onClose: () => void;
};

export default function GOGImportModal({ onClose }: Props) {
  const [loading, setLoading] = useState<boolean>(false);

  const runAction = async (
    action: 'sync' | 'clear',
    fn: () => Promise<string>,
  ) => {
    setLoading(true);

    try {
      const result = await fn();
      if (fn.toString().includes("clearGog")){
        toast.success(`Successfully removed cookies.`);
      } else if (result) {
        toast.success(`Success! Added ${result.count} new games.`);
      }
    } catch (err: any) {
      toast.error(err?.message || `Failed to: ${action}`);
      console.error(err?.message);
      console.error(`Failed to: ${action}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <h2>
          <img width="35" alt="gog icon" src={gogLight} />
          Sync GOG Library
        </h2>

        <div className="modal-actions">
          <button disabled={!!loading}
            onClick={() => runAction('sync', () => window.api.syncGog())}
          >
            Start Sync
          </button>

          <button disabled={!!loading} 
            onClick={() => runAction('clear', () => window.api.clearGog())}>
            Clear Cookies
          </button>

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

      </div>
    </div>
  );
}
