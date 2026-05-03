"use client";

import { useState } from "react";
import { getSession, signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PawPrint } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});
type LoginInput = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit(data: LoginInput) {
    setServerError(null);

    try {
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (!result || result.error) {
        // Never reveal which field is wrong — AC from Story 02
        setServerError("Invalid email or password");
        return;
      }

      const session = await getSession();
      window.location.assign(
        session?.user.mustChangePassword ? "/change-password" : "/dashboard",
      );
    } catch {
      setServerError("Unable to sign in right now. Please try again.");
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
      {/* Logo / brand */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
          <PawPrint className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900 leading-none">
            Foster Connect
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Animal Rescue Platform
          </p>
        </div>
      </div>

      <h2 className="text-lg font-semibold text-slate-800 mb-1">Sign in</h2>
      <p className="text-sm text-slate-500 mb-6">
        Enter your credentials to access your dashboard.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        {/* Server-level error */}
        {serverError && (
          <div
            role="alert"
            className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700"
          >
            <span className="shrink-0">⚠</span>
            {serverError}
          </div>
        )}

        <Input
          label="Email address"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          error={errors.email?.message}
          {...register("email")}
        />

        <Input
          label="Password"
          type="password"
          autoComplete="current-password"
          error={errors.password?.message}
          {...register("password")}
        />

        <Button
          type="submit"
          size="lg"
          loading={isSubmitting}
          className="w-full mt-2"
        >
          Sign in
        </Button>
      </form>
    </div>
  );
}
