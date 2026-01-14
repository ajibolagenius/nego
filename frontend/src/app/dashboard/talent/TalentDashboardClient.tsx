'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { 
  ArrowLeft, User, PencilSimple, Plus, Trash, Image as ImageIcon,
  CurrencyDollar, CalendarCheck, Clock, Eye, EyeSlash, Star,
  CaretRight, Coin, CheckCircle, XCircle, Hourglass, X,
  Camera, MapPin, Sparkle, Receipt, ChartLine, Icon, Bank, Money, Gift
} from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { MobileBottomNav } from '@/components/MobileBottomNav'
import { MediaManager } from '@/components/MediaManager'
import { getTalentUrl } from '@/lib/talent-url'
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

interface Transaction {
  id: string
  user_id: string
  amount: number
  coins: number
  type: string
  status: string
  description: string
  created_at: string
}

interface GiftReceived {
  id: string
  sender_id: string
  recipient_id: string
  amount: number
  message: string | null
  created_at: string
  sender: {
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
  transactions?: Transaction[]
  giftsReceived?: GiftReceived[]
}

const statusColors: Record<string, { bg: string; text: string; icon: Icon; needsAction?: boolean }> = {
  payment_pending: { bg: 'bg-amber-500/10', text: 'text-amber-400', icon: Hourglass },
  verification_pending: { bg: 'bg-blue-500/10', text: 'text-blue-400', icon: Hourglass, needsAction: true },
  confirmed: { bg: 'bg-green-500/10', text: 'text-green-400', icon: CheckCircle },
  completed: { bg: 'bg-white/5', text: 'text-white/60', icon: CheckCircle },
  cancelled: { bg: 'bg-red-500/10', text: 'text-red-400', icon: XCircle },
}

export function TalentDashboardClient({ 
  user, 
  profile, 
  menu,
  allServices,
  media,
  bookings,
  wallet,
  transactions = [],
  giftsReceived = []
}: TalentDashboardClientProps) {
  const router = useRouter()
  const supabase = createClient()
  
  const [activeTab, setActiveTab] = useState<'overview' | 'services' | 'media' | 'bookings' | 'earnings' | 'withdrawals'>('overview')
  const [isAddingService, setIsAddingService] = useState(false)
  const [newServiceId, setNewServiceId] = useState('')
  const [newServicePrice, setNewServicePrice] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [editingBio, setEditingBio] = useState(false)
  const [bioText, setBioText] = useState(profile?.bio || '')
  const [priceError, setPriceError] = useState('')
  
  // Withdrawal state
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false)
  const [withdrawalAmount, setWithdrawalAmount] = useState('')
  const [bankName, setBankName] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [accountName, setAccountName] = useState('')
  const [isWithdrawing, setIsWithdrawing] = useState(false)

  // Minimum service price in coins (100,000 NGN = 100,000 coins)
  const MIN_SERVICE_PRICE = 100000

  const formatPrice = (price: number) => {
    return `${new Intl.NumberFormat('en-NG', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)} coins`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-NG', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const validatePrice = (price: string) => {
    const numPrice = parseInt(price)
    if (isNaN(numPrice) || numPrice < MIN_SERVICE_PRICE) {
      setPriceError(`Minimum price is ${MIN_SERVICE_PRICE.toLocaleString()} coins (₦${MIN_SERVICE_PRICE.toLocaleString()})`)
      return false
    }
    setPriceError('')
    return true
  }

  const handleAddService = async () => {
    if (!newServiceId || !newServicePrice) return
    
    // Validate minimum price
    if (!validatePrice(newServicePrice)) {
      return
    }
    
    setIsSaving(true)
    try {
      const { error } = await supabase
        .from('talent_menus')
        .insert({
          talent_id: user.id,
          service_type_id: newServiceId,
          price: parseInt(newServicePrice),
          is_active: true,
        })
      
      if (error) throw error
      
      setIsAddingService(false)
      setNewServiceId('')
      setNewServicePrice('')
      setPriceError('')
      router.refresh()
    } catch (error) {
      console.error('Error adding service:', error)
      alert('Failed to add service')
    } finally {
      setIsSaving(false)
    }
  }

  // Handle withdrawal request
  const handleWithdrawal = async () => {
    const amount = parseInt(withdrawalAmount)
    
    if (!amount || amount <= 0) {
      alert('Please enter a valid amount')
      return
    }
    
    if (amount > (wallet?.balance || 0)) {
      alert('Insufficient balance')
      return
    }
    
    if (!bankName || !accountNumber || !accountName) {
      alert('Please fill in all bank details')
      return
    }
    
    setIsWithdrawing(true)
    try {
      const { error } = await supabase
        .from('withdrawal_requests')
        .insert({
          talent_id: user.id,
          amount,
          bank_name: bankName,
          account_number: accountNumber,
          account_name: accountName,
        })
      
      if (error) throw error
      
      // Reset form
      setShowWithdrawalModal(false)
      setWithdrawalAmount('')
      setBankName('')
      setAccountNumber('')
      setAccountName('')
      
      alert('Withdrawal request submitted! It will be processed within 24-48 hours.')
      router.refresh()
    } catch (error) {
      console.error('Error submitting withdrawal:', error)
      alert('Failed to submit withdrawal request')
    } finally {
      setIsWithdrawing(false)
    }
  }

