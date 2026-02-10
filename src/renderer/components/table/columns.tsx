import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Check, Layers2, X } from "lucide-react";

export type Store = {
  name: string;
  os?: { Windows?: boolean; windows?: boolean; Mac?: boolean; mac?: boolean; Linux?: boolean; linux?: boolean; };
};

export type Game = {
  id: string | number;
  title: string;
  category?: string;
  releaseDate?: string;
  duplicate?: boolean;
  stores: Store[];
};

export const columns: ColumnDef<Game>[] = [
  {
    accessorKey: "title",
    header: "Title",
    cell: ({ row }) => {
      const title = row.getValue("title") as string;
      const isTruncated = title.length > 35;
      const displayTitle = isTruncated 
        ? title.substring(0, 35) + "..." 
        : title;
  
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-2 cursor-default">
                {row.original.duplicate &&  <span title="Duplicate">
                  <Layers2 className="w-3 h-3 mr-2" />
                </span> }
                <span className="font-medium">{displayTitle}</span>
              </div>
            </TooltipTrigger>
            {/* Only show the tooltip if the title was truncated */}
            {isTruncated && (
              <TooltipContent>
                <p className="max-w-xs">{title}</p>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      );
    },
  },
  {
    accessorKey: "category",
    header: "Genre",
    cell: ({ row }) => row.getValue("category") || "Unknown",
  },
  {
    accessorKey: "stores",
    header: "Stores",
    cell: ({ row }) => (
      <div className="flex gap-1">
        {(row.getValue("stores") as Store[])?.map((store) => (
          <Badge 
            key={store.name} 
            variant={`${store.name.toLowerCase()}`}
            className="pointer-events-none"
          >
            {store.name}
          </Badge>
        ))}
      </div>
    ),
  },
  {
    accessorKey: "releaseDate",
    header: "Release Date",
    cell: ({ row }) => row.getValue("releaseDate") || "N/A",
  },
  {
    id: "osSupport",
    header: "Platform",
    cell: ({ row }) => {
      const stores = row.original.stores || [];
      const osList = [
        { label: "W", key: "Windows" },
        { label: "M", key: "Mac" },
        { label: "L", key: "Linux" },
      ];

      return (
        <div className="flex gap-1 font-mono">
          {osList.map(({ label, key }) => {
            const support = stores.map(s => {
              const hasSupport = s.os ? (s.os[key as keyof typeof s.os] || s.os[key.toLowerCase() as keyof typeof s.os]) : false;
              return { name: s.name, supported: !!hasSupport };
            });

            const isSupportedAnywhere = support.some(s => s.supported);
            const isConsistent = support.every(s => s.supported === support[0].supported);

            return (
              <TooltipProvider key={key}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className={`px-1.5 border rounded text-xs font-bold cursor-help relative
                      ${!isConsistent ? "bg-yellow-600 border-yellow-700 text-white" : 
                        isSupportedAnywhere ? "bg-green-100 border-green-300 text-green-800" : "bg-red-100 border-red-300 text-red-800"}`}
                    >
                      {label}
                      {!isConsistent && <span className="absolute -top-1 -right-1 text-[8px]">!</span>}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="font-bold border-b mb-1">{key}</p>
                    {support.map(s => (
                      <div>
                        <p key={s.name} className="flex items-center gap-0.5 text-xs">
                          {s.name}: {s.supported ? <Check className="w-4 h-4 text-green-600" /> : <X className="w-4 h-4 text-red-600" />}
                        </p>
                      </div>
                    ))}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          })}
        </div>
      );
    },
  },
];