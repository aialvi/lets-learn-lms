'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

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

    try {
      const response = await signIn('credentials', {
        username: data.username,
        password: data.password,
        redirect: false,
      });

      if (response?.error) {
        toast.error('Sign in failed. Please check your credentials and try again.');
      } else {
        toast.success('You have successfully signed in.');
        router.push('/dashboard');
        router.refresh();
      }
    } catch (error) {
      console.error('Sign in error:', error);
      toast.error('Something went wrong. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className='w-full max-w-md space-y-6 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md'>
      <div className='space-y-2 text-center'>
        <h1 className='text-3xl font-bold'>Sign In</h1>
        <p className='text-gray-500 dark:text-gray-400'>
          Enter your credentials to access your account
        </p>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
        <div className='space-y-2'>
          <label
            htmlFor='username'
            className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'
          >
            Username or Email
          </label>
          <Input
            id='username'
            placeholder='johndoe or john@example.com'
            {...register('username')}
            disabled={isLoading}
          />
          {errors.username && (
            <p className='text-sm text-red-500'>{errors.username.message}</p>
          )}
        </div>
        <div className='space-y-2'>
          <label
            htmlFor='password'
            className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'
          >
            Password
          </label>
          <Input
            id='password'
            type='password'
            placeholder='••••••••'
            {...register('password')}
            disabled={isLoading}
          />
          {errors.password && (
            <p className='text-sm text-red-500'>{errors.password.message}</p>
          )}
        </div>
        <Button type='submit' className='w-full' disabled={isLoading}>
          {isLoading ? 'Signing in...' : 'Sign In'}
        </Button>
      </form>
      <div className='text-center text-sm'>
        <a
          href='#'
          className='text-primary hover:underline'
          onClick={() => router.push('/auth/signup')}
        >
          Don&apos;t have an account? Sign up
        </a>
      </div>
    </div>
  );
}
