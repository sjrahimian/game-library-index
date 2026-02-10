import React from 'react';
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
import { ChevronDown, Layers2, Plus, RefreshCw, Search, Settings, Disc3 } from "lucide-react";

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
}

export function HeaderToolbar({ stats, onImportGOG, onImportSteam, searchQuery, onSearchChange }: HeaderToolbarProps) {
  const { isHydrating } = useHydration();
  const uniqueCount = stats.total - stats.duplicates;
  
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
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
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
            <img src={gogDark} alt="GOG Logo" className="w-5 h-4 ml-2 dark:hidden" />
            <img src={gogLight} alt="GOG Logo" className="w-4 h-4 ml-2 hidden dark:block" />
          </Badge>
        )}
        {stats.steam > 0 && (
          <Badge variant="steam" className="py-1.5 px-3 shrink-0">
            {stats.steam}
            <img src={steamLogo} alt="Steam" className="dark:invert" className="w-4 h-4 ml-2" />
          </Badge>
        )}

        <Badge variant="outline" className="hover:bg-[#f0f0f0] dark:hover:bg-[#2c2c2c] py-1.5 px-3 border-slate-500 shrink-0">
            {stats.total}
            <Disc3 data-icon="inline-start" className="w-4 h-4 ml-1" />
        </Badge>

        {stats.duplicates > 0 && (
          <Badge variant="destructive" className="bg-[#f755554d] hover:bg-[#f7555566] py-1.5 px-3 shrink-0 ">
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
            <DropdownMenuSeparator className="bg-border" />
            <DropdownMenuItem onClick={onImportSteam} className="cursor-pointer focus:bg-accent focus:text-accent-foreground">
              <div className={`flex items-center gap-2 text-xs font-medium ${isHydrating ? "text-blue-500 animate-pulse" :  "text-[#1b2838] dark:text-slate-400"}`}>
                <RefreshCw className={`w-4 h-4 mr-2 ${isHydrating ? "text-blue-500 animate-spin" : "text-[#1b2838] dark:text-slate-400"}`} />
              </div>
              Import Steam
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

    </Card>
  );
}