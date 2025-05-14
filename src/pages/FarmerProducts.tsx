
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  quantity: number;
  unit: string;
  category: string;
  is_organic: boolean;
  image_url: string;
  created_at: string;
  location?: string;
}

const FarmerProducts: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { profile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (profile) {
      fetchProducts();

      // Set up real-time listeners
      const productsChannel = supabase
        .channel('products_changes')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'products', filter: `farmer_id=eq.${profile.id}` }, 
          () => {
            fetchProducts();
          })
        .subscribe();

      return () => {
        supabase.removeChannel(productsChannel);
      };
    }
  }, [profile]);

  const fetchProducts = async () => {
    if (!profile) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('farmer_id', profile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error: any) {
      console.error('Error fetching products:', error);
      toast({
        title: 'Error',
        description: 'Failed to load products',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) throw error;

      setProducts(products.filter(product => product.id !== productId));
      
      toast({
        title: 'Product deleted',
        description: 'The product has been removed',
      });
    } catch (error: any) {
      console.error('Error deleting product:', error);
      toast({
        title: 'Error',
        description: 'Could not delete product',
        variant: 'destructive'
      });
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  // Function to safely format price
  const formatPrice = (price: any): string => {
    // Ensure price is a number before using toFixed
    const numericPrice = Number(price);
    return isNaN(numericPrice) ? '0.00' : numericPrice.toFixed(2);
  };

  const handleEditProduct = (productId: string) => {
    navigate("/dashboard", { state: { activeTab: "add-product", productId: productId } });
  };

  return (
    <div className="min-h-screen bg-farmer-50/50 py-8">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Products</h1>
            <p className="text-gray-600">Manage your agricultural products</p>
          </div>
          
          <Button 
            onClick={() => navigate("/dashboard", { state: { activeTab: "add-product" } })}
            className="bg-farmer-700 hover:bg-farmer-800"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add New Product
          </Button>
        </div>
        
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-farmer-700"></div>
          </div>
        ) : products.length === 0 ? (
          <Card className="p-8 text-center">
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No products listed yet</h3>
            <p className="text-gray-600 mb-4">
              Start adding your farm products to sell in the marketplace
            </p>
            <Button 
              onClick={() => navigate("/dashboard", { state: { activeTab: "add-product" } })}
              className="bg-farmer-700 hover:bg-farmer-800"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add First Product
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <Card key={product.id} className="overflow-hidden bg-white">
                <div className="h-48 overflow-hidden">
                  <img
                    src={product.image_url || 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?q=80&w=3540&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'}
                    alt={product.name}
                    className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                  />
                </div>
                
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-lg text-gray-900">{product.name}</h3>
                    {product.is_organic && (
                      <Badge className="bg-green-100 text-green-800">Organic</Badge>
                    )}
                  </div>
                  
                  <p className="text-sm text-gray-600 line-clamp-2 mb-3">{product.description}</p>
                  
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-farmer-700 font-medium text-lg">₹{formatPrice(product.price)}/{product.unit}</span>
                      <p className="text-xs text-gray-500 mt-1">
                        Available: {product.quantity} {product.unit}{product.quantity > 1 && product.unit !== 'dozen' ? 's' : ''}
                      </p>
                      {product.location && (
                        <p className="text-xs text-gray-500">
                          Location: {product.location}
                        </p>
                      )}
                      <p className="text-xs text-gray-500">
                        Added: {formatDate(product.created_at)}
                      </p>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleEditProduct(product.id)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Product?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete your product from the marketplace.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-red-500 hover:bg-red-600"
                              onClick={() => handleDeleteProduct(product.id)}
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FarmerProducts;
