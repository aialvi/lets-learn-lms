'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Spinner } from '@/components/ui/spinner';
import { AuthCard, AuthField } from '@/components/auth/auth-field';

const formSchema = z.object({
  username: z.string().min(3, {
    message: 'Username must be at least 3 characters.',
  }),
  password: z.string().min(6, {
    message: 'Password must be at least 6 characters.',
  }),
});

export function SignInForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

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
      const response = await signIn('credentials', {
        username: data.username,
        password: data.password,
        redirect: false,
      });

      if (response?.error) {
        setFormError('That username and password combination didn’t match an account. Check both fields and try again.');
      } else {
        // The sign-in page redirects once the session updates.
        toast.success('You have successfully signed in.');
      }
    } catch (error) {
      console.error('Sign in error:', error);
      setFormError('We couldn’t reach the server. Check your connection and try again in a moment.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AuthCard
      eyebrow='Welcome back'
      title='Sign in'
      description='Enter your credentials to pick up where you left off.'
      footer={
        <>
          Don&apos;t have an account?{' '}
          <Link href='/auth/signup' className='link'>
            Create one
          </Link>
        </>
      }
    >
      {formError ? (
        <Alert variant='destructive'>
          <AlertCircle aria-hidden='true' />
          <AlertTitle>Sign in failed</AlertTitle>
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      ) : null}
      <form onSubmit={handleSubmit(onSubmit)} className='space-y-4' noValidate aria-busy={isLoading}>
        <AuthField
          id='username'
          label='Username'
          placeholder='johndoe'
          autoComplete='username'
          autoCapitalize='none'
          spellCheck={false}
          error={errors.username?.message}
          {...register('username')}
        />
        <AuthField
          id='password'
          label='Password'
          type='password'
          autoComplete='current-password'
          error={errors.password?.message}
          {...register('password')}
        />
        <Button type='submit' size='lg' className='w-full' disabled={isLoading}>
          {isLoading ? <Spinner /> : null}
          {isLoading ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>
    </AuthCard>
  );
}
