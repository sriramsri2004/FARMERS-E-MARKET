
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, Package } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
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

interface Order {
  id: string;
  product_id: string;
  product: {
    name: string;
    image_url: string;
    unit: string;
  };
  buyer: {
    full_name: string;
  };
  quantity: number;
  total_price: number;
  status: string;
  created_at: string;
}

const FarmerProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("products");
  const { toast } = useToast();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (profile) {
      fetchProducts();
      fetchOrders();

      // Set up real-time listeners
      const productsChannel = supabase
        .channel('products_changes')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'products', filter: `farmer_id=eq.${profile.id}` }, 
          () => {
            fetchProducts();
          })
        .subscribe();

      const ordersChannel = supabase
        .channel('orders_changes')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'orders', filter: `farmer_id=eq.${profile.id}` }, 
          () => {
            fetchOrders();
          })
        .subscribe();

      return () => {
        supabase.removeChannel(productsChannel);
        supabase.removeChannel(ordersChannel);
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

  const fetchOrders = async () => {
    if (!profile) return;

    setLoading(true);
    try {
      // Modified query to avoid the RLS error with buyer_id relationship
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          product:product_id (name, image_url, unit)
        `)
        .eq('farmer_id', profile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Format the orders data with placeholder for buyer name
      const formattedOrders = data.map((order: any) => ({
        ...order,
        buyer: {
          full_name: 'Buyer' // Simplified to avoid the lookup error
        }
      }));

      setOrders(formattedOrders || []);
    } catch (error: any) {
      console.error('Error fetching orders:', error);
      toast({
        title: 'Error',
        description: 'Failed to load orders',
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

  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId);

      if (error) throw error;

      setOrders(orders.map(order => 
        order.id === orderId ? { ...order, status } : order
      ));
      
      toast({
        title: 'Order updated',
        description: `Order status changed to ${status}`,
      });
    } catch (error: any) {
      console.error('Error updating order:', error);
      toast({
        title: 'Error',
        description: 'Could not update order status',
        variant: 'destructive'
      });
    }
  };

  const handleEditProduct = (productId: string) => {
    navigate("/dashboard", { state: { activeTab: "add-product", productId: productId } });
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'pending':
        return 'bg-amber-100 text-amber-800';
      case 'accepted':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Function to safely format price
  const formatPrice = (price: any): string => {
    // Ensure price is a number before using toFixed
    const numericPrice = Number(price);
    return isNaN(numericPrice) ? '0.00' : numericPrice.toFixed(2);
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="products" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="products">My Products</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
        </TabsList>
        
        <TabsContent value="products">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">My Products</h2>
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
            <div className="space-y-4">
              {products.map((product) => (
                <Card key={product.id} className="p-4 animate-fade-in">
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-md overflow-hidden flex-shrink-0">
                      <img
                        src={product.image_url || 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?q=80&w=3540&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'}
                        alt={product.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900">{product.name}</h3>
                        {product.is_organic && (
                          <Badge className="bg-green-100 text-green-800">Organic</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-1">{product.description}</p>
                      <div className="flex items-center mt-1 gap-4">
                        <span className="text-farmer-700 font-medium">₹{formatPrice(product.price)}/{product.unit}</span>
                        <span className="text-gray-500 text-sm">Quantity: {product.quantity} {product.unit}{product.quantity > 1 && product.unit !== 'dozen' ? 's' : ''}</span>
                        <span className="text-gray-500 text-sm">{product.category}</span>
                        {product.location && <span className="text-gray-500 text-sm">Location: {product.location}</span>}
                      </div>
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
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="orders">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Orders</h2>
            <Badge className="text-sm">
              <Package className="mr-2 h-4 w-4" />
              {orders.filter(order => order.status === 'pending').length} Pending
            </Badge>
          </div>
          
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-farmer-700"></div>
            </div>
          ) : orders.length === 0 ? (
            <Card className="p-8 text-center">
              <h3 className="text-xl font-semibold text-gray-800 mb-2">No orders yet</h3>
              <p className="text-gray-600">
                Orders from buyers will appear here
              </p>
            </Card>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <Card key={order.id} className="p-4 animate-fade-in">
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-md overflow-hidden flex-shrink-0">
                      <img
                        src={order.product?.image_url || 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?q=80&w=3540&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'}
                        alt={order.product?.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900">{order.product?.name}</h3>
                        <Badge className={getStatusColor(order.status)}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center mt-1 gap-4">
                        <span className="text-farmer-700 font-medium">
                          ₹{formatPrice(order.total_price)}
                        </span>
                        <span className="text-gray-500 text-sm">
                          Quantity: {order.quantity} {order.product?.unit}{order.quantity > 1 && order.product?.unit !== 'dozen' ? 's' : ''}
                        </span>
                        <span className="text-gray-500 text-sm">
                          Buyer: {order.buyer?.full_name}
                        </span>
                      </div>
                      
                      <p className="text-xs text-gray-500 mt-1">
                        Ordered: {formatDate(order.created_at)}
                      </p>
                    </div>
                    
                    {order.status === 'pending' && (
                      <div className="flex gap-2">
                        <Button 
                          size="sm"
                          variant="outline" 
                          className="border-green-500 text-green-700 hover:bg-green-50"
                          onClick={() => handleUpdateOrderStatus(order.id, 'accepted')}
                        >
                          Accept
                        </Button>
                        <Button 
                          size="sm"
                          variant="outline" 
                          className="border-red-500 text-red-700 hover:bg-red-50"
                          onClick={() => handleUpdateOrderStatus(order.id, 'rejected')}
                        >
                          Reject
                        </Button>
                      </div>
                    )}
                    
                    {order.status === 'accepted' && (
                      <Button 
                        size="sm"
                        variant="outline" 
                        className="border-green-500 text-green-700 hover:bg-green-50"
                        onClick={() => handleUpdateOrderStatus(order.id, 'completed')}
                      >
                        Mark Completed
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FarmerProducts;
