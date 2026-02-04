
import { X, Warning, CalendarCheck, Clock, Calendar, CheckCircle } from '@phosphor-icons/react'
import { useState } from 'react'
import type { TalentMenu, ServiceType } from '@/types/database'

interface BookingModalProps {
    isOpen: boolean
    onClose: () => void
    services: (TalentMenu & { service_type: ServiceType })[]
    selectedServices: string[]
    totalPrice: number
    userBalance: number
    onSubmit: (date: string, time: string) => Promise<void>
    isLoading: boolean
    error: string
    formatPrice: (price: number) => string
    date: string
    time: string
    setDate: (date: string) => void
    setTime: (time: string) => void
    notes: string
    setNotes: (notes: string) => void
}

export function BookingModal({
    isOpen,
    onClose,
    services,
    selectedServices,
    totalPrice,

    onSubmit,
    isLoading,
    error,
    formatPrice,
    date: bookingDate,
    time: bookingTime,
    setDate: setBookingDate,
    setTime: setBookingTime,
    notes,
    setNotes
}: BookingModalProps) {
    const [dateError, setDateError] = useState('')
    const [timeError, setTimeError] = useState('')

    // Validate booking date (must be future date)
    const validateBookingDate = (date: string): string | null => {
        if (!date) return null

        const selectedDate = new Date(date)
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        selectedDate.setHours(0, 0, 0, 0)

        if (selectedDate < today) {
            return 'Please select a future date'
        }
        return null
    }

    // Validate booking time (must be at least 1 hour ahead)
    const validateBookingTime = (date: string, time: string): string | null => {
        if (!date || !time) return null

        const now = new Date()
        const selectedDateTime = new Date(`${date}T${time}`)
        const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000)

        if (selectedDateTime <= oneHourFromNow) {
            return 'Please select a time at least 1 hour from now'
        }
        return null
    }

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        setBookingDate(value)
        const error = validateBookingDate(value)
        setDateError(error || '')

        // Also validate time if both are set
        if (value && bookingTime) {
            const timeErr = validateBookingTime(value, bookingTime)
            setTimeError(timeErr || '')
        }
    }

    const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        setBookingTime(value)

        // Validate time if date is also set
        if (bookingDate) {
            const error = validateBookingTime(bookingDate, value)
            setTimeError(error || '')
        } else {
            setTimeError('')
        }
    }

    const handleSubmit = () => {
        // Validation before submit
        const dateErr = validateBookingDate(bookingDate)
        const timeErr = validateBookingTime(bookingDate, bookingTime)

        if (dateErr) setDateError(dateErr)
        if (timeErr) setTimeError(timeErr)

        if (!dateErr && !timeErr) {
            onSubmit(bookingDate, bookingTime)
        }
    }

    if (!isOpen) return null

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={onClose}
            onKeyDown={(e) => {
                if (e.key === 'Escape') onClose()
            }}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-labelledby="booking-modal-title"
        >
            <div
                className="bg-[#0a0a0f] rounded-2xl w-full max-w-lg border border-white/10 overflow-hidden animate-fade-in-up"
                onClick={(e) => e.stopPropagation()}
                role="document"
            // eslint-disable-next-line jsx-a11y/click-events-have-key-events
            >
                {/* Modal Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/10">
                    <div>
                        <h2 id="booking-modal-title" className="text-2xl font-bold text-white mb-1">Confirm Your Booking</h2>
                        <p className="text-white/50 text-sm">Review your selection and schedule your appointment</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-white/60 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/10"
                        aria-label="Close booking modal"
                    >
                        <X size={24} aria-hidden="true" />
                    </button>
                </div>

                {/* Modal Body */}
                <div className="p-6 space-y-6">
                    {error && (
                        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-start gap-3" role="alert">
                            <Warning size={20} weight="duotone" className="shrink-0 mt-0.5" aria-hidden="true" />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Selected Services Summary */}
                    <div className="bg-white/5 rounded-xl p-5 border border-white/10">
                        <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                            <CalendarCheck size={20} weight="duotone" className="text-[#df2531]" aria-hidden="true" />
                            Selected Services
                        </h3>
                        <div className="space-y-2 mb-4">
                            {services
                                .filter(s => selectedServices.includes(s.id))
                                .map(s => (
                                    <div key={s.id} className="flex justify-between items-center text-white py-2 px-3 rounded-lg bg-white/5">
                                        <span className="font-medium">{s.service_type?.name}</span>
                                        <span className="font-bold text-[#df2531]">{formatPrice(s.price)}</span>
                                    </div>
                                ))
                            }
                        </div>
                        <div className="border-t border-white/10 pt-4 flex justify-between items-center">
                            <span className="text-white font-semibold text-lg">Total Amount</span>
                            <span className="text-white font-bold text-xl">{formatPrice(totalPrice)}</span>
                        </div>
                    </div>

                    {/* Date & Time */}
                    <div>
                        <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                            <Clock size={20} weight="duotone" className="text-[#df2531]" aria-hidden="true" />
                            Schedule Your Appointment
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="booking-date" className="block text-white/70 text-sm mb-2 font-medium">
                                    Select Date <span className="text-red-400" aria-label="required">*</span>
                                </label>
                                <div className="relative">
                                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={20} weight="duotone" aria-hidden="true" />
                                    <input
                                        id="booking-date"
                                        type="date"
                                        value={bookingDate}
                                        onChange={handleDateChange}
                                        min={new Date().toISOString().split('T')[0]}
                                        aria-label="Booking date"
                                        aria-invalid={dateError ? 'true' : 'false'}
                                        aria-describedby={dateError ? 'date-error' : undefined}
                                        aria-required="true"
                                        className={`w-full bg-white/5 border rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none transition-colors ${dateError
                                            ? 'border-red-500/50 focus:border-red-500'
                                            : 'border-white/10 focus:border-[#df2531]/50'
                                            }`}
                                    />
                                </div>
                                {dateError && (
                                    <p id="date-error" className="text-red-400 text-xs mt-1.5 flex items-center gap-1" role="alert">
                                        <Warning size={14} weight="duotone" aria-hidden="true" />
                                        {dateError}
                                    </p>
                                )}
                                {!dateError && bookingDate && (
                                    <p className="text-green-400 text-xs mt-1.5 flex items-center gap-1">
                                        <CheckCircle size={14} weight="duotone" aria-hidden="true" />
                                        Date selected
                                    </p>
                                )}
                            </div>
                            <div>
                                <label htmlFor="booking-time" className="block text-white/70 text-sm mb-2 font-medium">
                                    Select Time <span className="text-red-400" aria-label="required">*</span>
                                </label>
                                <div className="relative">
                                    <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={20} weight="duotone" aria-hidden="true" />
                                    <input
                                        id="booking-time"
                                        type="time"
                                        value={bookingTime}
                                        onChange={handleTimeChange}
                                        aria-label="Booking time"
                                        aria-invalid={timeError ? 'true' : 'false'}
                                        aria-describedby={timeError ? 'time-error' : undefined}
                                        aria-required="true"
                                        className={`w-full bg-white/5 border rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none transition-colors ${timeError
                                            ? 'border-red-500/50 focus:border-red-500'
                                            : 'border-white/10 focus:border-[#df2531]/50'
                                            }`}
                                    />
                                </div>
                                {timeError && (
                                    <p id="time-error" className="text-red-400 text-xs mt-1.5 flex items-center gap-1" role="alert">
                                        <Warning size={14} weight="duotone" aria-hidden="true" />
                                        {timeError}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Notes */}
                    <div>
                        <label htmlFor="booking-notes" className="block text-white/70 text-sm mb-2 font-medium">
                            Special Requests or Notes <span className="text-white/40 text-xs font-normal">(optional)</span>
                        </label>
                        <textarea
                            id="booking-notes"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Any special requests, dietary preferences, or information that would help make your experience better..."
                            rows={4}
                            maxLength={500}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-[#df2531]/50 resize-none transition-colors"
                            aria-label="Special requests or notes for the booking"
                        />
                        <p className="text-white/40 text-xs mt-1.5 text-right">
                            {notes.length}/500 characters
                        </p>
                    </div>
                </div>

                {/* Submit Button */}
                <button
                    onClick={handleSubmit}
                    disabled={isLoading || !!dateError || !!timeError || !bookingDate || !bookingTime}
                    className="w-full py-4 rounded-xl bg-[#df2531] text-white font-bold text-lg hover:bg-[#c41f2a] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#df2531]/20 flex items-center justify-center gap-2"
                >
                    {isLoading ? (
                        <>
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Processing...
                        </>
                    ) : (
                        <>
                            <CalendarCheck size={24} weight="duotone" />
                            Confirm Booking
                        </>
                    )}
                </button>

                <p className="text-center text-white/40 text-xs">
                    By confirming, you agree to our terms of service.
                </p>
            </div>
        </div>
    )
}
