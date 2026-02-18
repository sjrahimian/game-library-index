import React, { useState, useEffect } from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
    DropdownMenu, 
    DropdownMenuContent, 
    DropdownMenuItem, 
    DropdownMenuTrigger,
    DropdownMenuSeparator 
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Layers2, Plus, RefreshCw, Search, Settings, Disc3, Dices, FolderOpen } from "lucide-react";

import { useHydration } from '../hooks/HydrationContext';

// Icons you already had
import gogLight from '../assets/icons/gog-light.svg';
import gogDark from '../assets/icons/gog-dark.svg';
import steamLogo from '../assets/icons/steam-logo.svg';
import { ThemeToggle } from './ThemeToggle';

interface HeaderToolbarProps {
  stats: {
    gog: number;
    steam: number;
    total: number;
    duplicates: number;
  };
  onImportGOG: () => void;
  onImportSteam: () => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  showDuplicatesOnly: boolean;
  setShowDuplicatesOnly: (val: boolean) => void;
  onSurpriseMe: () => void;
}

export function HeaderToolbar({ stats, onImportGOG, onImportSteam, searchQuery, onSearchChange, showDuplicatesOnly, setShowDuplicatesOnly, onSurpriseMe }: HeaderToolbarProps) {
  const [localSearch, setLocalSearch] = useState(searchQuery);
  const { isHydrating } = useHydration();
  const uniqueCount = stats.total - stats.duplicates;
  
  useEffect(() => {
    // Set a timer to update the actual table 250ms after the user stops typing
    const timer = setTimeout(() => {
      if (localSearch !== searchQuery) {
        onSearchChange(localSearch);
      }
    }, 250);

    // If the user types again before 250ms, clear the timer and start over
    return () => clearTimeout(timer);
  }, [localSearch, onSearchChange, searchQuery]);

  return (
    <Card className="flex flex-col md:flex-row items-center justify-between p-4 mb-6 gap-4 shadow-sm border-border">
      <ThemeToggle />
      {/* Left section: search bar */}
      <div className="flex items-center gap-3 w-full md:basis-1/2">
      {/* Container for the floating logic */}
        <div className="relative w-full max-w-[350px] group">
          <Input
            id="search-input"
            placeholder=" "
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="peer pl-9 bg-background h-11 pt-4 
            /* Focus styles for the blue glow */

            transition-shadow duration-200"
          />
          
          {/* search icon */}
          <div className="absolute left-2.5 top-1/2 -translate-y-1/2">
            <Search className="h-4 w-4 text-muted-foreground" />
          </div>

          {/* The floating label */}
          <label
            htmlFor="search-input"
            className="absolute left-9 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none transition-all duration-200 
              peer-focus:top-2 peer-focus:text-[10px] peer-focus:text-primary
              peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:text-[10px]"
          >
            { "Search library..."}
          </label>
        </div>
      </div>

      {/* 2. Middle section*/}
      <div className="flex items-center justify-center gap-3 flex-nowrap">
        {/* Stats badges in the same row */}
        <div className="flex items-center gap-2">
          {stats.gog > 0 && (
            <Badge variant="gog" className="py-1.5 px-3 shrink-0">
              {stats.gog}
              <img src={gogDark} alt="GOG Logo" className="w-4 h-4 ml-2 dark:hidden" />
              <img src={gogLight} alt="GOG Logo" className="w-4 h-4 ml-2 hidden dark:block" />
            </Badge>
          )}
          {stats.steam > 0 && (
            <Badge variant="steam" className="py-1.5 px-3 shrink-0">
              {stats.steam}
              <img src={steamLogo} alt="Steam" className="w-4 h-4 ml-2" />
            </Badge>
          )}

          <Badge variant="default" className="bg-accent hover:bg-accent/60 py-1.5 px-3 shrink-0">
              {stats.total}
              <Disc3 data-icon="inline-start" className="w-4 h-4 ml-1" />
          </Badge>

          {stats.duplicates > 0 && (
            <Badge onClick={() => setShowDuplicatesOnly(!showDuplicatesOnly)} variant="destructive" className="bg-duplicate hover:bg-duplicate/80 py-1.5 px-3 shrink-0 ">
              {stats.duplicates}
              <Layers2 data-icon="inline-start" className="w-4 h-4 ml-1" />
            </Badge>
          )}

        {/* Hydrating indicator */}
        {isHydrating && (
            <div className="flex items-center gap-2 text-xs font-medium text-blue-500 animate-pulse shrink-0 border-l pl-2 ml-2">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>Enriching...</span>
          </div>
        )}
        </div>
      </div>

      {/* Right section: dropdown */}
      <div className="w-full md:basis-1/4 flex justify-end">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Settings className="w-4 h-4" />
              Actions
              <ChevronDown className="w-4 h-4 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={onImportGOG} className="cursor-pointer focus:bg-accent focus:text-accent-foreground">
              <Plus className="w-4 h-4 mr-2" />
              Sync GOG
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onImportSteam} className="cursor-pointer focus:bg-accent focus:text-accent-foreground">
              <div className={`flex items-center gap-2 text-xs font-medium ${isHydrating ? "text-blue-500 animate-pulse" :  ""}`}>
                <RefreshCw className={`w-4 h-4 mr-2 ${isHydrating ? "text-blue-500 animate-spin" : ""}`} />
              </div>
              Import Steam
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-border" />
            <DropdownMenuItem onClick={() => setShowDuplicatesOnly(!showDuplicatesOnly)} className="cursor-pointer focus:bg-accent focus:text-accent-foreground">
              <Layers2 className={`w-4 h-4 mr-2 ${showDuplicatesOnly ? "text-destructive" : ""}`} />
              {showDuplicatesOnly ? "Show All Games" : "Show Duplicates Only"}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onSurpriseMe} className="cursor-pointer focus:bg-accent focus:text-accent-foreground">
              <Dices className="w-4 h-4 mr-2" />
              Pick a Random Game
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => window.api.openDatabaseFolder()} className="cursor-pointer focus:bg-accent focus:text-accent-foreground">
              <FolderOpen className="w-4 h-4 mr-2" />
              Open Database Location
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

    </Card>
  );
}