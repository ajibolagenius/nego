'use client'

import { useState, useEffect } from 'react'
import { 
  X, MagnifyingGlass, CreditCard, ShieldCheck, Handshake,
  UserCircle, ListBullets, CalendarCheck, Wallet,
  Users, CheckCircle, ChartLine, ArrowRight
} from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'

type OnboardingRole = 'client' | 'talent' | 'admin'

interface OnboardingModalProps {
  role: OnboardingRole
  isOpen: boolean
  onClose: () => void
  onComplete: () => void
}

interface OnboardingStep {
  icon: React.ComponentType<{ size?: number; weight?: string; className?: string }>
  title: string
  description: string
}

const clientSteps: OnboardingStep[] = [
  {
    icon: MagnifyingGlass,
    title: 'Browse Talent',
    description: 'Discover verified, elite talent from our curated collection.',
  },
  {
    icon: CreditCard,
    title: 'Book & Pay',
    description: 'Select services, pay securely with coins from your wallet.',
  },
  {
    icon: ShieldCheck,
    title: 'Verify Identity',
    description: 'Quick selfie verification for a safe, trusted experience.',
  },
  {
    icon: Handshake,
    title: 'Connect',
    description: 'Once confirmed, connect with your chosen talent.',
  },
]

const talentSteps: OnboardingStep[] = [
  {
    icon: UserCircle,
    title: 'Complete Profile',
    description: 'Add your bio, photos, and showcase your unique offerings.',
  },
  {
    icon: ListBullets,
    title: 'Set Your Services',
    description: 'Define your services and set competitive pricing.',
  },
  {
    icon: CalendarCheck,
    title: 'Accept Bookings',
    description: 'Review and accept booking requests from verified clients.',
  },
  {
    icon: Wallet,
    title: 'Get Paid',
    description: 'Withdraw your earnings directly to your bank account.',
  },
]

const adminSteps: OnboardingStep[] = [
  {
    icon: Users,
    title: 'Verify Clients',
    description: 'Review and approve client identity verifications.',
  },
  {
    icon: CheckCircle,
    title: 'Process Payouts',
    description: 'Manage talent withdrawal requests and payments.',
  },
  {
    icon: ChartLine,
    title: 'Monitor Platform',
    description: 'Track bookings, revenue, and platform performance.',
  },
]

export function OnboardingModal({ role, isOpen, onClose, onComplete }: OnboardingModalProps) {
  const [currentStep, setCurrentStep] = useState(0)

  const steps = role === 'admin' ? adminSteps : role === 'talent' ? talentSteps : clientSteps
  
  const titles = {
    client: 'Welcome to Nego',
    talent: 'Start Your Journey',
    admin: 'Admin Dashboard',
  }

  const subtitles = {
    client: 'Here\'s how to get started',
    talent: 'Set up your profile in minutes',
    admin: 'Platform management overview',
  }

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      onComplete()
    }
  }

  const handleSkip = () => {
    onComplete()
  }

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0)
    }
  }, [isOpen])

  if (!isOpen) return null

  const CurrentIcon = steps[currentStep].icon

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/90 backdrop-blur-sm"
        onClick={handleSkip}
      />

      {/* Modal */}
      <div className="relative bg-[#0a0a0a] border border-white/10 rounded-3xl w-full max-w-md overflow-hidden">
        {/* Close button */}
        <button
          onClick={handleSkip}
          className="absolute top-4 right-4 p-2 rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-colors z-10"
        >
          <X size={20} />
        </button>

        {/* Content */}
        <div className="p-8 pt-12">
          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">{titles[role]}</h2>
            <p className="text-white/50 text-sm">{subtitles[role]}</p>
          </div>

          {/* Step indicator */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  index === currentStep 
                    ? 'w-8 bg-[#df2531]' 
                    : index < currentStep 
                      ? 'w-4 bg-[#df2531]/50' 
                      : 'w-4 bg-white/10'
                }`}
              />
            ))}
          </div>

          {/* Step content */}
          <div className="text-center">
            <div className="w-20 h-20 rounded-2xl bg-[#df2531]/10 flex items-center justify-center mx-auto mb-6">
              <CurrentIcon size={36} weight="duotone" className="text-[#df2531]" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">
              {steps[currentStep].title}
            </h3>
            <p className="text-white/60 text-sm leading-relaxed">
              {steps[currentStep].description}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 pt-0 flex items-center justify-between gap-4">
          <button
            onClick={handleSkip}
            className="text-white/40 hover:text-white text-sm transition-colors"
          >
            Skip
          </button>
          
          <Button
            onClick={handleNext}
            className="bg-[#df2531] hover:bg-[#c41f2a] text-white font-medium px-6 py-2.5 rounded-xl flex items-center gap-2"
          >
            {currentStep < steps.length - 1 ? (
              <>
                Next
                <ArrowRight size={16} />
              </>
            ) : (
              'Get Started'
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

// Hook to manage onboarding state
export function useOnboarding(role: OnboardingRole, userId: string) {
  const [showOnboarding, setShowOnboarding] = useState(false)
  const storageKey = `nego_onboarding_${role}_${userId}`

  useEffect(() => {
    // Check if user has seen onboarding
    const hasSeenOnboarding = localStorage.getItem(storageKey)
    if (!hasSeenOnboarding) {
      // Small delay to let the page load first
      const timer = setTimeout(() => setShowOnboarding(true), 500)
      return () => clearTimeout(timer)
    }
  }, [storageKey])

  const completeOnboarding = () => {
    localStorage.setItem(storageKey, 'true')
    setShowOnboarding(false)
  }

  const resetOnboarding = () => {
    localStorage.removeItem(storageKey)
    setShowOnboarding(true)
  }

  return {
    showOnboarding,
    setShowOnboarding,
    completeOnboarding,
    resetOnboarding,
  }
}
