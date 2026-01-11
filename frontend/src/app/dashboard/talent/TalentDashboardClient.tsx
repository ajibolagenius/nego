'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { 
  ArrowLeft, User, PencilSimple, Plus, Trash, Image as ImageIcon,
  CurrencyDollar, CalendarCheck, Clock, Eye, EyeSlash, Star,
  CaretRight, Coin, CheckCircle, XCircle, Hourglass, X,
  Camera, MapPin, Sparkle, Receipt, ChartLine, Icon
} from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import type { Profile, Wallet, ServiceType, Booking } from '@/types/database'

interface TalentMenu {
  id: string
  talent_id: string
  service_type_id: string
  price: number
  is_active: boolean
  created_at: string
  service_type: ServiceType
}

interface TalentMedia {
  id: string
  talent_id: string
  url: string
  type: 'image' | 'video'
  is_premium: boolean
  unlock_price: number
  created_at: string
}

interface BookingWithClient extends Omit<Booking, 'client'> {
  client: {
    display_name: string
    avatar_url: string | null
  } | null
}

interface TalentDashboardClientProps {
  user: SupabaseUser
  profile: Profile | null
  menu: TalentMenu[]
  allServices: ServiceType[]
  media: TalentMedia[]
  bookings: BookingWithClient[]
  wallet: Wallet | null
}

const statusColors: Record<string, { bg: string; text: string; icon: Icon }> = {
  payment_pending: { bg: 'bg-amber-500/10', text: 'text-amber-400', icon: Hourglass },
  verification_pending: { bg: 'bg-amber-500/10', text: 'text-amber-400', icon: Hourglass },
  confirmed: { bg: 'bg-blue-500/10', text: 'text-blue-400', icon: CheckCircle },
  completed: { bg: 'bg-green-500/10', text: 'text-green-400', icon: CheckCircle },
  cancelled: { bg: 'bg-red-500/10', text: 'text-red-400', icon: XCircle },
}

