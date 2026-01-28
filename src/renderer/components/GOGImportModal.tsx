import React, { useState } from 'react';

import '../assets/css/modal-gog.css';

type Props = {
  onClose: () => void;
};

export default function GOGImportModal({ onClose }: Props) {
  const [loading, setLoading] = useState<'login' | 'import' | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<boolean>(false);

  const runAction = async (
    action: 'sync' | 'other',
    fn: () => Promise<string>,
  ) => {
    setLoading(action);
    setStatus(null);
    setError(false);

    try {
      const result = await fn();
      console.log(result)
      setStatus(result || `${action} completed successfully`);
    } catch (err: any) {
      setStatus(err?.message || `Failed to ${action}`);
      setError(true);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <h2>Sync GOG Library</h2>

        <div className="modal-actions">
          <button
            disabled={!!loading}
            onClick={() => runAction('sync', () => window.api.syncGog())}
          >
            Start Sync
          </button>

          <button disabled={!!loading} onClick={onClose}>
            Cancel
          </button>
        </div>

        {loading && (
          <div className="loading">
            <div className="spinner" />
            <span>
              {loading === 'sync'
                ? 'Waiting for GOG sync'
                : 'Importing games…'}
            </span>
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
