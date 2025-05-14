
import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Code } from '@/components/ui/code';
import { BellPlus } from 'lucide-react';

const DatabaseMigrationInstructions: React.FC = () => {
  return (
    <Alert className="bg-amber-50 border-amber-200 mb-4">
      <BellPlus className="h-4 w-4 text-amber-500" />
      <AlertTitle className="text-amber-700">Database Update Required</AlertTitle>
      <AlertDescription className="text-amber-600">
        <p className="mb-2">You need to run a quick database migration in the Supabase SQL Editor to add support for offers:</p>
        <Code className="text-xs mb-3 bg-amber-100 border-amber-200">
          {`-- Migration to add is_offer and offer_status to chat_messages table
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS is_offer BOOLEAN DEFAULT false;
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS offer_status TEXT DEFAULT NULL;`}
        </Code>
        <p className="text-sm">After applying this migration, the new "Interested" feature will work properly.</p>
      </AlertDescription>
    </Alert>
  );
};

export default DatabaseMigrationInstructions;