export function TalentDashboardClient({ 
  user, 
  profile, 
  menu,
  allServices,
  media,
  bookings,
  wallet 
}: TalentDashboardClientProps) {
  const router = useRouter()
  const supabase = createClient()
  
  const [activeTab, setActiveTab] = useState<'overview' | 'services' | 'media' | 'bookings'>('overview')
  const [isAddingService, setIsAddingService] = useState(false)
  const [newServiceId, setNewServiceId] = useState('')
  const [newServicePrice, setNewServicePrice] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [editingBio, setEditingBio] = useState(false)
  const [bioText, setBioText] = useState(profile?.bio || '')

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(price)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-NG', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const handleAddService = async () => {
    if (!newServiceId || !newServicePrice) return
    
    setIsSaving(true)
    try {
      const { error } = await supabase
        .from('talent_services')
        .insert({
          talent_id: user.id,
          service_id: newServiceId,
          price: parseInt(newServicePrice),
          is_available: true,
        })
      
      if (error) throw error
      
      setIsAddingService(false)
      setNewServiceId('')
      setNewServicePrice('')
      router.refresh()
    } catch (error) {
      console.error('Error adding service:', error)
      alert('Failed to add service')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteService = async (serviceId: string) => {
    if (!confirm('Are you sure you want to remove this service?')) return
    
    try {
      const { error } = await supabase
        .from('talent_services')
        .delete()
        .eq('id', serviceId)
      
      if (error) throw error
      router.refresh()
    } catch (error) {
      console.error('Error deleting service:', error)
      alert('Failed to remove service')
    }
  }

  const handleToggleAvailability = async (serviceId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('talent_services')
        .update({ is_available: !currentStatus })
        .eq('id', serviceId)
      
      if (error) throw error
      router.refresh()
    } catch (error) {
      console.error('Error updating availability:', error)
    }
  }

  const handleSaveBio = async () => {
    setIsSaving(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ bio: bioText })
        .eq('id', user.id)
      
      if (error) throw error
      setEditingBio(false)
      router.refresh()
    } catch (error) {
      console.error('Error updating bio:', error)
      alert('Failed to update bio')
    } finally {
      setIsSaving(false)
    }
  }

  // Available services that aren't already in menu
  const availableServices = allServices.filter(
    s => !menu.some(m => m.service_id === s.id)
  )

  // Stats
  const totalEarnings = bookings
    .filter(b => b.status === 'completed')
    .reduce((sum, b) => sum + b.total_price, 0)
  
  const pendingBookings = bookings.filter(b => b.status === 'payment_pending' || b.status === 'verification_pending').length
  const completedBookings = bookings.filter(b => b.status === 'completed').length

  const tabs = [
    { id: 'overview', label: 'Overview', icon: ChartLine },
    { id: 'services', label: 'Services', icon: CurrencyDollar },
    { id: 'media', label: 'Gallery', icon: ImageIcon },
    { id: 'bookings', label: 'Bookings', icon: CalendarCheck },
  ]

  return (
    <div className="min-h-screen bg-black pt-16 lg:pt-0">
      {/* Header */}
      <header className="sticky top-16 lg:top-0 z-40 bg-black/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="text-white/60 hover:text-white transition-colors">
                <ArrowLeft size={24} />
              </Link>
              <div>
                <h1 className="text-xl font-bold text-white">Talent Dashboard</h1>
                <p className="text-white/50 text-sm">Manage your profile & services</p>
              </div>
            </div>
            
            <Link 
              href={`/talent/${user.id}`}
              className="flex items-center gap-2 text-[#df2531] hover:text-[#df2531]/80 transition-colors text-sm"
            >
              <Eye size={18} />
              <span className="hidden sm:inline">View Public Profile</span>
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Profile Header */}
        <div className="flex flex-col md:flex-row gap-6 mb-8">
          <div className="relative">
            <div className="w-24 h-24 rounded-2xl bg-white/10 overflow-hidden">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt={profile.display_name || ''} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <User size={40} weight="duotone" className="text-white/40" />
                </div>
              )}
            </div>
            <button className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-[#df2531] flex items-center justify-center text-white hover:bg-[#df2531]/80 transition-colors">
              <Camera size={16} />
            </button>
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-bold text-white">{profile?.display_name || 'Your Name'}</h2>
              {profile?.is_verified && (
                <div className="px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 text-xs font-medium">
                  Verified
                </div>
              )}
            </div>
            
            {profile?.location && (
              <p className="flex items-center gap-2 text-white/50 text-sm mb-3">
                <MapPin size={14} />
                {profile.location}
              </p>
            )}
            
            {editingBio ? (
              <div className="space-y-2">
                <textarea
                  value={bioText}
                  onChange={(e) => setBioText(e.target.value)}
                  className="w-full h-24 px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm resize-none focus:outline-none focus:border-[#df2531]"
                  placeholder="Tell clients about yourself..."
                />
                <div className="flex gap-2">
                  <Button
                    onClick={handleSaveBio}
                    disabled={isSaving}
                    className="btn-primary text-sm py-2"
                  >
                    {isSaving ? 'Saving...' : 'Save'}
                  </Button>
                  <Button
                    onClick={() => { setEditingBio(false); setBioText(profile?.bio || '') }}
                    variant="ghost"
                    className="text-white/50"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-2">
                <p className="text-white/70 text-sm flex-1">
                  {profile?.bio || 'No bio yet. Click edit to add one.'}
                </p>
                <button 
                  onClick={() => setEditingBio(true)}
                  className="text-white/40 hover:text-white transition-colors"
                >
                  <PencilSimple size={16} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-2 text-white/50 text-sm mb-2">
              <Coin size={16} />
              <span>Balance</span>
            </div>
            <p className="text-2xl font-bold text-white">{wallet?.balance || 0}</p>
            <p className="text-white/40 text-xs">coins</p>
          </div>
          
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-2 text-white/50 text-sm mb-2">
              <Receipt size={16} />
              <span>Earnings</span>
            </div>
            <p className="text-2xl font-bold text-green-400">{totalEarnings}</p>
            <p className="text-white/40 text-xs">coins earned</p>
          </div>
          
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-2 text-white/50 text-sm mb-2">
              <Hourglass size={16} />
              <span>Pending</span>
            </div>
            <p className="text-2xl font-bold text-amber-400">{pendingBookings}</p>
            <p className="text-white/40 text-xs">bookings</p>
          </div>
          
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-2 text-white/50 text-sm mb-2">
              <CheckCircle size={16} />
              <span>Completed</span>
            </div>
            <p className="text-2xl font-bold text-white">{completedBookings}</p>
            <p className="text-white/40 text-xs">bookings</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-[#df2531] text-white'
                    : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon size={18} />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
              <h3 className="text-lg font-bold text-white mb-4">Quick Stats</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-white/50 text-sm">Services Listed</p>
                  <p className="text-2xl font-bold text-white">{menu.length}</p>
                </div>
                <div>
                  <p className="text-white/50 text-sm">Gallery Items</p>
                  <p className="text-2xl font-bold text-white">{media.length}</p>
                </div>
                <div>
                  <p className="text-white/50 text-sm">Starting Price</p>
                  <p className="text-xl font-bold text-white">
                    {menu.length > 0 
                      ? `${Math.min(...menu.map(m => m.price))} coins`
                      : 'Not set'
                    }
                  </p>
                </div>
                <div>
                  <p className="text-white/50 text-sm">Profile Status</p>
                  <p className={`text-lg font-bold capitalize ${
                    profile?.is_verified ? 'text-green-400' : 'text-amber-400'
                  }`}>
                    {profile?.is_verified ? 'verified' : 'pending verification'}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="p-6 rounded-2xl bg-gradient-to-br from-[#df2531]/20 to-transparent border border-[#df2531]/30">
              <div className="flex items-center gap-3 mb-3">
                <Sparkle size={24} weight="duotone" className="text-[#df2531]" />
                <h3 className="text-lg font-bold text-white">Tips to Get More Bookings</h3>
              </div>
              <ul className="space-y-2 text-white/70 text-sm">
                <li className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-green-400 flex-shrink-0" />
                  Add at least 5 high-quality photos to your gallery
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-green-400 flex-shrink-0" />
                  List all services with competitive pricing
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-green-400 flex-shrink-0" />
                  Complete your profile verification
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-green-400 flex-shrink-0" />
                  Respond quickly to booking requests
                </li>
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'services' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Your Services ({menu.length})</h3>
              {!isAddingService && availableServices.length > 0 && (
                <button
                  onClick={() => setIsAddingService(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#df2531] text-white text-sm font-medium hover:bg-[#df2531]/80 transition-colors"
                >
                  <Plus size={18} />
                  Add Service
                </button>
              )}
            </div>

            {/* Add Service Form */}
            {isAddingService && (
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-white">Add New Service</h4>
                  <button onClick={() => setIsAddingService(false)} className="text-white/40 hover:text-white">
                    <X size={20} />
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white/50 text-sm mb-2">Service Type</label>
                    <select
                      value={newServiceId}
                      onChange={(e) => setNewServiceId(e.target.value)}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#df2531]"
                    >
                      <option value="" className="bg-black">Select a service</option>
                      {availableServices.map((service) => (
                        <option key={service.id} value={service.id} className="bg-black">
                          {service.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-white/50 text-sm mb-2">Price (in coins)</label>
                    <input
                      type="number"
                      value={newServicePrice}
                      onChange={(e) => setNewServicePrice(e.target.value)}
                      placeholder="e.g., 50"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#df2531]"
                    />
                  </div>
                </div>
                
                <Button
                  onClick={handleAddService}
                  disabled={!newServiceId || !newServicePrice || isSaving}
                  className="btn-primary"
                >
                  {isSaving ? 'Adding...' : 'Add Service'}
                </Button>
              </div>
            )}

            {/* Services List */}
            {menu.length === 0 ? (
              <div className="text-center py-12 rounded-2xl bg-white/5 border border-white/10">
                <CurrencyDollar size={48} weight="duotone" className="text-white/20 mx-auto mb-4" />
                <p className="text-white/50 mb-2">No services listed yet</p>
                <p className="text-white/30 text-sm">Add services to start receiving bookings</p>
              </div>
            ) : (
              <div className="space-y-3">
                {menu.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10"
                  >
                    <div className="w-10 h-10 rounded-full bg-[#df2531]/10 flex items-center justify-center text-xl">
                      {item.service.icon}
                    </div>
                    
                    <div className="flex-1">
                      <p className="text-white font-medium">{item.service.name}</p>
                      <p className="text-white/50 text-sm">{item.price} coins</p>
                    </div>
                    
                    <button
                      onClick={() => handleToggleAvailability(item.id, item.is_available)}
                      className={`p-2 rounded-lg transition-colors ${
                        item.is_available 
                          ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20' 
                          : 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                      }`}
                      title={item.is_available ? 'Available - Click to hide' : 'Hidden - Click to show'}
                    >
                      {item.is_available ? <Eye size={20} /> : <EyeSlash size={20} />}
                    </button>
                    
                    <button
                      onClick={() => handleDeleteService(item.id)}
                      className="p-2 rounded-lg bg-white/5 text-white/40 hover:bg-red-500/10 hover:text-red-400 transition-colors"
                    >
                      <Trash size={20} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'media' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Gallery ({media.length})</h3>
              <button className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#df2531] text-white text-sm font-medium hover:bg-[#df2531]/80 transition-colors">
                <Plus size={18} />
                Upload
              </button>
            </div>

            {media.length === 0 ? (
              <div className="text-center py-12 rounded-2xl bg-white/5 border border-white/10">
                <ImageIcon size={48} weight="duotone" className="text-white/20 mx-auto mb-4" />
                <p className="text-white/50 mb-2">No photos yet</p>
                <p className="text-white/30 text-sm">Upload photos to showcase your work</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {media.map((item) => (
                  <div key={item.id} className="relative aspect-square rounded-xl overflow-hidden group">
                    <img 
                      src={item.url} 
                      alt="" 
                      className="w-full h-full object-cover"
                    />
                    {item.is_premium && (
                      <div className="absolute top-2 right-2 px-2 py-1 rounded-full bg-[#df2531] text-white text-xs font-medium">
                        Premium
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20">
                        <PencilSimple size={18} />
                      </button>
                      <button className="p-2 rounded-full bg-red-500/20 text-red-400 hover:bg-red-500/30">
                        <Trash size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'bookings' && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white">Recent Bookings ({bookings.length})</h3>

            {bookings.length === 0 ? (
              <div className="text-center py-12 rounded-2xl bg-white/5 border border-white/10">
                <CalendarCheck size={48} weight="duotone" className="text-white/20 mx-auto mb-4" />
                <p className="text-white/50 mb-2">No bookings yet</p>
                <p className="text-white/30 text-sm">Bookings will appear here when clients book your services</p>
              </div>
            ) : (
              <div className="space-y-3">
                {bookings.map((booking) => {
                  const status = statusColors[booking.status] || statusColors.pending
                  const StatusIcon = status.icon
                  
                  return (
                    <div
                      key={booking.id}
                      className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                    >
                      <div className="w-12 h-12 rounded-full bg-white/10 overflow-hidden">
                        {booking.client?.avatar_url ? (
                          <img src={booking.client.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <User size={24} weight="duotone" className="text-white/40" />
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium">{booking.client?.display_name || 'Client'}</p>
                        <p className="text-white/40 text-sm truncate">
                          Booking #{booking.id.slice(0, 8)}
                        </p>
                      </div>
                      
                      <div className="text-right">
                        <p className="text-white font-bold">{booking.total_price} coins</p>
                        <p className="text-white/40 text-xs">{formatDate(booking.created_at)}</p>
                      </div>
                      
                      <div className={`px-3 py-1 rounded-full ${status.bg} ${status.text} text-xs font-medium flex items-center gap-1`}>
                        <StatusIcon size={14} weight="bold" />
                        <span className="capitalize">{booking.status}</span>
                      </div>
                      
                      <Link
                        href={`/dashboard/bookings/${booking.id}`}
                        className="p-2 rounded-lg bg-white/5 text-white/40 hover:bg-white/10 hover:text-white transition-colors"
                      >
                        <CaretRight size={20} />
                      </Link>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
