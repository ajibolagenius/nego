'use client'

import { useState, useMemo, useEffect } from 'react'

interface UsePaginationOptions<T> {
  data: T[]
  itemsPerPage?: number
}

interface UsePaginationReturn<T> {
  currentData: T[]
  currentPage: number
  totalPages: number
  totalItems: number
  goToPage: (page: number) => void
  nextPage: () => void
  previousPage: () => void
  canGoNext: boolean
  canGoPrevious: boolean
  setItemsPerPage: (items: number) => void
}

export function usePagination<T>({
  data,
  itemsPerPage = 10,
}: UsePaginationOptions<T>): UsePaginationReturn<T> {
  const [currentPage, setCurrentPage] = useState(1)
  const [perPage, setPerPage] = useState(itemsPerPage)

  const totalPages = Math.ceil(data.length / perPage)
  const totalItems = data.length

  const currentData = useMemo(() => {
    const startIndex = (currentPage - 1) * perPage
    const endIndex = startIndex + perPage
    return data.slice(startIndex, endIndex)
  }, [data, currentPage, perPage])

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }

  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1)
    }
  }

  const previousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1)
    }
  }

  const canGoNext = currentPage < totalPages
  const canGoPrevious = currentPage > 1

  // Reset to page 1 when data changes significantly
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      const timer = setTimeout(() => setCurrentPage(1), 0)
      return () => clearTimeout(timer)
    }
  }, [totalPages, currentPage])

  return {
    currentData,
    currentPage,
    totalPages,
    totalItems,
    goToPage,
    nextPage,
    previousPage,
    canGoNext,
    canGoPrevious,
    setItemsPerPage: (items: number) => {
      setPerPage(items)
      setCurrentPage(1) // Reset to first page when changing items per page
    },
  }
}
