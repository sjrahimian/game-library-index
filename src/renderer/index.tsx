import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client';
import App from './pages/AppGrid';


// const container = document.getElementById('root') as HTMLElement;
// const root = createRoot(container);
// root.render(<App />);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)


// calling IPC exposed from preload script
window.electron?.ipcRenderer.once('ipc-example', (arg) => {
  // eslint-disable-next-line no-console
  console.log(arg);
});
window.electron?.ipcRenderer.sendMessage('ipc-example', ['ping']);