  const handleDeleteService = async (serviceId: string) => {
    if (!confirm('Are you sure you want to remove this service?')) return
    
    try {
      const { error } = await supabase
        .from('talent_menus')
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
        .from('talent_menus')
        .update({ is_active: !currentStatus })
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
    s => !menu.some(m => m.service_type_id === s.id)
  )

  // Stats
  const totalEarnings = bookings
    .filter(b => b.status === 'completed')
    .reduce((sum, b) => sum + b.total_price, 0)
  
  const pendingBookings = bookings.filter(b => b.status === 'payment_pending' || b.status === 'verification_pending').length
  const completedBookings = bookings.filter(b => b.status === 'completed').length

  // Calculate earnings breakdown
  const giftEarnings = transactions.filter(t => t.type === 'gift').reduce((sum, t) => sum + t.amount, 0)
  const unlockEarnings = transactions.filter(t => t.type === 'premium_unlock').reduce((sum, t) => sum + t.amount, 0)
  const bookingEarnings = transactions.filter(t => t.type === 'booking').reduce((sum, t) => sum + t.amount, 0)
  const totalAllEarnings = giftEarnings + unlockEarnings + bookingEarnings

  const tabs = [
    { id: 'overview', label: 'Overview', icon: ChartLine },
    { id: 'services', label: 'Services', icon: CurrencyDollar },
    { id: 'media', label: 'Gallery', icon: ImageIcon },
    { id: 'bookings', label: 'Bookings', icon: CalendarCheck },
    { id: 'earnings', label: 'Earnings', icon: Money },
    { id: 'withdrawals', label: 'Withdrawals', icon: Bank },
  ]

  return (
    <>
    <div className="min-h-screen bg-black pt-16 lg:pt-0 pb-20 lg:pb-0">
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
              href={getTalentUrl({ id: user.id, username: profile?.username, display_name: profile?.display_name })}
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
                      onChange={(e) => {
                        setNewServicePrice(e.target.value)
                        if (e.target.value) validatePrice(e.target.value)
                      }}
                      placeholder={`Min. ${MIN_SERVICE_PRICE.toLocaleString()}`}
                      min={MIN_SERVICE_PRICE}
                      className={`w-full px-4 py-3 bg-white/5 border rounded-xl text-white focus:outline-none transition-colors ${
                        priceError ? 'border-red-500/50 focus:border-red-500' : 'border-white/10 focus:border-[#df2531]'
                      }`}
                    />
                    {priceError && (
                      <p className="text-red-400 text-xs mt-1">{priceError}</p>
                    )}
                    <p className="text-white/30 text-xs mt-1">Minimum: ₦{MIN_SERVICE_PRICE.toLocaleString()}</p>
                  </div>
                </div>
                
                <Button
                  onClick={handleAddService}
                  disabled={!newServiceId || !newServicePrice || isSaving || !!priceError}
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
                      {item.service_type?.icon}
                    </div>
                    
                    <div className="flex-1">
                      <p className="text-white font-medium">{item.service_type?.name}</p>
                      <p className="text-white/50 text-sm">{item.price} coins</p>
                    </div>
                    
                    <button
                      onClick={() => handleToggleAvailability(item.id, item.is_active)}
                      className={`p-2 rounded-lg transition-colors ${
                        item.is_active 
                          ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20' 
                          : 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                      }`}
                      title={item.is_active ? 'Available - Click to hide' : 'Hidden - Click to show'}
                    >
                      {item.is_active ? <Eye size={20} /> : <EyeSlash size={20} />}
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
          <MediaManager 
            talentId={user.id}
            media={media}
            onRefresh={() => router.refresh()}
          />
        )}

