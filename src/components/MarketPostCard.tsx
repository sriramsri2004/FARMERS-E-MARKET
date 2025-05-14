
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { MessageCircle, Phone, ThumbsUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useChat } from '@/contexts/ChatContext';
import { format } from 'date-fns';

interface Farmer {
  id: string;
  name: string;
  farm?: string;
  rating?: number;
  show_contact_number?: boolean;
  phone_number?: string;
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  unit: string;
  quantity: number;
  image_url: string;
  category: string;
  is_organic: boolean;
  location: string;
  harvest_date: string | null;
  created_at: string;
  show_contact_number: boolean;
  farmer: Farmer;
}

interface MarketPostCardProps {
  product: Product;
  viewMode: 'grid' | 'list';
  onPlaceOrder?: (quantity: number) => void;
}

const MarketPostCard: React.FC<MarketPostCardProps> = ({ product, viewMode }) => {
  const [orderQuantity, setOrderQuantity] = useState(1);
  const [priceOffer, setPriceOffer] = useState(product.price);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDetailViewOpen, setIsDetailViewOpen] = useState(false);
  const { toast } = useToast();
  const { profile } = useAuth();
  const { startNewConversation, sendMessage } = useChat();
  
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return format(new Date(dateString), 'dd MMM yyyy');
  };

  const handleSetQuantity = (value: string) => {
    const qty = parseInt(value);
    if (!isNaN(qty) && qty > 0 && qty <= product.quantity) {
      setOrderQuantity(qty);
    }
  };

  const handleSetPriceOffer = (value: string) => {
    const price = parseFloat(value);
    if (!isNaN(price) && price > 0) {
      setPriceOffer(price);
    }
  };

  const handleStartChat = async () => {
    if (!profile) {
      toast({
        title: "Login Required",
        description: "Please log in to chat with the farmer",
        variant: "destructive"
      });
      return;
    }

    try {
      await startNewConversation(product.farmer.id, product.id);
      toast({
        title: "Chat Started",
        description: `You can now chat with ${product.farmer.name}`,
      });
    } catch (error) {
      console.error('Error starting chat:', error);
      toast({
        title: "Error",
        description: "Could not start chat. Please try again.",
        variant: "destructive"
      });
    }
  };

  const submitInterestOffer = async () => {
    if (!profile) {
      toast({
        title: "Login Required",
        description: "Please log in to express interest",
        variant: "destructive"
      });
      return;
    }

    try {
      // Start or get conversation with the farmer
      const conversationId = await startNewConversation(product.farmer.id, product.id);
      
      // Create the offer message
      const offerMessage = `
OFFER DETAILS:
Product: ${product.name}
Quantity: ${orderQuantity} ${product.unit}${orderQuantity > 1 && product.unit !== 'dozen' ? 's' : ''}
Price Offer: ₹${priceOffer} per ${product.unit} (Original: ₹${product.price})
Total Value: ₹${(priceOffer * orderQuantity).toFixed(2)}
      `;
      
      // Send the message
      await sendMessage(offerMessage);
      
      toast({
        title: "Offer Sent!",
        description: "Your interest has been sent to the farmer",
      });
      
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error sending offer:', error);
      toast({
        title: "Error",
        description: "Failed to send offer. Please try again.",
        variant: "destructive"
      });
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'vegetables':
        return '🥬';
      case 'fruits':
        return '🍎';
      case 'grains':
        return '🌾';
      case 'dairy':
        return '🥛';
      case 'meat':
        return '🥩';
      case 'poultry':
        return '🍗';
      case 'herbs':
        return '🌿';
      default:
        return '📦';
    }
  };

  const showContactNumber = product.show_contact_number && product.farmer.phone_number;

  // Ensure price is a number for toFixed method
  const formatPrice = (price: any): string => {
    const numPrice = typeof price === 'number' ? price : Number(price);
    return isNaN(numPrice) ? '0.00' : numPrice.toFixed(2);
  };

  // Product Detail View Dialog
  const ProductDetailView = () => (
    <Dialog open={isDetailViewOpen} onOpenChange={setIsDetailViewOpen}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">{product.name}</DialogTitle>
          <DialogDescription>
            {product.is_organic && (
              <Badge className="mt-2 bg-green-100 text-green-800 hover:bg-green-200">
                Organic
              </Badge>
            )}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Product Image */}
          <div className="rounded-lg overflow-hidden">
            <img 
              src={product.image_url} 
              alt={product.name} 
              className="w-full h-auto object-cover"
            />
          </div>
          
          {/* Product Info */}
          <div>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold">Price</h3>
                <p className="text-xl font-bold text-farmer-700">
                  ₹{formatPrice(product.price)}/{product.unit}
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold">Description</h3>
                <p className="text-gray-700">{product.description}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold">Category</h3>
                  <Badge variant="outline" className="flex gap-1 mt-1">
                    <span>{getCategoryIcon(product.category)}</span>
                    <span>{product.category.charAt(0).toUpperCase() + product.category.slice(1)}</span>
                  </Badge>
                </div>
                
                {product.location && (
                  <div>
                    <h3 className="font-semibold">Location</h3>
                    <p className="text-gray-700">{product.location}</p>
                  </div>
                )}
              </div>
              
              {product.harvest_date && (
                <div>
                  <h3 className="font-semibold">Harvested On</h3>
                  <p className="text-gray-700">{formatDate(product.harvest_date)}</p>
                </div>
              )}
              
              <div className="pt-4 border-t">
                <h3 className="font-semibold">Farmer Information</h3>
                <div className="flex items-center mt-2">
                  <div className="w-10 h-10 bg-farmer-100 rounded-full flex items-center justify-center text-farmer-700">
                    {product.farmer.name.charAt(0)}
                  </div>
                  <div className="ml-3">
                    <p className="font-medium">{product.farmer.name}</p>
                    {product.farmer.farm && (
                      <p className="text-sm text-gray-500">{product.farmer.farm}</p>
                    )}
                  </div>
                </div>
                
                {showContactNumber && (
                  <div className="mt-3">
                    <Button 
                      variant="outline"
                      className="flex items-center gap-2 w-full md:w-auto"
                    >
                      <Phone className="h-4 w-4" />
                      <span>{product.farmer.phone_number}</span>
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-6">
          <Button
            variant="outline"
            className="flex-1 bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100"
            onClick={handleStartChat}
          >
            <MessageCircle className="mr-2 h-4 w-4" />
            Chat with Farmer
          </Button>
          
          <Button 
            variant="farmer" 
            className="flex-1"
            onClick={() => {
              setIsDetailViewOpen(false);
              setIsDialogOpen(true);
            }}
          >
            <ThumbsUp className="mr-2 h-4 w-4" />
            I'm Interested
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  // Interest Dialog
  const InterestDialog = () => (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Express Interest</DialogTitle>
          <DialogDescription>
            Make an offer for this product. The farmer will be notified of your interest.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="quantity" className="text-right">
              Quantity
            </Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              max={product.quantity}
              value={orderQuantity}
              onChange={(e) => handleSetQuantity(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="price" className="text-right">
              Price Offer
            </Label>
            <Input
              id="price"
              type="number"
              min="1"
              step="0.01"
              value={priceOffer}
              onChange={(e) => handleSetPriceOffer(e.target.value)}
              className="col-span-3"
            />
            <div className="col-span-4 text-sm text-gray-500">
              Original price: ₹{formatPrice(product.price)}/{product.unit}
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Available</Label>
            <div className="col-span-3">
              {product.quantity} {product.unit}
              {product.quantity > 1 && product.unit !== 'dozen' ? 's' : ''}
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Total</Label>
            <div className="col-span-3">
              ₹{(priceOffer * orderQuantity).toFixed(2)}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button 
            type="submit" 
            onClick={submitInterestOffer} 
            disabled={!profile}
            variant="farmer"
          >
            {profile ? 'Send Offer' : 'Login to Send Offer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  // List view rendering
  if (viewMode === 'list') {
    return (
      <>
        <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-shadow animate-fade-in cursor-pointer" onClick={() => setIsDetailViewOpen(true)}>
          <div className="flex flex-col sm:flex-row">
            <div className="sm:w-1/3 h-48 sm:h-auto">
              <img
                src={product.image_url}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-6 flex-1 flex flex-col">
              <div className="mb-4">
                {product.is_organic && (
                  <Badge className="mb-2 bg-green-100 text-green-800 hover:bg-green-200">
                    Organic
                  </Badge>
                )}
                <div className="flex justify-between items-start">
                  <h3 className="text-xl font-semibold text-gray-900">{product.name}</h3>
                  <p className="text-xl font-bold text-farmer-700">
                    ₹{formatPrice(product.price)}
                    <span className="text-sm text-gray-500">/{product.unit}</span>
                  </p>
                </div>
                <p className="text-gray-600 mt-2 line-clamp-2">{product.description}</p>
              </div>
              
              <div className="flex flex-wrap gap-2 mb-4">
                <Badge variant="outline" className="flex gap-1">
                  <span>{getCategoryIcon(product.category)}</span>
                  <span>{product.category.charAt(0).toUpperCase() + product.category.slice(1)}</span>
                </Badge>
                
                {product.location && (
                  <Badge variant="outline" className="text-gray-600">
                    {product.location}
                  </Badge>
                )}
                
                {product.harvest_date && (
                  <Badge variant="outline" className="text-gray-600">
                    Harvested: {formatDate(product.harvest_date)}
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center mt-auto">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-farmer-100 rounded-full flex items-center justify-center text-farmer-700 text-xs">
                    {product.farmer.name.charAt(0)}
                  </div>
                  <div className="ml-2">
                    <p className="text-sm font-medium">{product.farmer.name}</p>
                    {product.farmer.farm && (
                      <p className="text-xs text-gray-500">{product.farmer.farm}</p>
                    )}
                  </div>
                </div>
                
                <div className="ml-auto flex gap-2">
                  {showContactNumber && (
                    <Button 
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Phone className="h-3 w-3" />
                      <span>{product.farmer.phone_number}</span>
                    </Button>
                  )}
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStartChat();
                    }}
                    className="bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100"
                  >
                    <MessageCircle className="mr-1 h-4 w-4" />
                    Chat Now
                  </Button>
                  
                  <Button 
                    variant="farmer"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsDialogOpen(true);
                    }}
                  >
                    <ThumbsUp className="mr-2 h-4 w-4" />
                    I'm Interested
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <ProductDetailView />
        <InterestDialog />
      </>
    );
  }

  // Grid view rendering
  return (
    <>
      <div 
        className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-shadow animate-fade-in cursor-pointer"
        onClick={() => setIsDetailViewOpen(true)}
      >
        <div className="relative h-48">
          <img 
            src={product.image_url} 
            alt={product.name} 
            className="w-full h-full object-cover"
          />
          {product.is_organic && (
            <div className="absolute top-2 left-2">
              <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
                <svg className="w-3 h-3 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                Organic
              </Badge>
            </div>
          )}
          <div className="absolute bottom-2 right-2">
            <Badge className="bg-gray-800 bg-opacity-70 text-white">
              {getCategoryIcon(product.category)} {product.category}
            </Badge>
          </div>
        </div>
        
        <div className="p-4">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-lg font-semibold text-gray-900">{product.name}</h3>
            <p className="font-bold text-farmer-700">
              ₹{formatPrice(product.price)}
              <span className="text-xs text-gray-500">/{product.unit}</span>
            </p>
          </div>
          
          <p className="text-gray-600 text-sm mb-4 line-clamp-2">{product.description}</p>
          
          <div className="flex flex-wrap gap-2 mb-4">
            {product.location && (
              <Badge variant="outline" className="text-gray-600 text-xs">
                {product.location}
              </Badge>
            )}
            
            {product.harvest_date && (
              <Badge variant="outline" className="text-gray-600 text-xs">
                Harvested: {formatDate(product.harvest_date)}
              </Badge>
            )}
          </div>
          
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className="w-6 h-6 bg-farmer-100 rounded-full flex items-center justify-center text-farmer-700 text-xs">
                {product.farmer.name.charAt(0)}
              </div>
              <span className="ml-2 text-xs text-gray-600">{product.farmer.name}</span>
            </div>
          </div>
          
          {showContactNumber && (
            <div className="mb-3">
              <Button 
                variant="outline"
                size="sm"
                className="w-full flex items-center justify-center gap-1 text-xs"
                onClick={(e) => e.stopPropagation()}
              >
                <Phone className="h-3 w-3" />
                <span>{product.farmer.phone_number}</span>
              </Button>
            </div>
          )}
        </div>
        
        <div className="px-4 pb-4 pt-0">
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1 bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100"
              onClick={(e) => {
                e.stopPropagation();
                handleStartChat();
              }}
            >
              <MessageCircle className="mr-1 h-4 w-4" />
              Chat
            </Button>
            
            <Button 
              variant="farmer" 
              className="flex-1"
              onClick={(e) => {
                e.stopPropagation();
                setIsDialogOpen(true);
              }}
            >
              <ThumbsUp className="mr-1 h-4 w-4" />
              Interested
            </Button>
          </div>
        </div>
      </div>
      <ProductDetailView />
      <InterestDialog />
    </>
  );
};

export default MarketPostCard;
