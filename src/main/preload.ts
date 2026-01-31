// Disable no-unused-vars, broken for spread args
/* eslint no-unused-vars: off */
import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

export type Channels = 'ipc-example';

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
  },
};


contextBridge.exposeInMainWorld('api', {
  getGames: () => ipcRenderer.invoke('get-games'),
  getLibraryStats: () => ipcRenderer.invoke('get-stats'),
  syncGog: () => ipcRenderer.invoke('sync:gog'),
  syncSteam: (apiKey: string, steamId: string) => ipcRenderer.invoke('sync:steam', apiKey, steamId),
  syncSteamUnofficial: (steamId: string) => ipcRenderer.invoke('sync:steamNoApi', steamId),
  onSyncComplete: (callback) => {
    // When 'sync-complete' arrives, run the callback provided by the frontend
    const subscription = (_event, ...args) => callback(...args);
    ipcRenderer.on('sync-complete', subscription);

    // Return an unsubscribe function to prevent memory leaks
    return () => ipcRenderer.removeListener('sync-complete', subscription);
  },
});

contextBridge.exposeInMainWorld('electron', electronHandler);

export type ElectronHandler = typeof electronHandler;
