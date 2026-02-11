import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";

// Assets
import gogLight from '../assets/icons/gog-light.svg';
import gogDark from '../assets/icons/gog-dark.svg';


type Props = {
  onClose: () => void;
};

export default function GOGImportModal({ onClose }: Props) {
  const [loading, setLoading] = useState<boolean>(false);

  const runAction = async (action: 'sync' | 'clear', fn: () => Promise<any>) => {
    setLoading(true);
    try {
      const result = await fn();
      if (action === 'clear') {
        toast.success(`Successfully removed cookies.`);
      } else if (result) {
        toast.success(`Success! Added ${result.count} new games.`);
      }
    } catch (err: any) {
      toast.error(err?.message || `Failed to: ${action}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-4">
            <img src={gogDark} alt="GOG Logo" className="w-8 h-8 shrink-0 dark:hidden" />
            <img src={gogLight} alt="GOG Logo" className="w-8 h-8 shrink-0 hidden dark:block" />
            Sync GOG Library
          </DialogTitle>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {loading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground animate-pulse">
              <Loader2 className="w-4 h-4 animate-spin" />
              Syncing games…
            </div>
          )}
        </div>

        <DialogFooter className="flex-row justify-end gap-2">
          <Button 
            variant="default" 
            className="bg-[#86328a] hover:bg-[#86328a]/90 text-white" 
            disabled={loading} 
            onClick={() => runAction('sync', () => window.api.syncGog())}
          >
            Start Sync
          </Button>
          <Button 
            variant="secondary" 
            disabled={loading} 
            onClick={() => runAction('clear', () => window.api.clearGog())}
          >
            Clear Cookies
          </Button>
          <Button variant="ghost" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}