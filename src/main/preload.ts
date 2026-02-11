// Disable no-unused-vars, broken for spread args
/* eslint no-unused-vars: off */
import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

export type Channels = 
  | 'ipc-example' 
  | 'update-progress' 
  | 'update-ready'
  | 'restart-app';
  
const electronHandler = {
  ipcRenderer: {
    sendMessage(channel: Channels, ...args: unknown[]) {
      ipcRenderer.send(channel, ...args);
    },
    on(channel: Channels, func: (...args: unknown[]) => void) {
      const subscription = (_event: IpcRendererEvent, ...args: unknown[]) =>
        func(...args);
      ipcRenderer.on(channel, subscription);

      return () => {
        ipcRenderer.removeListener(channel, subscription);
      };
    },
    once(channel: Channels, func: (...args: unknown[]) => void) {
      ipcRenderer.once(channel, (_event, ...args) => func(...args));
    },
    restartApp() {
      ipcRenderer.send('restart-app');
    },
  },
};


contextBridge.exposeInMainWorld('api', {
  
  getGames: () => ipcRenderer.invoke('get-games'),
  getLibraryStats: () => ipcRenderer.invoke('get-stats'),
  syncGog: () => ipcRenderer.invoke('sync:gog'),
  clearGog: () => ipcRenderer.invoke('clear:gog'),
  syncSteam: (apiKey: string, steamId: string) => ipcRenderer.invoke('sync:steam', apiKey, steamId),
  syncSteamUnofficial: (steamId: string) => ipcRenderer.invoke('sync:steamNoApi', steamId),
  onSyncComplete: (callback) => {
    // When 'sync-complete' arrives, run the callback provided by the frontend
    const subscription = (_event: any, ...args: any[]) => callback(...args);
    ipcRenderer.on('sync-complete', subscription);
    // Cleanup
    return () => ipcRenderer.removeListener('sync-complete', subscription);
  },
  
  // --- HYDRATION LISTENERS ---
  // Start signal
  onHydrationStarted: (callback) => ipcRenderer.on('hydration-started', () => callback()),
  onHydrationFinished: (callback) => ipcRenderer.on('hydration-finished', () => callback()),
  onGameHydrated: (callback) => ipcRenderer.on('game-hydrated', (_event, data) => callback(data)),

  // Cleanup methods
  removeHydrationStartedListener: (callback) => ipcRenderer.removeListener('hydration-started', callback),
  removeHydrationFinishedListener: (callback) => ipcRenderer.removeListener('hydration-finished', callback),
  removeGameHydratedListener: (callback) => ipcRenderer.removeListener('game-hydrated', callback),

});

contextBridge.exposeInMainWorld('electron', electronHandler);

export type ElectronHandler = typeof electronHandler;
