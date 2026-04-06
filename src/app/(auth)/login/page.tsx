"use client";

import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/logo";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const result = await signIn("credentials", {
      email: formData.get("email") as string,
      password: formData.get("password") as string,
      redirect: false,
    });

    if (result?.error) {
      setError("Invalid email or password");
      setLoading(false);
    } else {
      router.push(callbackUrl);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="email" className="text-[#2D3028] text-sm font-medium">Email</Label>
        <Input id="email" name="email" type="email" placeholder="you@example.com" required className="h-11 border-[#E2DED6] focus:border-[#C9A84C] focus:ring-[#C9A84C]" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password" className="text-[#2D3028] text-sm font-medium">Password</Label>
        <Input id="password" name="password" type="password" required className="h-11 border-[#E2DED6] focus:border-[#C9A84C] focus:ring-[#C9A84C]" />
      </div>
      {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-md">{error}</p>}
      <Button type="submit" className="w-full h-11 bg-[#C9A84C] hover:bg-[#B8963A] text-white font-medium" disabled={loading}>
        {loading ? "Signing in..." : "Sign in"}
      </Button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#7D8B73]">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <Logo className="h-20" variant="light" />
        </div>
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-6">
            <h1 className="text-xl font-semibold text-[#2D3028]">Welcome back</h1>
            <p className="text-sm text-[#6B7862] mt-1">Sign in to your account</p>
          </div>
          <Suspense fallback={<div className="text-center text-[#6B7862]">Loading...</div>}>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
