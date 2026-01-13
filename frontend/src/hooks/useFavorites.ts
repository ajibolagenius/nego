'use client'

import { useState, useEffect, useCallback } from 'react'

const FAVORITES_KEY_PREFIX = 'nego_favorites_'

export function useFavorites(userId: string | undefined) {
  const [favorites, setFavorites] = useState<string[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  // Load favorites from localStorage
  useEffect(() => {
    if (!userId) return
    
    try {
      const stored = localStorage.getItem(`${FAVORITES_KEY_PREFIX}${userId}`)
      if (stored) {
        setFavorites(JSON.parse(stored))
      }
    } catch (error) {
      console.error('Error loading favorites:', error)
    }
    setIsLoaded(true)
  }, [userId])

  // Save to localStorage
  const saveFavorites = useCallback((newFavorites: string[]) => {
    if (!userId) return
    
    try {
      localStorage.setItem(`${FAVORITES_KEY_PREFIX}${userId}`, JSON.stringify(newFavorites))
      setFavorites(newFavorites)
      // Dispatch custom event so other components can react
      window.dispatchEvent(new CustomEvent('favoritesUpdated', { detail: newFavorites }))
    } catch (error) {
      console.error('Error saving favorites:', error)
    }
  }, [userId])

  const addFavorite = useCallback((talentId: string) => {
    if (!favorites.includes(talentId)) {
      saveFavorites([...favorites, talentId])
    }
  }, [favorites, saveFavorites])

  const removeFavorite = useCallback((talentId: string) => {
    saveFavorites(favorites.filter(id => id !== talentId))
  }, [favorites, saveFavorites])

  const toggleFavorite = useCallback((talentId: string) => {
    if (favorites.includes(talentId)) {
      removeFavorite(talentId)
    } else {
      addFavorite(talentId)
    }
  }, [favorites, addFavorite, removeFavorite])

  const isFavorite = useCallback((talentId: string) => {
    return favorites.includes(talentId)
  }, [favorites])

  // Listen for changes from other components
  useEffect(() => {
    const handleUpdate = (event: CustomEvent<string[]>) => {
      setFavorites(event.detail)
    }
    
    window.addEventListener('favoritesUpdated', handleUpdate as EventListener)
    return () => {
      window.removeEventListener('favoritesUpdated', handleUpdate as EventListener)
    }
  }, [])

  return {
    favorites,
    isLoaded,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    isFavorite,
  }
}
