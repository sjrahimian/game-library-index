import React, { useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  PaginationState,
  flexRender,
  ColumnDef,
  FilterFn
} from "@tanstack/react-table";
import { rankItem } from '@tanstack/match-sorter-utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Disc3, Plus, Search } from "lucide-react";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  globalFilter: string; // For search
  setGlobalFilter: (val: string) => void;
}


const fuzzyFilter: FilterFn<any> = (row, columnId, value, addMeta) => {
  const itemRank = rankItem(row.getValue(columnId), value);
  addMeta({ itemRank, });
  return itemRank.passed;
};

function GameDataTableInner<TData, TValue>({ columns, data, globalFilter, setGlobalFilter }: DataTableProps<TData, TValue>) {

// Initialize pagination state
const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 20, // Default
  });

  const table = useReactTable({
    data,
    columns,
    filterFns: {
      fuzzy: fuzzyFilter, // 1. Register the function
    },
    state: { 
      globalFilter,
      pagination,
    },
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: 'fuzzy',
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <div className="space-y-4">
      {/* Search input logic */}
      {/* <Input
        placeholder="Search library..."
        value={globalFilter ?? ""}
        onChange={(e) => setGlobalFilter(e.target.value)}
        className="max-w-sm"
      /> */}

      {/* Table container logic */}          
      <div className="rounded-md border bg-card text-card-foreground shadow flex flex-col h-[550px]">
        <div className="relative flex-1 overflow-auto"> 
          <Table className="border-separate border-spacing-0">

            {/* Sticky header */}
            <TableHeader className="bg-muted/50 sticky top-0 z-20">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}> 
                  {headerGroup.headers.map((header) => (
                    <TableHead 
                      key={header.id} 
                      className="font-bold py-4 text-xs uppercase tracking-wider bg-card/80 text-muted-foreground border-b shadow-sm"
                    >
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>

            {/* Body content */}
            <TableBody>
              {data.length === 0 ? (
                /** Case 1 - No games exist in database */
                <TableRow className="hover:bg-transparent! bg-transparent!">
                  <TableCell colSpan={columns.length} className="h-82 text-center">
                    <div className="flex flex-col items-center justify-center gap-4 text-muted-foreground">
                      <div className="relative">
                        <Disc3 className="w-18 h-18 opacity-15 animate-spin-slow" />
                        <Plus className="w-8 h-8 absolute -bottom-2 -right-2 opacity-40" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-xl font-semibold text-foreground">Your library is empty</p>
                        <p className="text-sm max-w-[250px] mx-auto">
                          Import your games from Steam or GOG to get started.
                        </p>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>

              ) : table.getRowModel().rows?.length ? (
                /** Case 2 - Games exist */
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id} 
                  className={(row.original as any).duplicate ? "bg-duplicate hover:bg-duplicate/80" : ""}>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                      ))}
                  </TableRow>
                ))
              ) : (
                /** Case 3 - Games exist but no search hits */
                <TableRow className="hover:bg-transparent! bg-transparent!">
                  <TableCell colSpan={columns.length} className="h-82 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-4 ">
                      <Search className="w-16 h-16 opacity-40" />
                      <p>No games found matching "{globalFilter}".</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}

            </TableBody>
          </Table>
        </div>
      </div>
      
      {/* --- PAGINATION FOOTER --- */}
      <div className="flex items-center justify-between px-2 py-4">
        <div className="flex items-center gap-6">
          {/* Page Size Selector */}
          <div className="flex items-center space-x-2">
            <p className="text-sm font-medium">Rows per page</p>
            <Select
              value={`${table.getState().pagination.pageSize}`}
              onValueChange={(value) => {
                table.setPageSize(Number(value));
              }}
            >
              <SelectTrigger className="h-8 w-[70px]">
                <SelectValue placeholder={table.getState().pagination.pageSize} />
              </SelectTrigger>
              <SelectContent side="top" className="bg-popover text-popover-foreground">
                {[10, 20, 50, 100].map((pageSize) => (
                  <SelectItem key={pageSize} value={`${pageSize}`}>
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Page Counter: "Page X of Y" */}
          <div className="flex w-[100px] items-center justify-center text-sm font-medium">
            Page {table.getState().pagination.pageIndex + 1} of{" "}
            {table.getPageCount()}
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            className="hidden h-8 w-8 p-0 lg:flex"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            {"<<"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
          <Button
            variant="outline"
            className="hidden h-8 w-8 p-0 lg:flex"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
          >
            {">>"}
          </Button>
        </div>
      </div>

    </div>
  );
}

export const GameDataTable = React.memo(GameDataTableInner) as typeof GameDataTableInner;