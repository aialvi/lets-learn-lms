"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import { AuthCard, AuthField } from "@/components/auth/auth-field";
import { registerUser } from "@/lib/api";

const formSchema = z.object({
  username: z.string().min(3, {
    message: "Username must be at least 3 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  password: z.string().min(6, {
    message: "Password must be at least 6 characters.",
  }),
  confirmPassword: z.string().min(6, {
    message: "Password must be at least 6 characters.",
  }),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export function SignUpForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  async function onSubmit(data: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setFormError(null);

    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { confirmPassword: _, ...userData } = data;

      await registerUser(userData);

      toast.success("Account created! You can now sign in with your credentials.");

      const destination = new URLSearchParams(window.location.search).get('callbackUrl');
      router.push(destination?.startsWith('/') && !destination.startsWith('//') ? `/auth/signin?callbackUrl=${encodeURIComponent(destination)}` : '/auth/signin');
    } catch (error: unknown) {
      console.error("Registration error:", error);

      let errorMessage = "We couldn't create your account. Please try again in a moment.";

      if (error instanceof Error) {
        if ('code' in error && error.code === 'ECONNABORTED') {
          errorMessage = "The server took too long to respond. Check your connection and try again.";
        } else if ('code' in error && error.code === 'ERR_NETWORK') {
          errorMessage = "We couldn't reach the server. Check your connection and try again.";
        } else if ('response' in error) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const message = (error as any).response?.data?.message;
          errorMessage = (Array.isArray(message) ? message.join(' ') : message) || "The server rejected the request. Check your details and try again.";
        } else {
          errorMessage = error.message || errorMessage;
        }
      }

      setFormError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AuthCard
      className="max-w-lg"
      eyebrow="Start learning"
      title="Create an account"
      description="It only takes a minute. You can update these details later from your profile."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/auth/signin" className="link">
            Sign in
          </Link>
        </>
      }
    >
      {formError ? (
        <Alert variant="destructive">
          <AlertCircle aria-hidden="true" />
          <AlertTitle>Couldn&apos;t create account</AlertTitle>
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      ) : null}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate aria-busy={isLoading}>
        <div className="grid gap-4 sm:grid-cols-2">
          <AuthField
            id="firstName"
            label="First name"
            optional
            placeholder="John"
            autoComplete="given-name"
            error={errors.firstName?.message}
            {...register("firstName")}
          />
          <AuthField
            id="lastName"
            label="Last name"
            optional
            placeholder="Doe"
            autoComplete="family-name"
            error={errors.lastName?.message}
            {...register("lastName")}
          />
        </div>
        <AuthField
          id="username"
          label="Username"
          placeholder="johndoe"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          error={errors.username?.message}
          {...register("username")}
        />
        <AuthField
          id="email"
          label="Email"
          type="email"
          placeholder="john@example.com"
          autoComplete="email"
          inputMode="email"
          error={errors.email?.message}
          {...register("email")}
        />
        <AuthField
          id="password"
          label="Password"
          type="password"
          autoComplete="new-password"
          hint="At least 6 characters."
          error={errors.password?.message}
          {...register("password")}
        />
        <AuthField
          id="confirmPassword"
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          {...register("confirmPassword")}
        />
        <Button type="submit" size="lg" className="w-full" disabled={isLoading}>
          {isLoading ? <Spinner /> : null}
          {isLoading ? "Creating account…" : "Create account"}
        </Button>
      </form>
    </AuthCard>
  );
}
