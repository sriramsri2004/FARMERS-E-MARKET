
import React, { useEffect } from 'react';
import { useChat } from '@/contexts/ChatContext';
import { formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

const ChatConversationList: React.FC = () => {
  const { conversations, setCurrentConversation, loadMessages } = useChat();

  const handleSelectConversation = async (conversationId: string) => {
    const conversation = conversations.find(conv => conv.id === conversationId);
    if (conversation) {
      setCurrentConversation(conversation);
      await loadMessages(conversationId);
    }
  };

  const formatTime = (dateString?: string) => {
    if (!dateString) return '';
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  };

  return (
    <ScrollArea className="h-full">
      <div className="divide-y divide-gray-100">
        {conversations.length > 0 ? (
          conversations.map((conversation) => (
            <div
              key={conversation.id}
              className="p-4 cursor-pointer hover:bg-gray-50"
              onClick={() => handleSelectConversation(conversation.id)}
            >
              <div className="flex items-center">
                <div className="h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-700 mr-3">
                  {conversation.participant.full_name?.[0] || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-medium truncate">{conversation.participant.full_name || 'Unknown'}</p>
                    {conversation.lastMessage && (
                      <span className="text-xs text-gray-400">
                        {formatTime(conversation.lastMessage.created_at)}
                      </span>
                    )}
                  </div>
                  
                  {conversation.product && (
                    <div className="flex items-center mt-1">
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                        {conversation.product.name}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between mt-1">
                    {conversation.lastMessage && (
                      <p className="text-sm text-gray-500 truncate">
                        {conversation.lastMessage.message}
                      </p>
                    )}
                    
                    {conversation.unreadCount > 0 && (
                      <Badge className="bg-farmer-700 text-white ml-2">
                        {conversation.unreadCount}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="p-8 text-center">
            <p className="text-gray-500">No conversations yet</p>
          </div>
        )}
      </div>
    </ScrollArea>
  );
};

export default ChatConversationList;
