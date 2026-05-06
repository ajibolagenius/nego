'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export async function authenticateHiddenPage(formData: FormData) {
  const password = formData.get('password')

  if (password === 'acce$$ed') {
    const cookieStore = await cookies()
    cookieStore.set('hidden_auth', 'acce$$ed', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/hidden',
      maxAge: 60 * 60 * 24, // 1 day
    })
    
    redirect('/hidden/talents')
  }

  return { error: 'Invalid password' }
}
