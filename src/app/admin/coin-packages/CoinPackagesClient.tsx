'use client'

import { useState, Fragment } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
    Plus, Pencil, Trash, Check, X, Star, Crown
} from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import type { CoinPackage } from '@/types/database'
import { useRouter } from 'next/navigation'

interface CoinPackagesClientProps {
    initialPackages: CoinPackage[]
}

export function CoinPackagesClient({ initialPackages }: CoinPackagesClientProps) {
    const router = useRouter()
    const supabase = createClient()
    const [packages, setPackages] = useState<CoinPackage[]>(initialPackages)
    const [showForm, setShowForm] = useState(false)
    const [editingPackage, setEditingPackage] = useState<CoinPackage | null>(null)
    const [isSaving, setIsSaving] = useState(false)

    const [formData, setFormData] = useState({
        coins: '',
        price: '',
        display_name: '',
        description: '',
        popular: false,
        best_value: false,
        is_active: true,
        display_order: packages.length + 1
    })

    const formatNaira = (amount: number) => {
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN',
            minimumFractionDigits: 0,
        }).format(amount)
    }

    const handleCreate = () => {
        setEditingPackage(null)
        setFormData({
            coins: '',
            price: '',
            display_name: '',
            description: '',
            popular: false,
            best_value: false,
            is_active: true,
            display_order: packages.length + 1
        })
        setShowForm(true)
    }

    const handleEdit = (pkg: CoinPackage) => {
        setEditingPackage(pkg)
        setFormData({
            coins: pkg.coins.toString(),
            price: (pkg.price / 100).toString(), // Convert from kobo to naira for display
            display_name: pkg.display_name,
            description: pkg.description || '',
            popular: pkg.popular,
            best_value: pkg.best_value,
            is_active: pkg.is_active,
            display_order: pkg.display_order
        })
        setShowForm(true)
    }

    const handleSave = async () => {
        if (!formData.coins || !formData.price || !formData.display_name) {
            toast.error('Please fill in all required fields')
            return
        }

        const coins = parseInt(formData.coins)
        const priceNaira = parseFloat(formData.price)
        const priceInKobo = Math.round(priceNaira * 100)

        if (isNaN(coins) || coins <= 0) {
            toast.error('Coins must be a positive number')
            return
        }

        if (isNaN(priceNaira) || priceNaira <= 0) {
            toast.error('Price must be a positive number')
            return
        }

        setIsSaving(true)
        try {
            const payload = {
                coins,
                price: priceNaira,
                price_in_kobo: priceInKobo,
                display_name: formData.display_name,
                description: formData.description || null,
                popular: formData.popular,
                best_value: formData.best_value,
                is_active: formData.is_active,
                display_order: formData.display_order
            }

            if (editingPackage) {
                // Update existing
                const { error } = await supabase
                    .from('coin_packages')
                    .update(payload)
                    .eq('id', editingPackage.id)

                if (error) throw error
                toast.success('Package updated successfully')
            } else {
                // Create new
                const { error } = await supabase
                    .from('coin_packages')
                    .insert(payload)

                if (error) throw error
                toast.success('Package created successfully')
            }

            setShowForm(false)
            router.refresh()
        } catch (error) {
            console.error('Save error:', error)
            toast.error('Failed to save package')
        } finally {
            setIsSaving(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this package?')) return

        try {
            const { error } = await supabase
                .from('coin_packages')
                .delete()
                .eq('id', id)

            if (error) throw error
            toast.success('Package deleted')
            router.refresh()
        } catch (error) {
            console.error('Delete error:', error)
            toast.error('Failed to delete package')
        }
    }

    const handleToggleActive = async (pkg: CoinPackage) => {
        try {
            const { error } = await supabase
                .from('coin_packages')
                .update({ is_active: !pkg.is_active })
                .eq('id', pkg.id)

            if (error) throw error
            toast.success(`Package ${!pkg.is_active ? 'activated' : 'deactivated'}`)
            router.refresh()
        } catch (error) {
            console.error('Toggle error:', error)
            toast.error('Failed to update package')
        }
    }

    return (
        <Fragment>
            <div className="p-6 lg:p-8">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-white mb-2">Coin Packages</h1>
                            <p className="text-white/60">Manage coin packages and pricing</p>
                        </div>
                        <Button
                            onClick={handleCreate}
                            className="bg-[#df2531] hover:bg-[#df2531]/90"
                        >
                            <Plus size={18} />
                            Add Package
                        </Button>
                    </div>

                    {/* Packages Grid */}
                    {packages.length === 0 ? (
                        <div className="text-center py-20">
                            <p className="text-white/50 text-lg mb-4">No packages found</p>
                            <Button onClick={handleCreate} variant="outline">
                                Create First Package
                            </Button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {packages.map((pkg) => (
                            <div
                                key={pkg.id}
                                className={`bg-white/5 rounded-xl border p-6 ${
                                    pkg.is_active
                                        ? 'border-white/10 hover:border-[#df2531]/30'
                                        : 'border-white/5 opacity-60'
                                } transition-all`}
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        {pkg.popular && (
                                            <span className="px-2 py-1 bg-[#df2531]/20 text-[#df2531] text-xs rounded-full border border-[#df2531]/30 flex items-center gap-1">
                                                <Star size={12} weight="fill" />
                                                Popular
                                            </span>
                                        )}
                                        {pkg.best_value && (
                                            <span className="px-2 py-1 bg-amber-500/20 text-amber-400 text-xs rounded-full border border-amber-500/30 flex items-center gap-1">
                                                <Crown size={12} weight="fill" />
                                                Best Value
                                            </span>
                                        )}
                                    </div>
                                    {!pkg.is_active && (
                                        <span className="px-2 py-1 bg-white/10 text-white/60 text-xs rounded-full">
                                            Inactive
                                        </span>
                                    )}
                                </div>

                                <h3 className="text-2xl font-bold text-white mb-2">{pkg.display_name}</h3>
                                {pkg.description && (
                                    <p className="text-white/60 text-sm mb-4">{pkg.description}</p>
                                )}

                                <div className="space-y-2 mb-6">
                                    <div className="flex justify-between items-center">
                                        <span className="text-white/60">Coins:</span>
                                        <span className="text-white font-semibold">{pkg.coins.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-white/60">Price:</span>
                                        <span className="text-white font-semibold">{formatNaira(pkg.price)}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-white/60">Rate:</span>
                                        <span className="text-white font-semibold">
                                            ₦{(pkg.price / pkg.coins).toFixed(2)} per coin
                                        </span>
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <Button
                                        onClick={() => handleEdit(pkg)}
                                        variant="outline"
                                        size="sm"
                                        className="flex-1 border-white/10 text-white/70 hover:text-white"
                                    >
                                        <Pencil size={16} />
                                        Edit
                                    </Button>
                                    <Button
                                        onClick={() => handleToggleActive(pkg)}
                                        variant="outline"
                                        size="sm"
                                        className={`flex-1 ${
                                            pkg.is_active
                                                ? 'border-white/10 text-white/70 hover:text-white'
                                                : 'border-green-500/30 text-green-400 hover:bg-green-500/10'
                                        }`}
                                    >
                                        {pkg.is_active ? 'Deactivate' : 'Activate'}
                                    </Button>
                                    <Button
                                        onClick={() => handleDelete(pkg.id)}
                                        variant="outline"
                                        size="sm"
                                        className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                                    >
                                        <Trash size={16} />
                                    </Button>
                                </div>
                            </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Form Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-[#0a0a0a] rounded-2xl border border-white/10 max-w-2xl w-full max-h-[90vh] overflow-auto">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-bold text-white">
                                    {editingPackage ? 'Edit Package' : 'Create Package'}
                                </h2>
                                <button
                                    onClick={() => setShowForm(false)}
                                    className="text-white/60 hover:text-white"
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-white font-medium mb-2">Display Name *</label>
                                    <input
                                        type="text"
                                        value={formData.display_name}
                                        onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                                        placeholder="e.g., 1,000 Coins"
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder:text-white/30 focus:outline-none focus:border-[#df2531]/50"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-white font-medium mb-2">Coins *</label>
                                        <input
                                            type="number"
                                            value={formData.coins}
                                            onChange={(e) => setFormData({ ...formData, coins: e.target.value })}
                                            placeholder="1000"
                                            min="1"
                                            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder:text-white/30 focus:outline-none focus:border-[#df2531]/50"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-white font-medium mb-2">Price (₦) *</label>
                                        <input
                                            type="number"
                                            value={formData.price}
                                            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                            placeholder="10000"
                                            min="1"
                                            step="0.01"
                                            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder:text-white/30 focus:outline-none focus:border-[#df2531]/50"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-white font-medium mb-2">Description</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="Package description..."
                                        rows={3}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder:text-white/30 focus:outline-none focus:border-[#df2531]/50"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-white font-medium mb-2">Display Order</label>
                                        <input
                                            type="number"
                                            value={formData.display_order}
                                            onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                                            min="0"
                                            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder:text-white/30 focus:outline-none focus:border-[#df2531]/50"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.popular}
                                            onChange={(e) => setFormData({ ...formData, popular: e.target.checked })}
                                            className="w-4 h-4 rounded border-white/10 bg-white/5 text-[#df2531] focus:ring-[#df2531]"
                                        />
                                        <span className="text-white">Mark as Popular</span>
                                    </label>

                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.best_value}
                                            onChange={(e) => setFormData({ ...formData, best_value: e.target.checked })}
                                            className="w-4 h-4 rounded border-white/10 bg-white/5 text-[#df2531] focus:ring-[#df2531]"
                                        />
                                        <span className="text-white">Mark as Best Value</span>
                                    </label>

                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.is_active}
                                            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                            className="w-4 h-4 rounded border-white/10 bg-white/5 text-[#df2531] focus:ring-[#df2531]"
                                        />
                                        <span className="text-white">Active</span>
                                    </label>
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <Button
                                        onClick={handleSave}
                                        disabled={isSaving}
                                        className="flex-1 bg-[#df2531] hover:bg-[#df2531]/90"
                                    >
                                        <Check size={18} />
                                        {isSaving ? 'Saving...' : 'Save'}
                                    </Button>
                                    <Button
                                        onClick={() => setShowForm(false)}
                                        variant="outline"
                                        className="flex-1 border-white/10"
                                    >
                                        <X size={18} />
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </Fragment>
    )
}
