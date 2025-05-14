
import React, { useState } from 'react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerClose } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { useChat } from '@/contexts/ChatContext';
import ChatConversationList from './ChatConversationList';
import ChatMessageList from './ChatMessageList';
import ChatInput from './ChatInput';

interface ChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const ChatDrawer: React.FC<ChatDrawerProps> = ({ isOpen, onClose }) => {
  const { currentConversation, setCurrentConversation } = useChat();
  
  const handleBack = () => {
    setCurrentConversation(null);
  };

  return (
    <Drawer open={isOpen} onOpenChange={onClose}>
      <DrawerContent className="h-[85vh]">
        <DrawerHeader className="border-b border-gray-100">
          <div className="flex items-center justify-between">
            <DrawerTitle>
              {currentConversation ? (
                <div className="flex items-center">
                  <Button variant="ghost" size="icon" className="mr-2" onClick={handleBack}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-left h-4 w-4">
                      <path d="m15 18-6-6 6-6"/>
                    </svg>
                  </Button>
                  {currentConversation.participant.full_name || 'Chat'}
                </div>
              ) : (
                'Messages'
              )}
            </DrawerTitle>
            <DrawerClose asChild>
              <Button variant="ghost" size="icon">
                <X className="h-4 w-4" />
              </Button>
            </DrawerClose>
          </div>
        </DrawerHeader>
        
        <div className="flex flex-col h-full overflow-hidden">
          {currentConversation ? (
            <>
              <div className="flex-1 overflow-auto p-4">
                <ChatMessageList />
              </div>
              <div className="border-t border-gray-100 p-4">
                <ChatInput />
              </div>
            </>
          ) : (
            <div className="flex-1 overflow-auto">
              <ChatConversationList />
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default ChatDrawer;
