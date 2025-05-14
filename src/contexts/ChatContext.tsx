
import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { v4 as uuidv4 } from 'uuid';
import { toast } from '@/hooks/use-toast';

export interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  receiver_id: string;
  product_id: string | null;
  message: string;
  is_read: boolean;
  created_at: string;
  is_offer?: boolean;
  offer_status?: 'pending' | 'accepted' | 'declined';
}

export interface Conversation {
  id: string;
  participant: {
    id: string;
    full_name: string | null;
  };
  product?: {
    id: string;
    name: string;
    image_url: string | null;
    price?: number;
    unit?: string;
  };
  lastMessage?: ChatMessage;
  unreadCount: number;
}

interface ChatContextType {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  messages: ChatMessage[];
  setCurrentConversation: (conversation: Conversation | null) => void;
  sendMessage: (message: string, isOffer?: boolean) => Promise<void>;
  loadMessages: (conversationId: string) => Promise<void>;
  startNewConversation: (receiverId: string, productId: string | null) => Promise<string>;
  loadConversations: () => Promise<void>;
  markMessagesAsRead: (conversationId: string) => Promise<void>;
  respondToOffer: (messageId: string, status: 'accepted' | 'declined') => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const { profile } = useAuth();

  useEffect(() => {
    if (profile) {
      loadConversations();
      setupRealtimeSubscription();
    } else {
      setConversations([]);
      setMessages([]);
      setCurrentConversation(null);
    }
  }, [profile]);

