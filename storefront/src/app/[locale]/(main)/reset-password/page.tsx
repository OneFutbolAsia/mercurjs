"use client"

import { useState, Suspense, useMemo } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { sdk } from "@/lib/config"

// 🔑 helper: decode JWT safely
function decodeJwt(token: string) {
  try {
    const base64Payload = token.split(".")[1]
    const payload = atob(base64Payload)
    return JSON.parse(payload)
  } catch (err) {
    console.error("JWT decode failed:", err)
    return null
  }
}

function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const token = searchParams.get("token")

  const email = useMemo(() => {
    if (!token) return null
    const decoded = decodeJwt(token)
    return decoded?.entity_id || null
  }, [token])

  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!token) {
      return setError("Invalid or expired reset link. Please request a new one.")
    }

    if (!email) {
      return setError("Invalid reset token (missing email).")
    }

    setLoading(true)
    setError("")

    try {
      await sdk.auth.updateProvider(
        "customer",
        "emailpass",
        {
          email,
          password,
        },
        token
      )

      alert("Password updated! Redirecting to login...")
      router.push("/ph/user")
    } catch (err: any) {
      console.error("Reset Error:", err)
      setError(err.message || "Failed to reset password.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container py-10">
      <div className="max-w-lg w-full mx-auto space-y-4">
        
        {/* Title (same style as login) */}
        <h1 className="heading-xl text-center uppercase my-6">
          Create New Password
        </h1>

        {/* Optional subtitle */}
        <p className="text-center text-sm text-gray-500 -mt-4 mb-4">
          Set a secure password for your account.
        </p>

        <form onSubmit={handleReset} className="space-y-4">
          <input
            type="password"
            placeholder="New Password"
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-black outline-none text-black"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white p-3 rounded-lg font-medium disabled:opacity-50 hover:bg-gray-800 transition"
          >
            {loading ? "Updating..." : "Reset Password"}
          </button>
        </form>

        {error && (
          <p className="text-sm text-red-600 text-center">{error}</p>
        )}
      </div>
    </div>
  )
}

// Required wrapper for useSearchParams
export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="text-center mt-20">Loading...</div>}>
      <ResetPasswordForm />
    </Suspense>
  )
}