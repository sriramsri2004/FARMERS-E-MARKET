
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Heart, Trash } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Mock favorite products
const MOCK_FAVORITES = [
  {
    id: '1',
    name: 'Fresh Baby Spinach',
    description: 'Tender baby spinach leaves, perfect for salads and smoothies.',
    price: 3.29,
    unit: 'bundle',
    image: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?q=80&w=3540&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    category: 'vegetables',
    isOrganic: true,
    farmer: {
      name: 'John Smith',
      farm: 'Countryside Farm'
    }
  },
  {
    id: '3',
    name: 'Brown Rice',
    description: 'Nutritious brown rice grown without pesticides, perfect for a healthy diet.',
    price: 5.99,
    unit: 'kg',
    image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?q=80&w=3540&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    category: 'grains',
    isOrganic: true,
    farmer: {
      name: 'Kumaraswamy',
      farm: 'Countryside Farm'
    }
  }
];

interface FavoriteProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  unit: string;
  image: string;
  category: string;
  isOrganic: boolean;
  farmer: {
    name: string;
    farm: string;
  };
}

const BuyerFavorites: React.FC = () => {
  const [favorites, setFavorites] = useState<FavoriteProduct[]>(MOCK_FAVORITES);
  const { toast } = useToast();

  const handleRemoveFavorite = (id: string) => {
    setFavorites(favorites.filter(fav => fav.id !== id));
    toast({
      title: "Removed from favorites",
      description: "Product has been removed from your favorites.",
    });
  };

  const handleAddToCart = (product: FavoriteProduct) => {
    toast({
      title: "Added to cart",
      description: `${product.name} has been added to your cart.`,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Favorite Products</h2>
        <p className="text-gray-600">Products you've saved for later</p>
      </div>
      
      {favorites.length === 0 ? (
        <Card className="p-8 text-center">
          <h3 className="text-xl font-semibold text-gray-800 mb-2">No favorites yet</h3>
          <p className="text-gray-600 mb-4">You haven't added any products to your favorites yet.</p>
          <Button className="bg-farmer-700 hover:bg-farmer-800">
            Browse Market
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {favorites.map(product => (
            <Card key={product.id} className="overflow-hidden border border-gray-100 animate-fade-in">
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
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute top-2 right-2 h-8 w-8 bg-white hover:bg-red-100 hover:text-red-600 hover:border-red-200"
                  onClick={() => handleRemoveFavorite(product.id)}
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="p-4">
                <div className="flex justify-between items-start">
                  <h3 className="text-lg font-semibold text-gray-900">{product.name}</h3>
                  <p className="font-bold text-farmer-700">
                    ${product.price.toFixed(2)}
                    <span className="text-xs text-gray-500">/{product.unit}</span>
                  </p>
                </div>
                
                <p className="text-gray-600 text-sm mt-1 mb-3 line-clamp-2">{product.description}</p>
                
                <div className="flex items-center text-sm text-gray-600 mb-4">
                  <span>From </span>
                  <span className="font-semibold ml-1">{product.farmer.name}</span>
                  <span className="mx-1">·</span>
                  <span>{product.farmer.farm}</span>
                </div>
                
                <Button 
                  className="w-full bg-farmer-700 hover:bg-farmer-800"
                  onClick={() => handleAddToCart(product)}
                >
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Add to Cart
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default BuyerFavorites;
