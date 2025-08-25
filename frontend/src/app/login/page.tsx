'use client'

import { useState } from 'react'
import { createClient } from "@/utils/supabase/client";
import Link from 'next/link'
import { useRouter } from 'next/navigation'

// 🔑 Fungsi hash password pakai SHA-256
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    if (!email.trim() || !password.trim()) {
      setError('Email dan password harus diisi')
      setIsLoading(false)
      return
    }

    try {
      // 1. Hash password input
      const hashedPassword = await hashPassword(password)

      // 2. Cari user di tabel "users"
      const { data: user, error: dbError } = await supabase
        .from("users")
        .select("id, email, full_name, password_hash")
        .eq("email", email.trim().toLowerCase())
        .single()

      if (dbError || !user) {
        setError("Email tidak ditemukan")
        return
      }

      // 3. Bandingkan hash
      if (user.password_hash !== hashedPassword) {
        setError("Password salah")
        return
      }

      // ✅ Simpan ke localStorage
      localStorage.setItem("user", JSON.stringify({
        id: user.id,
        email: user.email,
        full_name: user.full_name,
      }))

      // ✅ Simpan juga ke cookie (agar middleware bisa baca)
      document.cookie = `user=${encodeURIComponent(JSON.stringify({
        id: user.id,
        email: user.email,
      }))}; path=/; max-age=86400;`

      // ✅ Redirect ke dashboard
      router.push('/admin')

    } catch (err) {
      setError('Terjadi kesalahan yang tidak terduga')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Masuk ke Dashboard
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sistem Absensi Otomatis
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
              {error}
            </div>
          )}

          <div className="space-y-4">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md sm:text-sm"
                placeholder="Masukkan email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="block w-full px-3 py-2 pr-10 border border-gray-300 rounded-md sm:text-sm"
                  placeholder="Masukkan password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2 px-4 text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? 'Masuk...' : 'Masuk'}
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Belum punya akun?{' '}
              <Link href="/register" className="font-medium text-blue-600 hover:text-blue-500">
                Daftar di sini
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}
