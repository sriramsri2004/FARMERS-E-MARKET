
import React, { useEffect, useRef } from 'react';
import { useChat } from '@/contexts/ChatContext';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Check, X, Phone, MapPin, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

const ChatMessageList: React.FC = () => {
  const { messages, currentConversation, respondToOffer } = useChat();
  const { profile } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [farmerDetails, setFarmerDetails] = React.useState<any>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Fetch farmer details when needed
  useEffect(() => {
    async function fetchFarmerDetails() {
      if (!currentConversation?.product?.id) return;
      
      try {
        // First get the product to find the farmer_id
        const { data: product, error: productError } = await supabase
          .from('products')
          .select('farmer_id')
          .eq('id', currentConversation.product.id)
          .single();
        
        if (productError) throw productError;
        if (!product) return;
        
        // Get farmer's profile
        const { data: farmerProfile, error: profileError } = await supabase
          .from('profiles')
          .select('id, full_name')
          .eq('id', product.farmer_id)
          .single();
          
        if (profileError) throw profileError;
        
        // Get farmer's extended profile
        const { data: farmerExtended, error: extendedError } = await supabase
          .from('profiles_extended')
          .select('phone_number, address, village, district, state, pin_code, profile_image_url')
          .eq('id', product.farmer_id)
          .single();
          
        if (extendedError) throw extendedError;
          
        setFarmerDetails({
          ...farmerProfile,
          ...farmerExtended
        });
      } catch (error) {
        console.error("Error fetching farmer details:", error);
      }
    }
    
    fetchFarmerDetails();
  }, [currentConversation, messages]);

  // Format time helper function
  const formatTime = (dateString: string) => {
    return format(new Date(dateString), 'h:mm a');
  };

  // Handle accept offer
  const handleAcceptOffer = async (messageId: string) => {
    try {
      await respondToOffer(messageId, 'accepted');
      toast({
        title: 'Offer Accepted',
        description: 'The buyer has been notified and can now see your contact information.'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Could not accept offer. Please try again.',
        variant: 'destructive'
      });
    }
  };
  
  // Handle decline offer
  const handleDeclineOffer = async (messageId: string) => {
    try {
      await respondToOffer(messageId, 'declined');
      toast({
        title: 'Offer Declined',
        description: 'The buyer has been notified that you declined their offer.'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Could not decline offer. Please try again.',
        variant: 'destructive'
      });
    }
  };

  // Check if message is an offer
  const isOfferMessage = (message: string) => {
    return message.trim().startsWith('OFFER DETAILS:');
  };

  // Render offer buttons
  const renderOfferButtons = (message: any) => {
    // Only show offer buttons if:
    // 1. User is the farmer/receiver
    // 2. The message is from the buyer
    // 3. The offer status is pending
    if (
      profile &&
      message.receiver_id === profile.id &&
      message.sender_id !== profile.id &&
      message.offer_status === 'pending'
    ) {
      return (
        <div className="mt-2 flex gap-2 justify-end">
          <Button 
            variant="outline" 
            size="sm" 
            className="bg-red-50 text-red-600 border-red-200 hover:bg-red-100"
            onClick={() => handleDeclineOffer(message.id)}
          >
            <X className="h-3 w-3 mr-1" />
            Decline
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="bg-green-50 text-green-600 border-green-200 hover:bg-green-100"
            onClick={() => handleAcceptOffer(message.id)}
          >
            <Check className="h-3 w-3 mr-1" />
            Accept
          </Button>
        </div>
      );
    }
    return null;
  };

  // Render offer status
  const renderOfferStatus = (message: any) => {
    if (message.offer_status === 'accepted') {
      return (
        <Badge className="bg-green-100 text-green-800 mt-1">
          <Check className="h-3 w-3 mr-1" /> Offer Accepted
        </Badge>
      );
    } else if (message.offer_status === 'declined') {
      return (
        <Badge className="bg-red-100 text-red-800 mt-1">
          <X className="h-3 w-3 mr-1" /> Offer Declined
        </Badge>
      );
    }
    return null;
  };

  // Render farmer details
  const renderFarmerDetails = (message: any) => {
    // Show farmer details if:
    // 1. The message is an offer
    // 2. The offer has been accepted
    // 3. The user is the buyer/sender
    // 4. We have farmer details
    if (
      profile && 
      message.sender_id === profile.id &&
      message.offer_status === 'accepted' && 
      farmerDetails
    ) {
      return (
        <div className="mt-3 p-3 bg-green-50 rounded-md border border-green-100">
          <p className="text-sm font-medium text-green-800 mb-2">Farmer's Contact Information:</p>
          
          <div className="flex items-center mb-3">
            {farmerDetails.profile_image_url ? (
              <Avatar className="h-16 w-16 mr-3">
                <AvatarImage src={farmerDetails.profile_image_url} alt={farmerDetails.full_name} />
                <AvatarFallback>{farmerDetails.full_name?.charAt(0) || 'F'}</AvatarFallback>
              </Avatar>
            ) : (
              <Avatar className="h-16 w-16 mr-3">
                <AvatarFallback>{farmerDetails.full_name?.charAt(0) || 'F'}</AvatarFallback>
              </Avatar>
            )}
            <div>
              <p className="text-sm font-medium">{farmerDetails.full_name || 'Farmer'}</p>
              {farmerDetails.phone_number && (
                <div className="flex items-center mt-1">
                  <Phone className="h-3.5 w-3.5 text-green-600 mr-2" />
                  <span className="text-sm">{farmerDetails.phone_number}</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="space-y-2 text-sm">
            {(farmerDetails.address || farmerDetails.village || farmerDetails.district || farmerDetails.state) && (
              <div className="flex items-start">
                <MapPin className="h-3.5 w-3.5 text-green-600 mr-2 mt-0.5" />
                <div>
                  {farmerDetails.address && <p>{farmerDetails.address}</p>}
                  {farmerDetails.village && <p>{farmerDetails.village}</p>}
                  {(farmerDetails.district || farmerDetails.state) && (
                    <p>
                      {farmerDetails.district}{farmerDetails.district && farmerDetails.state ? ', ' : ''}
                      {farmerDetails.state}
                    </p>
                  )}
                  {farmerDetails.pin_code && <p>PIN: {farmerDetails.pin_code}</p>}
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  if (!currentConversation || !profile) {
    return null;
  }
  
  return (
    <div className="space-y-4">
      {currentConversation.product && (
        <div className="bg-gray-50 rounded-lg p-3 mb-4 flex items-center">
          <div className="h-10 w-10 rounded-md overflow-hidden mr-3">
            <img
              src={currentConversation.product.image_url || '/placeholder.svg'}
              alt={currentConversation.product.name}
              className="h-full w-full object-cover"
            />
          </div>
          <div>
            <p className="text-sm font-medium">{currentConversation.product.name}</p>
            <p className="text-xs text-gray-500">Discussing this product</p>
          </div>
        </div>
      )}
      
      {messages.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No messages yet. Start a conversation!</p>
        </div>
      ) : (
        messages.map((message) => {
          const isCurrentUser = message.sender_id === profile.id;
          const isOffer = isOfferMessage(message.message);
          
          return (
            <div
              key={message.id}
              className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  isCurrentUser
                    ? 'bg-farmer-700 text-white rounded-tr-none'
                    : 'bg-gray-100 text-gray-800 rounded-tl-none'
                } ${isOffer ? 'whitespace-pre-wrap' : ''}`}
              >
                <p className={`${isOffer ? 'font-mono text-xs' : 'text-sm'}`}>{message.message}</p>
                <p
                  className={`text-xs mt-1 ${
                    isCurrentUser ? 'text-farmer-200' : 'text-gray-500'
                  }`}
                >
                  {formatTime(message.created_at)}
                </p>
                
                {renderOfferStatus(message)}
                {renderOfferButtons(message)}
                {renderFarmerDetails(message)}
              </div>
            </div>
          );
        })
      )}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default ChatMessageList;
