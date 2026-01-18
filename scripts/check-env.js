#!/usr/bin/env node

/**
 * Environment Variable Validation Script
 *
 * Run this script to check if all required environment variables are set.
 * Usage: node scripts/check-env.js
 */

const requiredVars = {
    // Supabase (Critical - Required)
    supabase: [
        'NEXT_PUBLIC_SUPABASE_URL',
        'NEXT_PUBLIC_SUPABASE_ANON_KEY',
        'SUPABASE_SERVICE_ROLE_KEY',
    ],

    // Paystack (Required for payments)
    paystack: [
        'NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY',
        'PAYSTACK_SECRET_KEY',
    ],

    // Resend (Required for emails)
    resend: [
        'RESEND_API_KEY',
        'SENDER_EMAIL',
    ],

    // Cloudinary (Required for media)
    cloudinary: [
        'NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME',
        'CLOUDINARY_API_KEY',
        'CLOUDINARY_API_SECRET',
    ],

    // Push Notifications (Optional)
    push: [
        'NEXT_PUBLIC_VAPID_PUBLIC_KEY',
        'VAPID_PRIVATE_KEY',
    ],

    // Cron Jobs (Optional)
    cron: [
        'CRON_SECRET',
    ],
}

const optionalVars = {
    push: ['NEXT_PUBLIC_VAPID_PUBLIC_KEY', 'VAPID_PRIVATE_KEY'],
    cron: ['CRON_SECRET'],
}

function checkEnvVars() {
    console.log('🔍 Checking Environment Variables...\n')

    let hasErrors = false
    let hasWarnings = false

    // Check required variables
    for (const [category, vars] of Object.entries(requiredVars)) {
        const isOptional = optionalVars[category]
        const missing = vars.filter(v => !process.env[v])

        if (missing.length > 0) {
            if (isOptional) {
                console.log(`⚠️  ${category.toUpperCase()} (Optional):`)
                hasWarnings = true
            } else {
                console.log(`❌ ${category.toUpperCase()} (Required):`)
                hasErrors = true
            }

            missing.forEach(v => {
                console.log(`   Missing: ${v}`)
            })
            console.log()
        } else {
            console.log(`✅ ${category.toUpperCase()}: All variables set`)
        }
    }

    // Summary
    console.log('\n' + '='.repeat(50))
    if (hasErrors) {
        console.log('❌ FAILED: Missing required environment variables')
        console.log('   Please set all required variables before deploying.')
        process.exit(1)
    } else if (hasWarnings) {
        console.log('⚠️  WARNING: Some optional variables are missing')
        console.log('   The app will work, but some features may be disabled.')
        process.exit(0)
    } else {
        console.log('✅ SUCCESS: All environment variables are set!')
        process.exit(0)
    }
}

// Run check
checkEnvVars()
