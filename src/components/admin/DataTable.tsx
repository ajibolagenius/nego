'use client'

import { CaretUp, CaretDown, MagnifyingGlass, Download } from '@phosphor-icons/react'
import { useState } from 'react'

interface Column<T> {
    key: string
    label: string
    sortable?: boolean
    render?: (item: T) => React.ReactNode
    width?: string
}

interface DataTableProps<T> {
    data: T[]
    columns: Column<T>[]
    searchable?: boolean
    searchPlaceholder?: string
    exportable?: boolean
    exportFilename?: string
    onExport?: (data: T[]) => void
    emptyMessage?: string
    className?: string
}

export function DataTable<T extends Record<string, unknown>>({
    data,
    columns,
    searchable = false,
    searchPlaceholder = 'Search...',
    exportable = false,
    exportFilename: _exportFilename = 'data',
    onExport,
    emptyMessage = 'No data available',
    className = '',
}: DataTableProps<T>) {
    const [searchQuery, setSearchQuery] = useState('')
    const [sortColumn, setSortColumn] = useState<string | null>(null)
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
    const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set())

    // Filter data based on search query
    const filteredData = searchable && searchQuery
        ? data.filter(item =>
            columns.some(col => {
                const value = item[col.key]
                return value && String(value).toLowerCase().includes(searchQuery.toLowerCase())
            })
        )
        : data

    // Sort data
    const sortedData = sortColumn
        ? [...filteredData].sort((a, b) => {
            const aValue = a[sortColumn]
            const bValue = b[sortColumn]

            if (aValue === null || aValue === undefined) return 1
            if (bValue === null || bValue === undefined) return -1

            const comparison = String(aValue).localeCompare(String(bValue))
            return sortDirection === 'asc' ? comparison : -comparison
        })
        : filteredData

    const handleSort = (columnKey: string) => {
        if (sortColumn === columnKey) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
        } else {
            setSortColumn(columnKey)
            setSortDirection('asc')
        }
    }

    const handleSelectAll = () => {
        if (selectedRows.size === sortedData.length) {
            setSelectedRows(new Set())
        } else {
            setSelectedRows(new Set(sortedData.map((_, index) => index)))
        }
    }

    const handleSelectRow = (index: number) => {
        const newSelected = new Set(selectedRows)
        if (newSelected.has(index)) {
            newSelected.delete(index)
        } else {
            newSelected.add(index)
        }
        setSelectedRows(newSelected)
    }

    const handleExport = () => {
        if (onExport) {
            if (selectedRows.size > 0) {
                const selectedData = Array.from(selectedRows)
                    .map(index => sortedData[index])
                    .filter((item): item is T => item !== undefined)
                onExport(selectedData)
            } else {
                onExport(sortedData)
            }
        }
    }

    return (
        <div className={`space-y-4 ${className}`}>
            {/* Search and Export Bar */}
            {(searchable || exportable) && (
                <div className="flex flex-col sm:flex-row gap-3">
                    {searchable && (
                        <div className="relative flex-1">
                            <MagnifyingGlass
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40"
                                size={18}
                                aria-hidden="true"
                            />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder={searchPlaceholder}
                                className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[#df2531] focus:border-[#df2531]/50 transition-colors"
                                aria-label="Search table"
                            />
                        </div>
                    )}
                    {exportable && (
                        <button
                            onClick={handleExport}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-[#df2531] focus:ring-offset-2 focus:ring-offset-black"
                            aria-label="Export data"
                        >
                            <Download size={18} aria-hidden="true" />
                            <span className="text-sm font-medium">
                                {selectedRows.size > 0 ? `Export Selected (${selectedRows.size})` : 'Export All'}
                            </span>
                        </button>
                    )}
                </div>
            )}

            {/* Table */}
            <div className="overflow-x-auto rounded-xl border border-white/10 bg-white/5">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-white/10">
                            {exportable && (
                                <th className="px-4 py-3 text-left">
                                    <input
                                        type="checkbox"
                                        checked={selectedRows.size === sortedData.length && sortedData.length > 0}
                                        onChange={handleSelectAll}
                                        className="rounded border-white/20 bg-white/5 text-[#df2531] focus:ring-[#df2531]"
                                        aria-label="Select all rows"
                                    />
                                </th>
                            )}
                            {columns.map((column) => (
                                <th
                                    key={column.key}
                                    className={`px-4 py-3 text-left text-white/60 text-xs font-medium uppercase tracking-wider ${column.width || ''}`}
                                >
                                    {column.sortable ? (
                                        <button
                                            onClick={() => handleSort(column.key)}
                                            className="flex items-center gap-1 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-[#df2531] rounded"
                                            aria-label={`Sort by ${column.label}`}
                                        >
                                            {column.label}
                                            {sortColumn === column.key ? (
                                                sortDirection === 'asc' ? (
                                                    <CaretUp size={14} aria-hidden="true" />
                                                ) : (
                                                    <CaretDown size={14} aria-hidden="true" />
                                                )
                                            ) : (
                                                <span className="w-3.5" />
                                            )}
                                        </button>
                                    ) : (
                                        column.label
                                    )}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                        {sortedData.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={columns.length + (exportable ? 1 : 0)}
                                    className="px-4 py-12 text-center text-white/40"
                                >
                                    {emptyMessage}
                                </td>
                            </tr>
                        ) : (
                            sortedData.map((item, index) => (
                                <tr
                                    key={index}
                                    className="hover:bg-white/5 transition-colors"
                                >
                                    {exportable && (
                                        <td className="px-4 py-3">
                                            <input
                                                type="checkbox"
                                                checked={selectedRows.has(index)}
                                                onChange={() => handleSelectRow(index)}
                                                className="rounded border-white/20 bg-white/5 text-[#df2531] focus:ring-[#df2531]"
                                                aria-label={`Select row ${index + 1}`}
                                            />
                                        </td>
                                    )}
                                    {columns.map((column) => (
                                        <td
                                            key={column.key}
                                            className="px-4 py-3 text-white/80 text-sm"
                                        >
                                            {column.render
                                                ? column.render(item)
                                                : String(item[column.key] ?? '')}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Table Info */}
            <div className="flex items-center justify-between text-white/60 text-sm">
                <span>
                    Showing {sortedData.length} of {data.length} entries
                </span>
                {selectedRows.size > 0 && (
                    <span className="text-[#df2531]">
                        {selectedRows.size} row{selectedRows.size !== 1 ? 's' : ''} selected
                    </span>
                )}
            </div>
        </div>
    )
}
