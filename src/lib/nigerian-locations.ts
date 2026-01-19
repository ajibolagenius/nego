// All Nigerian states and FCT for location selection
// This list is used consistently across the app for location filters and profile updates

export const NIGERIAN_LOCATIONS = [
    'Abia',
    'Adamawa',
    'Akwa Ibom',
    'Anambra',
    'Bauchi',
    'Bayelsa',
    'Benue',
    'Borno',
    'Cross River',
    'Delta',
    'Ebonyi',
    'Edo',
    'Ekiti',
    'Enugu',
    'FCT (Abuja)',
    'Gombe',
    'Imo',
    'Jigawa',
    'Kaduna',
    'Kano',
    'Katsina',
    'Kebbi',
    'Kogi',
    'Kwara',
    'Lagos',
    'Nasarawa',
    'Niger',
    'Ogun',
    'Ondo',
    'Osun',
    'Oyo',
    'Plateau',
    'Rivers',
    'Sokoto',
    'Taraba',
    'Yobe',
    'Zamfara'
] as const

// Helper function to check if a location matches a selected location (handles variations)
export function locationMatches(talentLocation: string | null | undefined, selectedLocation: string): boolean {
    if (!talentLocation) return false

    const talentLocationLower = talentLocation.toLowerCase().trim()
    const selectedLocationLower = selectedLocation.toLowerCase()

    // Exact match
    if (talentLocationLower === selectedLocationLower) return true

    // Handle FCT/Abuja variations
    if (selectedLocation === 'FCT (Abuja)') {
        return talentLocationLower.includes('abuja') || talentLocationLower.includes('fct')
    }

    // Handle state name variations (e.g., "Lagos State" matches "Lagos")
    return talentLocationLower.includes(selectedLocationLower) ||
        selectedLocationLower.includes(talentLocationLower)
}
