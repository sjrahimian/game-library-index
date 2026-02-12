import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { useHydration } from '../hooks/HydrationContext';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";

// Assets
import steam from '../assets/icons/steam-logo.svg';

type Props = {
  onClose: () => void;
};

export default function SteamSyncModal({ onClose }: Props) {
  const [loading, setLoading] = useState<boolean>(false);
  const { isHydrating } = useHydration();
  const [apiKey, setApiKey] = useState('');
  const [steamId, setSteamId] = useState('');

  const runAction = async () => {
    if (!steamId) return toast.warn('User ID is required.');
    if (!apiKey) return toast.warn('API Key is required.');

    setLoading(true);
    try {
      const result = await window.api.syncSteam(apiKey, steamId);
      toast.success(result.count > 0 ? `Success! Added ${result.count} games from Steam.` : "Library is up-to-date.");
    } catch (err: any) {
      toast.error(err?.message || "Failed to sync.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-4">
            <img src={steam} alt="Steam" className="w-8 h-8 shrink-0" />
            Sync Steam Library
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="steamId">Steam User ID</Label>
            <Input 
              id="steamId" 
              value={steamId} 
              onChange={(e) => setSteamId(e.target.value)} 
              placeholder="Enter your SteamID64"
              maxLength={17} // Helpful boundary
            />
            <p className="text-[10px] text-muted-foreground">
              Found in your profile URL (usually 17 digits).
            </p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="apiKey">API Key</Label>
            <Input 
              id="apiKey" 
              type="password"
              value={apiKey} 
              onChange={(e) => setApiKey(e.target.value)} 
              placeholder="Enter Official API Key"
            />
          </div>
          
          {(loading || isHydrating) && (
            <div className="flex flex-col gap-2 pt-2">
              <div className="flex items-center gap-2 text-sm text-blue-500 font-medium">
                <Loader2 className="w-4 h-4 animate-spin" />
                {isHydrating ? "Enriching data..." : "Syncing games…"}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button 
            disabled={loading || isHydrating} 
            onClick={runAction}
            className="bg-steam hover:bg-steam/80"
          >
            Official API Sync
          </Button>
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}