'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, ShieldCheck, Heart, Sparkle, Eye } from '@phosphor-icons/react'

const aboutImages = [
    "https://customer-assets.emergentagent.com/job_secure-booking-3/artifacts/pkva1jgy_pexels-jaime-baskin-1089908384-20644317.jpg",
    "https://customer-assets.emergentagent.com/job_secure-booking-3/artifacts/4wpmqkgg_pexels-pedrofurtadoo-31094965.jpg",
    "https://customer-assets.emergentagent.com/job_secure-booking-3/artifacts/ux7m23fn_pexels-titibrazil-15488638.jpg",
    "https://customer-assets.emergentagent.com/job_secure-booking-3/artifacts/ta13tarq_pexels-titibrazil-33428529.jpg",
    "https://customer-assets.emergentagent.com/job_secure-booking-3/artifacts/mlmg4rfd_pexels-darcy-delia-345397-950758.jpg",
]

const features = [
    { icon: ShieldCheck, label: 'Verified Talent' },
    { icon: Heart, label: 'Premium Experience' },
    { icon: Sparkle, label: 'Exclusive Access' },
]

export function AboutSection() {
    const [isVisible, setIsVisible] = useState(false)
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
    const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 })
    const sectionRef = useRef<HTMLElement>(null)

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => { if (entry.isIntersecting) setIsVisible(true) },
            { threshold: 0.15 }
        )
        if (sectionRef.current) observer.observe(sectionRef.current)
        return () => observer.disconnect()
    }, [])

    const handleMouseMove = (e: React.MouseEvent) => {
        const rect = e.currentTarget.getBoundingClientRect()
        setCursorPos({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        })
    }

    return (
        <section ref={sectionRef} id="about" className="relative py-16 md:py-24 lg:py-32 bg-black overflow-hidden">
            {/* Animated background */}
            <div className="absolute inset-0">
                <div className="absolute inset-0 bg-gradient-to-br from-black via-[#df2531]/5 to-black" />
                <div className={`absolute top-1/4 left-1/4 w-96 h-96 bg-[#df2531]/10 rounded-full blur-[150px] transition-all duration-1000 ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`} />
                <div className={`absolute bottom-1/4 right-1/4 w-72 h-72 bg-[#df2531]/5 rounded-full blur-[120px] transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`} />
            </div>

            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className={`text-center mb-12 md:mb-16 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                    <p className="text-[#df2531] tracking-[0.3em] uppercase text-xs font-medium mb-4">About Us</p>
                    <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white">
                        WHAT IS <span className="text-[#df2531]">NEGO</span>
                    </h2>
                </div>

                {/* Flexible Masonry Bento Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">

                    {/* Row 1 */}
                    {/* Text Block - Spans 2 cols on all, taller */}
                    <div
                        className={`col-span-2 row-span-2 bg-white/5 backdrop-blur-sm rounded-2xl md:rounded-3xl p-6 md:p-8 border border-white/10 hover:border-[#df2531]/30 transition-all duration-700 group ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                            }`}
                        style={{ transitionDelay: '0.1s' }}
                    >
                        <div className="h-full flex flex-col justify-between min-h-[280px] md:min-h-[320px]">
                            <div>
                                <p className="text-white/80 text-sm md:text-base leading-relaxed mb-4">
                                    Nego is a premium managed marketplace connecting discerning clients with verified, elite talent.
                                    Our platform operates with complete transparency, security, and the highest standards of discretion.
                                </p>
                                <p className="text-white/60 text-sm leading-relaxed">
                                    Whether you need sophisticated companionship for a corporate event, an elegant dinner date, or a memorable evening,
                                    Nego delivers excellence with unwavering professionalism and discretion.
                                </p>
                            </div>

                            <div className="flex flex-wrap gap-2 mt-6">
                                {features.map((feature, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#df2531]/10 border border-[#df2531]/20 hover:bg-[#df2531]/20 hover:scale-105 transition-all duration-300 cursor-pointer"
                                    >
                                        <feature.icon size={14} weight="duotone" className="text-[#df2531]" />
                                        <span className="text-white text-xs">{feature.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Image 1 - Tall on desktop */}
                    <div
                        className={`col-span-1 row-span-2 md:row-span-3 relative rounded-2xl md:rounded-3xl overflow-hidden group cursor-pointer transition-all duration-700 min-h-[200px] md:min-h-[400px] ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                            }`}
                        style={{ transitionDelay: '0.2s' }}
                        onMouseEnter={() => setHoveredIndex(0)}
                        onMouseLeave={() => setHoveredIndex(null)}
                        onMouseMove={handleMouseMove}
                    >
                        <Image
                            src={aboutImages[0]}
                            alt="Featured premium selection showcasing our elite talent"
                            fill
                            sizes="(max-width: 768px) 50vw, 33vw"
                            className="object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                        <div className={`absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent transition-opacity duration-500 ${hoveredIndex === 0 ? 'opacity-100' : 'opacity-70'}`} />

                        {hoveredIndex === 0 && (
                            <div
                                className="absolute w-16 h-16 rounded-full bg-[#df2531]/20 border border-[#df2531]/50 flex items-center justify-center pointer-events-none transition-all duration-200"
                                style={{ left: cursorPos.x - 32, top: cursorPos.y - 32 }}
                            >
                                <Eye size={20} weight="duotone" className="text-white" />
                            </div>
                        )}

                        <div className={`absolute bottom-4 left-4 transition-all duration-500 ${hoveredIndex === 0 ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-70'}`}>
                            <p className="text-[#df2531] text-xs font-medium mb-1">Featured</p>
                            <p className="text-white font-bold">Premium Selection</p>
                        </div>
                    </div>

                    {/* Image 2 */}
                    <div
                        className={`col-span-1 row-span-1 relative rounded-2xl md:rounded-3xl overflow-hidden group cursor-pointer transition-all duration-700 min-h-[150px] md:min-h-[180px] ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                            }`}
                        style={{ transitionDelay: '0.3s' }}
                        onMouseEnter={() => setHoveredIndex(1)}
                        onMouseLeave={() => setHoveredIndex(null)}
                    >
                        <Image
                            src={aboutImages[1]}
                            alt="Exclusive talent collection"
                            fill
                            sizes="(max-width: 768px) 50vw, 25vw"
                            className="object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                        <div className={`absolute bottom-4 left-4 transition-all duration-500 ${hoveredIndex === 1 ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-70'}`}>
                            <p className="text-white font-bold">Exclusive</p>
                        </div>
                    </div>

                    {/* Row 2 */}
                    {/* Image 3 */}
                    <div
                        className={`col-span-1 row-span-1 relative rounded-2xl md:rounded-3xl overflow-hidden group cursor-pointer transition-all duration-700 min-h-[150px] md:min-h-[180px] ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                            }`}
                        style={{ transitionDelay: '0.4s' }}
                        onMouseEnter={() => setHoveredIndex(2)}
                        onMouseLeave={() => setHoveredIndex(null)}
                    >
                        <Image
                            src={aboutImages[2]}
                            alt="Curated selection of verified talent"
                            fill
                            sizes="(max-width: 768px) 50vw, 25vw"
                            className="object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                        <div className={`absolute bottom-3 left-3 transition-all duration-500 ${hoveredIndex === 2 ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-70'}`}>
                            <p className="text-white text-sm font-bold">Curated</p>
                        </div>
                    </div>

                    {/* Image 4 */}
                    <div
                        className={`col-span-1 row-span-1 relative rounded-2xl md:rounded-3xl overflow-hidden group cursor-pointer transition-all duration-700 min-h-[150px] md:min-h-[180px] ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                            }`}
                        style={{ transitionDelay: '0.5s' }}
                        onMouseEnter={() => setHoveredIndex(3)}
                        onMouseLeave={() => setHoveredIndex(null)}
                    >
                        <Image
                            src={aboutImages[3]}
                            alt="Premium verified talent profiles"
                            fill
                            sizes="(max-width: 768px) 50vw, 25vw"
                            className="object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                        <div className={`absolute bottom-3 left-3 transition-all duration-500 ${hoveredIndex === 3 ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-70'}`}>
                            <p className="text-white text-sm font-bold">Premium</p>
                        </div>
                    </div>

                    {/* Row 3 - Wide image */}
                    {/* Image 5 - Wide */}
                    <div
                        className={`col-span-2 row-span-1 relative rounded-2xl md:rounded-3xl overflow-hidden group cursor-pointer transition-all duration-700 min-h-[150px] md:min-h-[200px] ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                            }`}
                        style={{ transitionDelay: '0.6s' }}
                        onMouseEnter={() => setHoveredIndex(4)}
                        onMouseLeave={() => setHoveredIndex(null)}
                    >
                        <Image
                            src={aboutImages[4]}
                            alt="Sophisticated elegance redefined"
                            fill
                            sizes="(max-width: 768px) 100vw, 50vw"
                            className="object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
                        <div className={`absolute bottom-4 md:bottom-6 left-4 md:left-6 transition-all duration-500 ${hoveredIndex === 4 ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-70'}`}>
                            <p className="text-[#df2531] text-xs font-medium mb-1">Sophisticated</p>
                            <h3 className="text-white text-lg md:text-xl font-bold">
                                Elegance Redefined
                            </h3>
                        </div>
                    </div>

                    {/* CTA Card - Always at the end */}
                    <Link
                        href="/dashboard/browse"
                        aria-label="Explore our complete talent collection"
                        className={`col-span-2 md:col-span-1 lg:col-span-2 row-span-1 bg-[#df2531]/10 backdrop-blur-sm rounded-2xl md:rounded-3xl p-5 md:p-6 border border-[#df2531]/20 hover:bg-[#df2531]/20 hover:border-[#df2531]/40 transition-all duration-500 group cursor-pointer min-h-[120px] md:min-h-[150px] flex flex-col justify-between focus:outline-none focus:ring-2 focus:ring-[#df2531] focus:ring-offset-2 focus:ring-offset-black ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                            }`}
                        style={{ transitionDelay: '0.7s' }}
                    >
                        <div>
                            <p className="text-[#df2531] text-xs font-medium mb-2">Discover</p>
                            <h3 className="text-white text-lg md:text-xl font-bold">
                                Explore Collection
                            </h3>
                        </div>
                        <div className="flex items-center gap-2 text-white group-hover:text-[#df2531] transition-colors duration-300">
                            <span className="text-sm font-medium">View All</span>
                            <ArrowRight size={18} weight="bold" className="transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
                        </div>
                    </Link>
                </div>
            </div>
        </section>
    )
}
