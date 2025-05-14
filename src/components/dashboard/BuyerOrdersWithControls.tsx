
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Check, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
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

interface Order {
  id: string;
  product_id: string;
  buyer_id: string;
  farmer_id: string;
  quantity: number;
  total_price: number;
  status: string;
  created_at: string;
  product: {
    name: string;
    image_url: string;
    unit: string;
    price: number;
  };
  farmer: {
    full_name?: string;  // Make optional to handle error cases
  } | null;  // Allow null for cases where farmer data can't be retrieved
}

const BuyerOrdersWithControls: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();

  useEffect(() => {
    if (profile) {
      fetchOrders();
      
      // Set up real-time subscription for order updates
      const ordersChannel = supabase
        .channel('orders_changes')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'orders', filter: `buyer_id=eq.${profile.id}` }, 
          () => {
            fetchOrders();
          })
        .subscribe();
        
      return () => {
        supabase.removeChannel(ordersChannel);
      };
    }
  }, [profile]);

  const fetchOrders = async () => {
    if (!profile) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          product:product_id (
            name,
            image_url,
            unit,
            price
          ),
          farmer:farmer_id (
            full_name
          )
        `)
        .eq('buyer_id', profile.id)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      // Process the data to handle potential errors in farmer data
      const processedOrders = data?.map(order => {
        // Check if farmer data is an error object or missing
        if (!order.farmer || 'error' in order.farmer) {
          return {
            ...order,
            farmer: { full_name: 'Unknown Farmer' }
          };
        }
        return order;
      }) as Order[];
      
      setOrders(processedOrders || []);
    } catch (error: any) {
      console.error('Error fetching orders:', error);
      toast({
        title: 'Error',
        description: 'Failed to load your orders',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMarkCompleted = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'completed' })
        .eq('id', orderId)
        .eq('buyer_id', profile?.id);
        
      if (error) throw error;
      
      // Optimistic UI update
      setOrders(orders.map(order => 
        order.id === orderId ? { ...order, status: 'completed' } : order
      ));
      
      toast({
        title: 'Order Completed',
        description: 'This order has been marked as completed',
      });
      
    } catch (error: any) {
      console.error('Error updating order:', error);
      toast({
        title: 'Error',
        description: 'Failed to update order status',
        variant: 'destructive'
      });
    }
  };
  
  const handleDeleteOrder = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', orderId)
        .eq('buyer_id', profile?.id);
        
      if (error) throw error;
      
      // Remove from local state
      setOrders(orders.filter(order => order.id !== orderId));
      
      toast({
        title: 'Order Deleted',
        description: 'The order has been removed from your list',
      });
      
    } catch (error: any) {
      console.error('Error deleting order:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete order',
        variant: 'destructive'
      });
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'accepted':
        return <Badge className="bg-blue-100 text-blue-800">Accepted</Badge>;
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800">Cancelled</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-farmer-700"></div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>My Orders</CardTitle>
          <CardDescription>You haven't placed any orders yet.</CardDescription>
        </CardHeader>
        <CardContent className="text-center py-8">
          <p className="text-gray-500">When you place an order, it will appear here.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>My Orders</CardTitle>
          <CardDescription>Manage your orders here</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-16 w-16 rounded-md overflow-hidden">
                      <img
                        src={order.product?.image_url || '/placeholder.svg'}
                        alt={order.product?.name || 'Product image'}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div>
                      <h3 className="font-medium">{order.product?.name}</h3>
                      <p className="text-sm text-gray-500">
                        From {order.farmer?.full_name || 'Farmer'}
                      </p>
                    </div>
                  </div>
                  {getStatusBadge(order.status)}
                </div>
                
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div>
                    <p className="text-sm text-gray-500">Order Date</p>
                    <p className="font-medium">{formatDate(order.created_at)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Quantity</p>
                    <p className="font-medium">{order.quantity} {order.product?.unit}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Unit Price</p>
                    <p className="font-medium">₹{order.product?.price.toFixed(2)}/{order.product?.unit}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total</p>
                    <p className="font-medium text-farmer-700">₹{order.total_price.toFixed(2)}</p>
                  </div>
                </div>
                
                <div className="flex justify-end gap-3 mt-3">
                  {order.status !== 'completed' && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="bg-green-50 text-green-600 border-green-200 hover:bg-green-100">
                          <Check className="h-3.5 w-3.5 mr-1.5" /> Mark Completed
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Mark as Completed?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to mark this order as completed? This indicates you have received the product and are satisfied with it.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => handleMarkCompleted(order.id)}
                          >
                            Yes, Mark as Completed
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm" className="bg-red-50 text-red-600 border-red-200 hover:bg-red-100">
                        <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Order?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will remove the order from your history. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                          className="bg-red-600 hover:bg-red-700"
                          onClick={() => handleDeleteOrder(order.id)}
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BuyerOrdersWithControls;
