"use client"

import { useState } from "react"
import { sdk } from "@/lib/config"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState<{ type: "success" | "error"; msg: string } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await sdk.auth.resetPassword("customer", "emailpass", {
        identifier: email,
      })
      setStatus({ type: "success", msg: "Reset link sent! Please check your email." })
    } catch (err: any) {
      setStatus({ type: "error", msg: err.message || "Something went wrong." })
    }
  }

  return (
    <main className="container">
      <h1 className="heading-xl text-center uppercase my-6">
        Forgot Password
      </h1>

      <p className="text-center text-sm text-gray-500 -mt-4 mb-4">
        Enter your email below, and we will send you instructions on how to reset your password.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="max-w-lg w-full mx-auto space-y-4">
          <input
            type="email"
            placeholder="Email Address"
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-black outline-none"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          {status && (
            <p className={`label-md ${status.type === "error" ? "text-negative" : "text-positive"}`}>
              {status.type === "error" ? `Error: ${status.msg}` : status.msg}
            </p>
          )}
          <button type="submit" className="w-full bg-black text-white p-3 rounded-lg font-medium hover:bg-gray-800 transition">
            Send Reset Link
          </button>
        </div>
      </form>
    </main>
  )
}
