'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { forgotPassword } from '@/lib/actions/auth';
import { toast } from 'sonner';

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const result = await forgotPassword(new FormData(e.currentTarget));
    setLoading(false);
    if (result?.error) toast.error(result.error);
    else toast.success(result.message);
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader><CardTitle>Reset Password</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2"><Label>Email</Label><Input name="email" type="email" required /></div>
            <Button type="submit" className="w-full" disabled={loading}>Send reset link</Button>
          </form>
          <Link href="/login" className="mt-4 block text-center text-sm text-primary hover:underline">Back to login</Link>
        </CardContent>
      </Card>
    </div>
  );
}