        {activeTab === 'bookings' && (
          <div className="space-y-4">
            {/* Pending Action Alert */}
            {bookings.filter(b => b.status === 'verification_pending').length > 0 && (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400">
                <Hourglass size={24} weight="duotone" />
                <div className="flex-1">
                  <p className="font-medium">You have {bookings.filter(b => b.status === 'verification_pending').length} booking(s) awaiting your response</p>
                  <p className="text-sm text-blue-400/70">Accept or decline to proceed</p>
                </div>
              </div>
            )}

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
                  const status = statusColors[booking.status] || statusColors.payment_pending
                  const StatusIcon = status.icon
                  const needsAction = status.needsAction
                  
                  return (
                    <Link
                      key={booking.id}
                      href={`/dashboard/bookings/${booking.id}`}
                      className={`flex items-center gap-4 p-4 rounded-xl border transition-colors ${
                        needsAction 
                          ? 'bg-blue-500/5 border-blue-500/30 hover:bg-blue-500/10' 
                          : 'bg-white/5 border-white/10 hover:bg-white/10'
                      }`}
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
                        <div className="flex items-center gap-2">
                          <p className="text-white font-medium">{booking.client?.display_name || 'Client'}</p>
                          {needsAction && (
                            <span className="px-2 py-0.5 rounded-full bg-blue-500 text-white text-[10px] font-bold uppercase">
                              Action Required
                            </span>
                          )}
                        </div>
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
                        <span className="capitalize">{booking.status.replace('_', ' ')}</span>
                      </div>
                      
                      <CaretRight size={20} className="text-white/40" />
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Earnings Tab */}
        {activeTab === 'earnings' && (
          <div className="space-y-6">
            {/* Earnings Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-green-500/20 to-transparent border border-green-500/30">
                <p className="text-white/60 text-xs mb-1">Total Earnings</p>
                <p className="text-2xl font-bold text-white">{totalAllEarnings.toLocaleString()}</p>
                <p className="text-green-400 text-xs">coins</p>
              </div>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <div className="flex items-center gap-2 mb-1">
                  <Gift size={14} className="text-pink-400" />
                  <p className="text-white/60 text-xs">From Gifts</p>
                </div>
                <p className="text-xl font-bold text-white">{giftEarnings.toLocaleString()}</p>
              </div>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <div className="flex items-center gap-2 mb-1">
                  <Eye size={14} className="text-amber-400" />
                  <p className="text-white/60 text-xs">Content Unlocks</p>
                </div>
                <p className="text-xl font-bold text-white">{unlockEarnings.toLocaleString()}</p>
              </div>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <div className="flex items-center gap-2 mb-1">
                  <CalendarCheck size={14} className="text-blue-400" />
                  <p className="text-white/60 text-xs">Bookings</p>
                </div>
                <p className="text-xl font-bold text-white">{bookingEarnings.toLocaleString()}</p>
              </div>
            </div>

            {/* Recent Gifts Received */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Gift size={20} className="text-pink-400" />
                Recent Gifts Received
              </h3>
              {giftsReceived.length === 0 ? (
                <div className="p-8 rounded-2xl bg-white/5 border border-white/10 text-center">
                  <Gift size={48} weight="duotone" className="text-white/20 mx-auto mb-4" />
                  <p className="text-white/50">No gifts received yet</p>
                  <p className="text-white/30 text-sm mt-1">When clients send you gifts, they&apos;ll appear here</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {giftsReceived.map((gift) => (
                    <div
                      key={gift.id}
                      className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10"
                    >
                      <div className="w-10 h-10 rounded-full bg-pink-500/20 flex items-center justify-center">
                        <Gift size={20} className="text-pink-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium">
                          {gift.sender?.display_name || 'Anonymous'}
                        </p>
                        {gift.message && (
                          <p className="text-white/40 text-sm truncate">&quot;{gift.message}&quot;</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-white font-bold text-green-400">+{gift.amount}</p>
                        <p className="text-white/40 text-xs">{formatDate(gift.created_at)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Transactions */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Receipt size={20} className="text-white/60" />
                Transaction History
              </h3>
              {transactions.length === 0 ? (
                <div className="p-8 rounded-2xl bg-white/5 border border-white/10 text-center">
                  <Receipt size={48} weight="duotone" className="text-white/20 mx-auto mb-4" />
                  <p className="text-white/50">No transactions yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {transactions.slice(0, 10).map((tx) => (
                    <div
                      key={tx.id}
                      className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10"
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        tx.type === 'gift' ? 'bg-pink-500/20' :
                        tx.type === 'premium_unlock' ? 'bg-amber-500/20' :
                        'bg-blue-500/20'
                      }`}>
                        {tx.type === 'gift' ? <Gift size={20} className="text-pink-400" /> :
                         tx.type === 'premium_unlock' ? <Eye size={20} className="text-amber-400" /> :
                         <CalendarCheck size={20} className="text-blue-400" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium capitalize">
                          {tx.type.replace('_', ' ')}
                        </p>
                        <p className="text-white/40 text-sm truncate">{tx.description}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-white font-bold text-green-400">+{tx.amount}</p>
                        <p className="text-white/40 text-xs">{formatDate(tx.created_at)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Withdrawals Tab */}
        {activeTab === 'withdrawals' && (
          <div className="space-y-6">
            {/* Balance Card */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-[#df2531]/20 to-transparent border border-[#df2531]/30">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-white/60 text-sm">Available Balance</p>
                  <p className="text-3xl font-bold text-white">{(wallet?.balance || 0).toLocaleString()} coins</p>
                  <p className="text-white/40 text-sm">≈ ₦{(wallet?.balance || 0).toLocaleString()}</p>
                </div>
                <div className="w-16 h-16 rounded-2xl bg-[#df2531]/20 flex items-center justify-center">
                  <Coin size={32} weight="duotone" className="text-[#df2531]" />
                </div>
              </div>
              
              <Button
                onClick={() => setShowWithdrawalModal(true)}
                disabled={(wallet?.balance || 0) < 10000}
                className="w-full bg-[#df2531] hover:bg-[#c41f2a] text-white font-bold py-3 rounded-xl disabled:opacity-50"
              >
                <Bank size={20} className="mr-2" />
                Request Withdrawal
              </Button>
              {(wallet?.balance || 0) < 10000 && (
                <p className="text-white/40 text-xs text-center mt-2">
                  Minimum withdrawal: 10,000 coins
                </p>
              )}
            </div>

            {/* Withdrawal Info */}
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <h4 className="text-white font-medium mb-2">Withdrawal Information</h4>
              <ul className="space-y-2 text-white/60 text-sm">
                <li className="flex items-center gap-2">
                  <CheckCircle size={14} className="text-green-400" />
                  Minimum withdrawal: 10,000 coins
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle size={14} className="text-green-400" />
                  Processing time: 24-48 hours
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle size={14} className="text-green-400" />
                  Supported banks: All Nigerian banks
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle size={14} className="text-green-400" />
                  No withdrawal fees
                </li>
              </ul>
            </div>

            {/* Recent Withdrawals Placeholder */}
            <div>
              <h4 className="text-lg font-bold text-white mb-4">Recent Withdrawals</h4>
              <div className="text-center py-12 rounded-2xl bg-white/5 border border-white/10">
                <Money size={48} weight="duotone" className="text-white/20 mx-auto mb-4" />
                <p className="text-white/50 mb-2">No withdrawals yet</p>
                <p className="text-white/30 text-sm">Your withdrawal history will appear here</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Withdrawal Modal */}
      {showWithdrawalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowWithdrawalModal(false)}
          />
          <div className="relative bg-[#1a1a1a] rounded-2xl p-6 max-w-md w-full border border-white/10">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Request Withdrawal</h3>
              <button 
                onClick={() => setShowWithdrawalModal(false)}
                className="text-white/40 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Amount */}
              <div>
                <label className="block text-white/70 text-sm mb-2">Amount (coins)</label>
                <input
                  type="number"
                  value={withdrawalAmount}
                  onChange={(e) => setWithdrawalAmount(e.target.value)}
                  placeholder="Enter amount"
                  max={wallet?.balance || 0}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#df2531]"
                />
                <p className="text-white/40 text-xs mt-1">
                  Available: {(wallet?.balance || 0).toLocaleString()} coins
                </p>
              </div>

              {/* Bank Name */}
              <div>
                <label className="block text-white/70 text-sm mb-2">Bank Name</label>
                <select
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#df2531]"
                >
                  <option value="" className="bg-black">Select bank</option>
                  <option value="Access Bank" className="bg-black">Access Bank</option>
                  <option value="First Bank" className="bg-black">First Bank</option>
                  <option value="GTBank" className="bg-black">GTBank</option>
                  <option value="UBA" className="bg-black">UBA</option>
                  <option value="Zenith Bank" className="bg-black">Zenith Bank</option>
                  <option value="Kuda Bank" className="bg-black">Kuda Bank</option>
                  <option value="Opay" className="bg-black">Opay</option>
                  <option value="Palmpay" className="bg-black">Palmpay</option>
                  <option value="Other" className="bg-black">Other</option>
                </select>
              </div>

              {/* Account Number */}
              <div>
                <label className="block text-white/70 text-sm mb-2">Account Number</label>
                <input
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="10-digit account number"
                  maxLength={10}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#df2531]"
                />
              </div>

              {/* Account Name */}
              <div>
                <label className="block text-white/70 text-sm mb-2">Account Name</label>
                <input
                  type="text"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  placeholder="Name on account"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#df2531]"
                />
              </div>

              {/* Submit Button */}
              <Button
                onClick={handleWithdrawal}
                disabled={isWithdrawing || !withdrawalAmount || !bankName || !accountNumber || !accountName}
                className="w-full bg-[#df2531] hover:bg-[#c41f2a] text-white font-bold py-3 rounded-xl disabled:opacity-50 mt-4"
              >
                {isWithdrawing ? 'Submitting...' : 'Submit Request'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
    <MobileBottomNav userRole="talent" />
    </>
  )
}
