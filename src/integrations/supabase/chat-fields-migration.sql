
-- Migration to add is_offer and offer_status to chat_messages table
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS is_offer BOOLEAN DEFAULT false;
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS offer_status TEXT DEFAULT NULL;
