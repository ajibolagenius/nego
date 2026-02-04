
import { Check, Calendar } from '@phosphor-icons/react'
import type { TalentMenu, ServiceType } from '@/types/database'
import type { Icon } from '@phosphor-icons/react'

interface ServicesListProps {
    services: (TalentMenu & { service_type: ServiceType })[]
    selectedServices: string[]
    onToggleService: (serviceId: string) => void
    formatPrice: (price: number) => string
    serviceIcons: Record<string, Icon>
}

export function ServicesList({ services, selectedServices, onToggleService, formatPrice, serviceIcons }: ServicesListProps) {
    if (services.length === 0) {
        return (
            <div className="bg-white/5 rounded-xl p-12 text-center border border-white/10">
                <Calendar size={48} weight="duotone" className="text-white/20 mx-auto mb-4" aria-hidden="true" />
                <p className="text-white/60 font-medium mb-2">No services available</p>
                <p className="text-white/40 text-sm">This talent hasn&apos;t added any services yet. Check back later!</p>
            </div>
        )
    }

    return (
        <div className="space-y-3">
            {services.map((service) => {
                const isSelected = selectedServices.includes(service.id)
                const IconComponent = serviceIcons[service.service_type?.icon || ''] || Calendar

                return (
                    <button
                        key={service.id}
                        onClick={() => onToggleService(service.id)}
                        className={`group w-full flex flex-col md:flex-row md:items-center justify-between p-4 md:p-5 rounded-xl border transition-all duration-200 gap-4 md:gap-0 ${isSelected
                            ? 'bg-[#df2531]/10 border-[#df2531]/50 shadow-lg shadow-[#df2531]/10'
                            : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                            }`}
                        aria-label={`${isSelected ? 'Deselect' : 'Select'} ${service.service_type?.name} service for ${formatPrice(service.price)}`}
                        aria-pressed={isSelected}
                    >
                        <div className="flex items-center gap-4 w-full md:w-auto md:flex-1 min-w-0">
                            <div className={`w-12 h-12 md:w-14 md:h-14 rounded-xl flex items-center justify-center shrink-0 transition-all ${isSelected
                                ? 'bg-[#df2531] shadow-lg shadow-[#df2531]/30'
                                : 'bg-white/10 group-hover:bg-white/20'
                                }`}>
                                <IconComponent size={24} weight="duotone" className="text-white" aria-hidden="true" />
                            </div>
                            <div className="text-left flex-1 min-w-0">
                                <p className="text-white font-semibold text-sm md:text-base mb-1">{service.service_type?.name}</p>
                                {service.service_type?.description && (
                                    <p className="text-white/60 text-xs md:text-sm line-clamp-2">{service.service_type.description}</p>
                                )}

                                {/* Mobile-only Price (visible only on small screens) */}
                                <div className="mt-2 md:hidden flex items-center gap-2">
                                    <p className="text-white font-bold text-sm bg-white/10 px-2 py-0.5 rounded-md inline-block">
                                        {formatPrice(service.price)}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Desktop Price & Checkbox (Price hidden on mobile) */}
                        <div className="hidden md:flex items-center gap-4 shrink-0">
                            <div className="text-right">
                                <p className="text-white font-bold text-lg">{formatPrice(service.price)}</p>
                            </div>
                            <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all ${isSelected
                                ? 'bg-[#df2531] border-[#df2531] shadow-lg shadow-[#df2531]/30'
                                : 'border-white/30 group-hover:border-white/50'
                                }`} aria-hidden="true">
                                {isSelected && <Check size={16} weight="bold" className="text-white" />}
                            </div>
                        </div>

                        {/* Mobile Checkbox */}
                        <div className="md:hidden absolute top-4 right-4">
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${isSelected
                                ? 'bg-[#df2531] border-[#df2531]'
                                : 'border-white/30'
                                }`} aria-hidden="true">
                                {isSelected && <Check size={14} weight="bold" className="text-white" />}
                            </div>
                        </div>
                    </button>
                )
            })}
        </div>
    )
}
