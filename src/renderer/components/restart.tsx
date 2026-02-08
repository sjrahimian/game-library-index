// Custom Component for the toast
export const UpdateToast = () => (
    <div>
      Update Downloaded! Restart the app to apply changes.
      <button 
        onClick={() => window.electron.ipcRenderer.restartApp()}
        style={{
          marginLeft: '10px',
          padding: '4px 8px',
          background: '#2ecc71',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        Restart Now
      </button>
    </div>
  );