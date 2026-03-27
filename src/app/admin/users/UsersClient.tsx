'use client'

import {
    User,
    MagnifyingGlass,
    ArrowClockwise,
    Trash,
    Calendar,
    MapPin,
    IdentificationBadge,
    Trophy
} from '@phosphor-icons/react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/admin/ConfirmDialog'
import { EmptyState } from '@/components/admin/EmptyState'
import { Pagination } from '@/components/admin/Pagination'
import { Button } from '@/components/ui/button'
import { usePagination } from '@/hooks/admin/usePagination'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/types/database'

interface UsersClientProps {
    users: Profile[]
}

export function UsersClient({ users: initialUsers }: UsersClientProps) {
    const router = useRouter()
    const supabase = createClient()
    const [users, setUsers] = useState<Profile[]>(initialUsers)
    const [roleFilter, setRoleFilter] = useState<'all' | 'client' | 'talent' | 'admin'>('all')
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedUser, setSelectedUser] = useState<Profile | null>(null)
    const [isProcessing, setIsProcessing] = useState(false)
    const [showConfirmDelete, setShowConfirmDelete] = useState(false)
    const [isRefreshing, setIsRefreshing] = useState(false)

    const refreshUsers = useCallback(async () => {
        setIsRefreshing(true)
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select(`
                    id,
                    role,
                    username,
                    full_name,
                    display_name,
                    avatar_url,
                    location,
                    bio,
                    is_verified,
                    status,
                    created_at,
                    updated_at
                `)
                .order('created_at', { ascending: false })
                .limit(2000)

            if (error) throw error

            if (data) {
                setUsers(data as Profile[])
            }
        } catch (error) {
            console.error('[UsersClient] Error refreshing users:', error)
            toast.error('Failed to refresh users')
        } finally {
            setIsRefreshing(false)
        }
    }, [supabase])

    // Filter and search users
    const filteredUsers = users.filter((user) => {
        // Role filter
        if (roleFilter !== 'all' && user.role !== roleFilter) return false

        // Search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase()
            const searchFields = [
                user.display_name,
                user.full_name,
                user.username,
                user.location,
                user.role
            ].filter(Boolean).join(' ').toLowerCase()

            if (!searchFields.includes(query)) return false
        }

        return true
    })

    const {
        currentPage,
        totalPages,
        currentData: paginatedData,
        goToPage,
        setItemsPerPage
    } = usePagination({ data: filteredUsers, itemsPerPage: 20 })

    const handleDelete = (user: Profile) => {
        setSelectedUser(user)
        setShowConfirmDelete(true)
    }

    const confirmDelete = async () => {
        if (!selectedUser) return

        setIsProcessing(true)
        try {
            const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
                method: 'DELETE',
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Failed to delete user')
            }

            setShowConfirmDelete(false)
            toast.success('User Deleted', {
                description: `${selectedUser.display_name || selectedUser.username || 'User'} has been permanently deleted.`
            })

            setUsers(prev => prev.filter(u => u.id !== selectedUser.id))
            setSelectedUser(null)
            router.refresh()
        } catch (error) {
            console.error('Error deleting user:', error)
            const errorMessage = error instanceof Error ? error.message : 'Failed to delete user. Please try again.'
            toast.error('Deletion Failed', { description: errorMessage })
        } finally {
            setIsProcessing(false)
        }
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        })
    }

    return (
        <div className="p-6 lg:p-8">
            {/* Header */}
            <div className="mb-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">User Management</h1>
                        <p className="text-white/60">Manage all registered accounts (Clients, Talents, Admins)</p>
                    </div>
                    <Button
                        onClick={refreshUsers}
                        disabled={isRefreshing}
                        variant="outline"
                        className="bg-white/5 border-white/10 text-white hover:bg-white/10"
                    >
                        <ArrowClockwise size={18} className={isRefreshing ? 'animate-spin' : ''} />
                        Refresh
                    </Button>
                </div>

                {/* Search and Filters */}
                <div className="flex flex-col sm:flex-row gap-4">
                    {/* Search */}
                    <div className="flex-1 relative">
                        <MagnifyingGlass
                            size={20}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40"
                        />
                        <input
                            type="text"
                            placeholder="Search by name, username, role..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-[#df2531]/50"
                        />
                    </div>

                    {/* Role Filter Buttons */}
                    <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 no-scrollbar">
                        {(['all', 'client', 'talent', 'admin'] as const).map((role) => (
                            <button
                                key={role}
                                onClick={() => setRoleFilter(role)}
                                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors whitespace-nowrap capitalize ${roleFilter === role
                                        ? 'bg-[#df2531] text-white'
                                        : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                                    }`}
                            >
                                {role} ({role === 'all' ? users.length : users.filter(u => u.role === role).length})
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Users Table */}
            {paginatedData.length === 0 ? (
                <EmptyState
                    icon={User}
                    title="No users found"
                    description={
                        searchQuery || roleFilter !== 'all'
                            ? 'Try adjusting your search or filter criteria'
                            : 'No users have registered yet'
                    }
                />
            ) : (
                <>
                    <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
                        {/* Desktop Table View */}
                        <div className="hidden lg:block overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-white/5 border-b border-white/10">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-white/60 uppercase tracking-wider">
                                            User
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-white/60 uppercase tracking-wider">
                                            Role
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-white/60 uppercase tracking-wider">
                                            Username
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-white/60 uppercase tracking-wider">
                                            Joined
                                        </th>
                                        <th className="px-6 py-4 text-right text-xs font-medium text-white/60 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/10">
                                    {paginatedData.map((user) => (
                                        <tr
                                            key={user.id}
                                            className="hover:bg-white/5 transition-colors"
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center overflow-hidden">
                                                        {user.avatar_url ? (
                                                            <Image
                                                                src={user.avatar_url}
                                                                alt={user.display_name || user.username || 'User'}
                                                                width={40}
                                                                height={40}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        ) : (
                                                            <User size={20} className="text-white/40" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="text-white font-medium">
                                                            {user.display_name || user.full_name || 'No name'}
                                                        </p>
                                                        {user.location && (
                                                            <p className="text-white/40 text-xs flex items-center gap-1">
                                                                <MapPin size={10} /> {user.location}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium capitalize ${user.role === 'admin'
                                                        ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                                                        : user.role === 'talent'
                                                            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                                            : 'bg-green-500/20 text-green-400 border border-green-500/30'
                                                    }`}>
                                                    {user.role === 'admin' && <IdentificationBadge size={14} />}
                                                    {user.role === 'talent' && <Trophy size={14} />}
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-white/80">@{user.username || 'n/a'}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-1 text-white/60">
                                                    <Calendar size={14} />
                                                    <span className="text-sm">{formatDate(user.created_at)}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button
                                                        onClick={() => handleDelete(user)}
                                                        variant="outline"
                                                        size="sm"
                                                        className="bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20"
                                                    >
                                                        <Trash size={16} />
                                                        <span className="hidden lg:inline ml-2">Delete</span>
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile List View */}
                        <div className="lg:hidden divide-y divide-white/10">
                            {paginatedData.map((user) => (
                                <div key={user.id} className="p-4 hover:bg-white/5 transition-colors">
                                    <div className="flex items-start justify-between gap-4 mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center overflow-hidden shrink-0">
                                                {user.avatar_url ? (
                                                    <Image
                                                        src={user.avatar_url}
                                                        alt={user.display_name || user.username || 'User'}
                                                        width={48}
                                                        height={48}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <User size={24} className="text-white/40" />
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-medium text-white">{user.display_name || user.full_name || 'No name'}</p>
                                                <p className="text-xs text-[#df2531]">@{user.username || 'n/a'}</p>
                                            </div>
                                        </div>
                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${user.role === 'admin'
                                                ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                                                : user.role === 'talent'
                                                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                                    : 'bg-green-500/20 text-green-400 border border-green-500/30'
                                            }`}>
                                            {user.role}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 mb-4 text-[13px]">
                                        <div>
                                            <p className="text-white/40 uppercase font-bold text-[10px] mb-0.5 tracking-wider">Joined</p>
                                            <div className="flex items-center gap-1.5 text-white/80">
                                                <Calendar size={12} className="text-[#df2531]" />
                                                <p>{formatDate(user.created_at)}</p>
                                            </div>
                                        </div>
                                        {user.location && (
                                            <div>
                                                <p className="text-white/40 uppercase font-bold text-[10px] mb-0.5 tracking-wider">Location</p>
                                                <div className="flex items-center gap-1.5 text-white/80">
                                                    <MapPin size={12} className="text-[#df2531]" />
                                                    <p className="truncate">{user.location}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <Button
                                        onClick={() => handleDelete(user)}
                                        variant="outline"
                                        className="w-full bg-red-500/5 border-red-500/20 text-red-400 hover:bg-red-500 hover:text-white transition-all h-10"
                                    >
                                        <Trash size={16} className="mr-2" />
                                        Delete User Account
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="mt-6">
                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPageChange={goToPage}
                                itemsPerPage={20}
                                onItemsPerPageChange={setItemsPerPage}
                                totalItems={filteredUsers.length}
                            />
                        </div>
                    )}
                </>
            )}

            {/* Confirm Delete Dialog */}
            <ConfirmDialog
                isOpen={showConfirmDelete}
                onClose={() => {
                    setShowConfirmDelete(false)
                    setSelectedUser(null)
                }}
                onConfirm={confirmDelete}
                title="Delete User"
                description={`Are you sure you want to delete ${selectedUser?.display_name || selectedUser?.username || 'this user'}? This action is permanent and will remove all their data from the system.`}
                confirmLabel="Delete Permanently"
                cancelLabel="Cancel"
                isLoading={isProcessing}
                variant="destructive"
            />
        </div>
    )
}