  // Setup realtime subscription for new messages
  const setupRealtimeSubscription = () => {
    if (!profile) return;

    const channel = supabase
      .channel('chat-messages-channel')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'chat_messages',
          filter: `receiver_id=eq.${profile.id}`
        }, 
        (payload) => {
          const newMessage = payload.new as ChatMessage;
          handleNewMessage(newMessage);
        }
      )
      .on('postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chat_messages'
        },
        (payload) => {
          const updatedMessage = payload.new as ChatMessage;
          handleUpdatedMessage(updatedMessage);
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  };

  // Handle a new incoming message
  const handleNewMessage = (newMessage: ChatMessage) => {
    // Add message to current conversation if it's open
    if (currentConversation?.id === newMessage.conversation_id) {
      setMessages(prev => [...prev, newMessage]);
      markMessagesAsRead(newMessage.conversation_id);
    }
    
    // Update conversations list
    loadConversations();
  };

  // Handle updated message (e.g., offer status changed)
  const handleUpdatedMessage = (updatedMessage: ChatMessage) => {
    if (currentConversation?.id === updatedMessage.conversation_id) {
      setMessages(prev => prev.map(msg => 
        msg.id === updatedMessage.id ? updatedMessage : msg
      ));
    }
    
    // Update conversations list to reflect changes
    loadConversations();
  };

  // Respond to an offer (accept/decline)
  const respondToOffer = async (messageId: string, status: 'accepted' | 'declined') => {
    if (!profile || !currentConversation) return;
    
    try {
      // Update the offer message with new status
      const { error: updateError } = await supabase
        .from('chat_messages')
        .update({ 
          offer_status: status
        })
        .eq('id', messageId);
      
      if (updateError) throw updateError;
      
      // Send a response message
      const responseMessage = status === 'accepted' 
        ? "I've accepted your offer! You can now see my contact information for direct communication."
        : "I've declined your offer. Feel free to make another offer or discuss further.";
      
      await sendMessage(responseMessage);
      
      // If accepted, reveal contact info by setting show_contact_number to true for this product
      if (status === 'accepted' && currentConversation.product?.id) {
        // First, ensure the product exists and belongs to the current user (the farmer)
        const { data: productData, error: productError } = await supabase
          .from('products')
          .select('id, farmer_id')
          .eq('id', currentConversation.product.id)
          .eq('farmer_id', profile.id)
          .single();
          
        if (productError) {
          console.error('Error fetching product:', productError);
          throw productError;
        }
        
        if (productData) {
          // Update the product to show contact information
          const { error: updateProductError } = await supabase
            .from('products')
            .update({ show_contact_number: true })
            .eq('id', productData.id);
          
          if (updateProductError) throw updateProductError;
        }
        
        // Create a notification for the buyer
        await supabase
          .from('notifications')
          .insert({
            user_id: currentConversation.participant.id,
            type: 'order_update',
            title: 'Offer Accepted!',
            message: `Your offer for ${currentConversation.product.name} has been accepted. The farmer's contact information is now available in the chat.`,
            related_id: messageId,
            is_read: false
          });
          
        // Show toast notification (will appear for the farmer who accepted)
        toast({
          title: "Offer Accepted",
          description: "The buyer has been notified and can now see your contact information.",
        });
      }
      
      // Refresh messages
      await loadMessages(currentConversation.id);
      
    } catch (error: any) {
      console.error('Error responding to offer:', error.message);
      throw error;
    }
  };

  // Load user's conversations
  const loadConversations = async () => {
    if (!profile) return;
    
    try {
      // Get all messages where the user is sender or receiver
      const { data: messagesData, error: messagesError } = await supabase
        .from('chat_messages')
        .select(`
          *,
          product:product_id (id, name, image_url, price, unit)
        `)
        .or(`sender_id.eq.${profile.id},receiver_id.eq.${profile.id}`)
        .order('created_at', { ascending: false });
      
      if (messagesError) throw messagesError;
      
      // Process conversations
      const conversationMap = new Map<string, any>();
      
      for (const message of messagesData || []) {
        const conversationId = message.conversation_id;
        const isCurrentUserSender = message.sender_id === profile.id;
        const otherParticipantId = isCurrentUserSender ? message.receiver_id : message.sender_id;
        
        if (!conversationMap.has(conversationId)) {
          // Fetch other participant details
          const { data: profileData } = await supabase
            .from('profiles')
            .select('id, full_name')
            .eq('id', otherParticipantId)
            .single();
            
          conversationMap.set(conversationId, {
            id: conversationId,
            participant: profileData || { id: otherParticipantId, full_name: 'Unknown User' },
            product: message.product,
            lastMessage: message,
            messages: [message],
            unreadCount: isCurrentUserSender ? 0 : (message.is_read ? 0 : 1)
          });
        } else {
          const conv = conversationMap.get(conversationId);
          conv.messages.push(message);
          
          // Count unread messages
          if (!isCurrentUserSender && !message.is_read) {
            conv.unreadCount += 1;
          }
        }
      }
      
      // Convert map to array and sort by last message time
      const conversationsArray = Array.from(conversationMap.values())
        .map(conv => ({
          id: conv.id,
          participant: conv.participant,
          product: conv.product,
          lastMessage: conv.messages.sort((a: any, b: any) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )[0],
          unreadCount: conv.unreadCount
        }))
        .sort((a, b) => 
          new Date(b.lastMessage?.created_at || 0).getTime() - 
          new Date(a.lastMessage?.created_at || 0).getTime()
        );
      
      setConversations(conversationsArray);
      
      // Update current conversation if needed
      if (currentConversation) {
        const updatedCurrentConv = conversationsArray.find(c => c.id === currentConversation.id);
        if (updatedCurrentConv) {
          setCurrentConversation(updatedCurrentConv);
        }
      }
      
    } catch (error: any) {
      console.error('Error loading conversations:', error.message);
    }
  };

  // Load messages for a specific conversation
  const loadMessages = async (conversationId: string) => {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      setMessages(data as ChatMessage[]);
      
      // Mark messages as read
      markMessagesAsRead(conversationId);
      
    } catch (error: any) {
      console.error('Error loading messages:', error.message);
    }
  };

  // Mark messages as read
  const markMessagesAsRead = async (conversationId: string) => {
    if (!profile) return;
    
    try {
      const { error } = await supabase
        .from('chat_messages')
        .update({ is_read: true })
        .eq('conversation_id', conversationId)
        .eq('receiver_id', profile.id)
        .eq('is_read', false);
      
      if (error) throw error;
      
      // Update unread count in conversations
      setConversations(conversations.map(conv => 
        conv.id === conversationId ? { ...conv, unreadCount: 0 } : conv
      ));
      
    } catch (error: any) {
      console.error('Error marking messages as read:', error.message);
    }
  };

  // Send a new message
  const sendMessage = async (message: string, isOffer: boolean = false) => {
    if (!profile || !currentConversation) return;
    
    try {
      const newMessage = {
        conversation_id: currentConversation.id,
        sender_id: profile.id,
        receiver_id: currentConversation.participant.id,
        product_id: currentConversation.product?.id || null,
        message,
        is_read: false,
        is_offer: isOffer,
        offer_status: isOffer ? 'pending' : null
      };
      
      const { error } = await supabase
        .from('chat_messages')
        .insert(newMessage);
      
      if (error) throw error;
      
      // Optimistically update the UI
      loadMessages(currentConversation.id);
      loadConversations();
      
    } catch (error: any) {
      console.error('Error sending message:', error.message);
    }
  };

  // Start a new conversation with a user
  const startNewConversation = async (receiverId: string, productId: string | null = null): Promise<string> => {
    if (!profile) throw new Error('User not authenticated');
    
    try {
      // Check if conversation already exists
      const { data: existingConvs } = await supabase
        .from('chat_messages')
        .select('conversation_id')
        .or(`and(sender_id.eq.${profile.id},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${profile.id})`)
        .eq('product_id', productId)
        .limit(1);
      
      if (existingConvs && existingConvs.length > 0) {
        // Find the conversation in our list
        const existingConv = conversations.find(conv => conv.id === existingConvs[0].conversation_id);
        if (existingConv) {
          setCurrentConversation(existingConv);
          await loadMessages(existingConv.id);
        }
        
        return existingConvs[0].conversation_id;
      }
      
      // Create new conversation ID
      const conversationId = uuidv4();
      
      // Get receiver profile
      const { data: receiverProfile } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('id', receiverId)
        .single();
      
      // Get product if provided
      let product = null;
      if (productId) {
        const { data: productData } = await supabase
          .from('products')
          .select('id, name, image_url, price, unit')
          .eq('id', productId)
          .single();
        
        product = productData;
      }
      
      // Create conversation object
      const newConversation: Conversation = {
        id: conversationId,
        participant: receiverProfile || { id: receiverId, full_name: 'Unknown User' },
        product: product || undefined,
        unreadCount: 0
      };
      
      // Update state
      setConversations([newConversation, ...conversations]);
      setCurrentConversation(newConversation);
      setMessages([]);
      
      return conversationId;
      
    } catch (error: any) {
      console.error('Error starting conversation:', error.message);
      throw error;
    }
  };

  return (
    <ChatContext.Provider value={{
      conversations,
      currentConversation,
      messages,
      setCurrentConversation,
      sendMessage,
      loadMessages,
      startNewConversation,
      loadConversations,
      markMessagesAsRead,
      respondToOffer
    }}>
      {children}
    </ChatContext.Provider>
  );
};
