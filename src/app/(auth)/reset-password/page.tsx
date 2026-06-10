'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { resetPassword } from '@/lib/actions/auth';
import { toast } from 'sonner';

export default function ResetPasswordPage() {
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    try {
      await resetPassword(new FormData(e.currentTarget));
    } catch {
      toast.error('Failed to reset password');
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader><CardTitle>Set New Password</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2"><Label>New Password</Label><Input name="password" type="password" required minLength={8} /></div>
            <Button type="submit" className="w-full" disabled={loading}>Update password</Button>
          </form>
          <Link href="/login" className="mt-4 block text-center text-sm text-primary hover:underline">Back to login</Link>
        </CardContent>
      </Card>
    </div>
  );
}
