
import React, { useState, KeyboardEvent } from 'react';
import { useChat } from '@/contexts/ChatContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles } from 'lucide-react';

const ChatInput: React.FC = () => {
  const [message, setMessage] = useState('');
  const { sendMessage, currentConversation } = useChat();
  const [isSending, setIsSending] = useState(false);
  const [isCreatingOffer, setIsCreatingOffer] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [offerPrice, setOfferPrice] = useState('');

  const handleSendMessage = async () => {
    if (message.trim() === '' || isSending) return;
    
    try {
      setIsSending(true);
      await sendMessage(message.trim(), false);
      setMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleOfferForm = () => {
    setIsCreatingOffer(!isCreatingOffer);
    
    // Set initial offer price based on product if available
    if (!isCreatingOffer && currentConversation?.product?.price) {
      setOfferPrice(currentConversation.product.price.toString());
    }
  };

  const handleSendOffer = async () => {
    if (isSending) return;
    
    try {
      setIsSending(true);
      
      const productName = currentConversation?.product?.name || 'Product';
      const unitPrice = parseFloat(offerPrice);
      const total = unitPrice * quantity;
      
      const offerMessage = `OFFER DETAILS:
Product: ${productName}
Quantity: ${quantity} ${currentConversation?.product?.unit || 'units'}
Offered Price: $${unitPrice.toFixed(2)} per ${currentConversation?.product?.unit || 'unit'}
Total: $${total.toFixed(2)}

I'm interested in purchasing this product. Please let me know if this offer works for you.`;
      
      await sendMessage(offerMessage, true);
      
      // Reset form
      setIsCreatingOffer(false);
      setQuantity(1);
      setOfferPrice('');
      
    } catch (error) {
      console.error('Error sending offer:', error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div>
      {isCreatingOffer ? (
        <div className="space-y-3 mb-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <h3 className="text-sm font-medium">Make an Offer</h3>
          
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Quantity</label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Price per {currentConversation?.product?.unit || 'unit'}</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={offerPrice}
                onChange={(e) => setOfferPrice(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                placeholder={`$ per ${currentConversation?.product?.unit || 'unit'}`}
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setIsCreatingOffer(false)}
            >
              Cancel
            </Button>
            <Button 
              size="sm"
              onClick={handleSendOffer}
              disabled={isSending || !offerPrice || quantity < 1}
              className="bg-farmer-700 hover:bg-farmer-800"
            >
              Send Offer
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex justify-end mb-2">
          <Button
            variant="outline"
            size="sm"
            onClick={toggleOfferForm}
            className="text-farmer-700 border-farmer-200"
          >
            <Sparkles className="h-3 w-3 mr-1" />
            Make an Offer
          </Button>
        </div>
      )}
      
      <div className="flex items-end space-x-2">
        <div className="flex-1">
          <Textarea
            placeholder="Type your message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            className="resize-none min-h-[60px]"
          />
        </div>
        <Button 
          onClick={handleSendMessage} 
          disabled={message.trim() === '' || isSending}
          className="bg-farmer-700 hover:bg-farmer-800"
        >
          {isSending ? (
            <span className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin inline-block"></span>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m22 2-7 20-4-9-9-4Z" />
              <path d="M22 2 11 13" />
            </svg>
          )}
        </Button>
      </div>
    </div>
  );
};

export default ChatInput;
