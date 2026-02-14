import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, ArrowUpDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export default function DataTable({
  columns = [],
  data = [],
  selectable = false,
  selectedRows = [],
  onSelectRow,
  onSelectAll,
  onRowClick,
  actions,
  sortColumn,
  sortDirection,
  onSort,
  emptyState,
  loading = false
}) {
  const allSelected = selectable && selectedRows.length === data.length && data.length > 0;
  const someSelected = selectable && selectedRows.length > 0 && selectedRows.length < data.length;

  return (
    <div className="border border-slate-200 rounded-lg bg-white overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            {selectable && (
              <TableHead className="w-12">
                <Checkbox
                  checked={allSelected}
                  indeterminate={someSelected}
                  onCheckedChange={onSelectAll}
                  aria-label="Select all"
                />
              </TableHead>
            )}
            {columns.map((column) => (
              <TableHead 
                key={column.key}
                className={cn(
                  column.sortable && "cursor-pointer select-none hover:bg-slate-50",
                  column.className
                )}
                onClick={() => column.sortable && onSort?.(column.key)}
              >
                <div className="flex items-center gap-2">
                  {column.label}
                  {column.sortable && (
                    <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
                  )}
                </div>
              </TableHead>
            ))}
            {actions && <TableHead className="w-12" />}
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            Array.from({ length: 5 }).map((_, idx) => (
              <TableRow key={idx}>
                {selectable && <TableCell />}
                {columns.map((col) => (
                  <TableCell key={col.key}>
                    <div className="h-4 bg-slate-100 rounded animate-pulse w-3/4" />
                  </TableCell>
                ))}
                {actions && <TableCell />}
              </TableRow>
            ))
          ) : data.length === 0 ? (
            <TableRow>
              <TableCell 
                colSpan={columns.length + (selectable ? 1 : 0) + (actions ? 1 : 0)}
                className="h-32 text-center"
              >
                {emptyState || (
                  <div className="text-slate-500">
                    <p className="text-sm">No data available</p>
                  </div>
                )}
              </TableCell>
            </TableRow>
          ) : (
            data.map((row, idx) => {
              const isSelected = selectedRows.includes(row.id);
              return (
                <TableRow
                  key={row.id || idx}
                  className={cn(
                    onRowClick && "cursor-pointer",
                    isSelected && "bg-slate-50"
                  )}
                  onClick={() => onRowClick?.(row)}
                >
                  {selectable && (
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => onSelectRow?.(row.id)}
                        aria-label={`Select row ${idx + 1}`}
                      />
                    </TableCell>
                  )}
                  {columns.map((column) => (
                    <TableCell key={column.key} className={column.className}>
                      {column.render ? column.render(row) : row[column.key]}
                    </TableCell>
                  ))}
                  {actions && (
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {actions(row).map((action, actionIdx) => (
                            <React.Fragment key={actionIdx}>
                              {action.separator ? (
                                <DropdownMenuSeparator />
                              ) : (
                                <DropdownMenuItem 
                                  onClick={() => action.onClick(row)}
                                  className={action.destructive ? 'text-red-600' : ''}
                                >
                                  {action.icon && <action.icon className="h-4 w-4 mr-2" />}
                                  {action.label}
                                </DropdownMenuItem>
                              )}
                            </React.Fragment>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  )}
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}