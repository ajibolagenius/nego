'use client'

import { useState, useEffect } from 'react'
import {
    X, MagnifyingGlass, CreditCard, ShieldCheck, Handshake,
    UserCircle, ListBullets, CalendarCheck, Wallet,
    Users, CheckCircle, ChartLine, ArrowRight, ArrowLeft
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
    icon: React.ComponentType<{ size?: number; weight?: 'thin' | 'light' | 'regular' | 'bold' | 'fill' | 'duotone'; className?: string }>
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

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1)
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

    // Handle Escape key to close modal
    useEffect(() => {
        if (!isOpen) return

        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                handleSkip()
            }
        }

        document.addEventListener('keydown', handleEscape)
        return () => document.removeEventListener('keydown', handleEscape)
    }, [isOpen])

    // Lock body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = ''
        }
        return () => {
            document.body.style.overflow = ''
        }
    }, [isOpen])

    if (!isOpen) return null

    const CurrentIcon = steps[currentStep].icon
    const progress = ((currentStep + 1) / steps.length) * 100

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            {/* Backdrop - Enhanced */}
            <div
                className="absolute inset-0 bg-black/95 backdrop-blur-md"
                onClick={handleSkip}
                aria-hidden="true"
            />

            {/* Modal */}
            <div
                className="relative bg-[#0a0a0a] border border-white/10 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-fade-in-up"
                role="dialog"
                aria-modal="true"
                aria-labelledby="onboarding-title"
                aria-describedby="onboarding-description"
            >
                {/* Close button */}
                <button
                    onClick={handleSkip}
                    className="absolute top-4 right-4 p-2 rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-all duration-200 z-10"
                    aria-label="Close onboarding"
                >
                    <X size={20} weight="duotone" aria-hidden="true" />
                </button>

                {/* Content */}
                <div className="p-8 pt-12">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <h2 id="onboarding-title" className="text-2xl font-bold text-white mb-2">{titles[role]}</h2>
                        <p id="onboarding-description" className="text-white/50 text-sm">{subtitles[role]}</p>
                    </div>

                    {/* Step indicator - Enhanced with progress bar semantics */}
                    <div className="mb-8" role="progressbar" aria-valuenow={currentStep + 1} aria-valuemin={1} aria-valuemax={steps.length}>
                        <div className="flex items-center justify-center gap-2 mb-2">
                            {steps.map((_, index) => (
                                <div
                                    key={index}
                                    className={`h-2 rounded-full transition-all duration-500 ${index === currentStep
                                            ? 'w-10 bg-[#df2531] shadow-lg shadow-[#df2531]/50'
                                            : index < currentStep
                                                ? 'w-6 bg-[#df2531]/60'
                                                : 'w-6 bg-white/10'
                                        }`}
                                    aria-hidden="true"
                                />
                            ))}
                        </div>
                        <p className="text-center text-white/40 text-xs mt-2">
                            Step {currentStep + 1} of {steps.length}
                        </p>
                    </div>

                    {/* Step content */}
                    <div className="text-center">
                        {/* Icon - Enhanced with gradient background and ring */}
                        <div className="relative w-24 h-24 mx-auto mb-6">
                            <div className="absolute inset-0 bg-gradient-to-br from-[#df2531]/20 to-[#df2531]/5 rounded-2xl blur-xl" />
                            <div className="relative w-full h-full rounded-2xl bg-[#df2531]/10 border-2 border-[#df2531]/30 flex items-center justify-center ring-4 ring-[#df2531]/10">
                                <CurrentIcon size={40} weight="duotone" className="text-[#df2531]" aria-hidden="true" />
                            </div>
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
                <div className="p-6 pt-0 flex items-center justify-between gap-4 border-t border-white/10">
                    <div className="flex items-center gap-3">
                        {currentStep > 0 && (
                            <button
                                onClick={handleBack}
                                className="flex items-center gap-2 text-white/40 hover:text-white text-sm transition-colors p-2 rounded-lg hover:bg-white/10"
                                aria-label="Go to previous step"
                            >
                                <ArrowLeft size={16} weight="duotone" aria-hidden="true" />
                                <span className="hidden sm:inline">Back</span>
                            </button>
                        )}
                        <button
                            onClick={handleSkip}
                            className="text-white/40 hover:text-white text-sm transition-colors"
                            aria-label="Skip onboarding"
                        >
                            Skip
                        </button>
                    </div>

                    <Button
                        onClick={handleNext}
                        className="bg-[#df2531] hover:bg-[#c41f2a] text-white font-medium px-6 py-2.5 rounded-xl flex items-center gap-2 transition-all duration-200 hover:scale-105 active:scale-95"
                        aria-label={currentStep < steps.length - 1 ? 'Go to next step' : 'Complete onboarding'}
                    >
                        {currentStep < steps.length - 1 ? (
                            <>
                                Next
                                <ArrowRight size={16} weight="duotone" aria-hidden="true" />
                            </>
                        ) : (
                            <>
                                Get Started
                                <CheckCircle size={16} weight="duotone" aria-hidden="true" />
                            </>
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
