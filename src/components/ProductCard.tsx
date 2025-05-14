
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { ShoppingCart, MessageCircle, Phone } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useChat } from '@/contexts/ChatContext';
import { useAuth } from '@/contexts/AuthContext';
import { Checkbox } from '@/components/ui/checkbox';

interface Farmer {
  id: string;
  name: string;
  farm: string;
  rating: number;
  phone_number?: string;
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  unit: string;
  quantity: number;
  image: string;
  category: string;
  isOrganic: boolean;
  farmer: Farmer;
  show_contact_number?: boolean;
}

interface ProductCardProps {
  product: Product;
  viewMode: 'grid' | 'list' | 'compact';
  onContactToggle?: (isChecked: boolean) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, viewMode, onContactToggle }) => {
  const [orderQuantity, setOrderQuantity] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const { startNewConversation } = useChat();
  const { profile } = useAuth();

  // Ensure price is a number for toFixed method
  const formatPrice = (price: any): string => {
    const numPrice = typeof price === 'number' ? price : Number(price);
    return isNaN(numPrice) ? '0.00' : numPrice.toFixed(2);
  };

  const handleOrder = () => {
    // In real app, this would communicate with Supabase
    toast({
      title: "Order Placed!",
      description: `You ordered ${orderQuantity} ${product.unit}${orderQuantity > 1 && product.unit !== 'dozen' ? 's' : ''} of ${product.name}`,
    });
    setIsDialogOpen(false);
  };

  const handleStartChat = async (buyerId: string) => {
    if (!profile) return;
    
    try {
      await startNewConversation(buyerId, product.id);
      toast({
        title: "Chat Started",
        description: "You can now chat with the buyer",
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

  const handleContactToggle = (checked: boolean) => {
    if (onContactToggle) {
      onContactToggle(checked);
    }
  };

  const showContactNumber = product.show_contact_number && product.farmer.phone_number;

  if (viewMode === 'compact') {
    return (
      <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-shadow animate-fade-in card-hover">
        <div className="p-4 flex items-center space-x-3">
          <div className="h-12 w-12 rounded-md overflow-hidden">
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-gray-900">{product.name}</h3>
              <p className="font-semibold text-farmer-700">
                ₹{formatPrice(product.price)}/{product.unit}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (viewMode === 'list') {
    return (
      <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-shadow animate-fade-in card-hover">
        <div className="flex flex-col sm:flex-row">
          <div className="sm:w-1/3 h-48 sm:h-auto">
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="p-6 flex-1 flex flex-col">
            <div className="mb-4">
              {product.isOrganic && (
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
            
            <div className="flex items-center mt-auto">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-farmer-100 rounded-full flex items-center justify-center text-farmer-700 text-xs">
                  {product.farmer.name.charAt(0)}
                </div>
                <div className="ml-2">
                  <p className="text-sm font-medium">{product.farmer.name}</p>
                  <div className="flex items-center">
                    <p className="text-xs text-gray-500">{product.farmer.farm}</p>
                    <div className="flex items-center ml-2">
                      <svg className="w-3 h-3 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span className="text-xs text-gray-500 ml-1">{product.farmer.rating}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="ml-auto space-y-2">
                {onContactToggle && (
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id={`show-contact-${product.id}`} 
                      defaultChecked={!!product.show_contact_number}
                      onCheckedChange={handleContactToggle}
                    />
                    <label 
                      htmlFor={`show-contact-${product.id}`}
                      className="text-sm text-gray-700 font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Show Contact Number
                    </label>
                  </div>
                )}
                
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full bg-farmer-700 hover:bg-farmer-800">
                      <ShoppingCart className="mr-2 h-4 w-4" />
                      Order Now
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Place Order</DialogTitle>
                      <DialogDescription>
                        Enter the quantity you want to order.
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
                          onChange={(e) => setOrderQuantity(parseInt(e.target.value))}
                          className="col-span-3"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">Price</Label>
                        <div className="col-span-3">
                          ₹{(Number(product.price) * orderQuantity).toFixed(2)}
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="submit" onClick={handleOrder}>
                        Place Order
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Default grid view
  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-shadow animate-fade-in card-hover">
      <div className="relative h-48">
        <img 
          src={product.image} 
          alt={product.name} 
          className="w-full h-full object-cover"
        />
        {product.isOrganic && (
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
            {product.category}
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
        
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-6 h-6 bg-farmer-100 rounded-full flex items-center justify-center text-farmer-700 text-xs">
              {product.farmer.name.charAt(0)}
            </div>
            <span className="ml-2 text-xs text-gray-600">{product.farmer.farm}</span>
          </div>
          <div className="flex items-center">
            <svg className="w-3 h-3 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span className="text-xs text-gray-600 ml-1">{product.farmer.rating}</span>
          </div>
        </div>
        
        {onContactToggle && (
          <div className="flex items-center space-x-2 mt-3">
            <Checkbox 
              id={`show-contact-${product.id}`} 
              defaultChecked={!!product.show_contact_number}
              onCheckedChange={handleContactToggle}
            />
            <label 
              htmlFor={`show-contact-${product.id}`}
              className="text-sm text-gray-700 font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Show Contact Number
            </label>
          </div>
        )}
      </div>
      
      <div className="px-4 pb-4 pt-2 border-t border-gray-50">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full bg-farmer-700 hover:bg-farmer-800">
              <ShoppingCart className="mr-2 h-4 w-4" />
              Order Now
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Place Order</DialogTitle>
              <DialogDescription>
                Enter the quantity you want to order.
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
                  onChange={(e) => setOrderQuantity(parseInt(e.target.value))}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Price</Label>
                <div className="col-span-3">
                  ₹{(Number(product.price) * orderQuantity).toFixed(2)}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" onClick={handleOrder}>
                Place Order
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default ProductCard;
