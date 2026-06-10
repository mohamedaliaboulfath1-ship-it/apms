import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { hasSupabaseConfig } from '@/lib/env';

export default function SetupPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>APMS Setup Required</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <p>Supabase is not configured yet. Complete these steps:</p>
          <ol className="list-decimal space-y-2 pl-5">
            <li>Create a project at <a href="https://supabase.com/dashboard" className="text-primary underline" target="_blank" rel="noreferrer">supabase.com</a></li>
            <li>Run SQL migrations from <code className="rounded bg-muted px-1">supabase/migrations/</code></li>
            <li>Copy credentials to <code className="rounded bg-muted px-1">.env.local</code></li>
            <li>Restart the dev server</li>
          </ol>
          {!hasSupabaseConfig() && (
            <div className="rounded-lg bg-muted p-3 font-mono text-xs">
              NEXT_PUBLIC_SUPABASE_URL=...<br />
              NEXT_PUBLIC_SUPABASE_ANON_KEY=...<br />
              SUPABASE_SERVICE_ROLE_KEY=...
            </div>
          )}
          <Link href="/login"><Button className="w-full">Go to Login</Button></Link>
        </CardContent>
      </Card>
    </div>
  );
}
