
import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ShoppingCart, Package, Check, Trash, MessageSquare } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ReviewForm } from '@/components/reviews/ReviewForm';
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
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Order {
  id: string;
  product_id: string;
  product: {
    name: string;
    description: string;
    image_url: string;
    unit: string;
  };
  farmer_id: string;
  farmer_profile?: {
    full_name: string;
  };
  quantity: number;
  total_price: number;
  status: string;
  created_at: string;
  has_review?: boolean;
}

// Define the RPC function parameter types
interface CheckOrderHasReviewParams {
  p_order_id: string;
}

const BuyerOrders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { profile } = useAuth();
  const [reviewingOrderId, setReviewingOrderId] = useState<string | null>(null);
  
  const getOrderBeingReviewed = () => {
    return orders.find(order => order.id === reviewingOrderId) || null;
  };

  useEffect(() => {
    if (profile) {
      fetchOrders();

      // Set up real-time listener for orders table
      const ordersChannel = supabase
        .channel('orders_changes')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'orders', filter: `buyer_id=eq.${profile.id}` }, 
          (payload) => {
            console.log("Orders change detected:", payload);
            if (payload.eventType === 'INSERT') {
              // A new order was created
              fetchOrderDetails(payload.new.id).then(newOrder => {
                if (newOrder) {
                  setOrders(prev => [newOrder, ...prev]);
                  toast({
                    title: "New Order Created",
                    description: `Your order for ${newOrder.product.name} has been placed!`,
                  });
                }
              });
            } else if (payload.eventType === 'UPDATE') {
              // An order was updated (e.g., status changed)
              fetchOrderDetails(payload.new.id).then(updatedOrder => {
                if (updatedOrder) {
                  setOrders(prev => prev.map(order => 
                    order.id === updatedOrder.id ? updatedOrder : order
                  ));
                  toast({
                    title: "Order Updated",
                    description: `Order status changed to: ${updatedOrder.status.charAt(0).toUpperCase() + updatedOrder.status.slice(1)}`,
                  });
                }
              });
            } else if (payload.eventType === 'DELETE') {
              // An order was deleted
              setOrders(prev => prev.filter(order => order.id !== payload.old.id));
              toast({
                title: "Order Deleted",
                description: "The order has been removed from your list.",
              });
            }
          })
        .subscribe();

      // Also listen for new reviews
      const reviewsChannel = supabase
        .channel('reviews_changes')
        .on('postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'farmer_reviews' },
          (payload) => {
            if (payload.new && payload.new.order_id) {
              // Update the order to show that it has a review
              setOrders(prev => prev.map(order => 
                order.id === payload.new.order_id ? { ...order, has_review: true } : order
              ));
            }
          })
        .subscribe();

      return () => {
        supabase.removeChannel(ordersChannel);
        supabase.removeChannel(reviewsChannel);
      };
    }
  }, [profile]);

  const checkOrderHasReview = async (orderId: string): Promise<boolean> => {
    try {
      // Fix Type Error: Use any to bypass strict type checking on parameters
      const { data, error } = await supabase.rpc<boolean, any>('check_order_has_review', {
        p_order_id: orderId
      });
        
      if (error) {
        console.error('Error checking review:', error);
        return false;
      }
      
      return !!data;
    } catch (error) {
      console.error('Error checking if order has review:', error);
      return false;
    }
  };

  const fetchOrderDetails = async (orderId: string): Promise<Order | null> => {
    try {
      // First, fetch the basic order details
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select(`
          *,
          product:product_id (name, description, image_url, unit)
        `)
        .eq('id', orderId)
        .single();

      if (orderError) throw orderError;
      
      // If we have the order, fetch the farmer's profile separately
      if (orderData) {
        const { data: farmerData, error: farmerError } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', orderData.farmer_id)
          .single();
        
        if (farmerError) {
          console.error('Error fetching farmer details:', farmerError);
          // Even if there's an error getting the farmer, we'll still return the order
          return {
            ...orderData,
            farmer_profile: {
              full_name: 'Unknown Farmer'
            }
          };
        }
        
        // Check if the order has a review
        const hasReview = await checkOrderHasReview(orderId);
        
        // Return the complete order with farmer details and review status
        return {
          ...orderData,
          farmer_profile: farmerData,
          has_review: hasReview
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching order details:', error);
      return null;
    }
  };

  const fetchOrders = async () => {
    if (!profile) return;

    setLoading(true);
    try {
      // First get all orders
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select(`
          *,
          product:product_id (name, description, image_url, unit)
        `)
        .eq('buyer_id', profile.id)
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;
      
      const orders = ordersData || [];
      
      // For each order, get the farmer's name from the profiles table
      const ordersWithFarmerDetails = await Promise.all(
        orders.map(async (order) => {
          try {
            const { data: farmerData, error: farmerError } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('id', order.farmer_id)
              .single();
              
            if (farmerError) {
              console.error('Error fetching farmer details:', farmerError);
              return {
                ...order,
                farmer_profile: {
                  full_name: 'Unknown Farmer'
                }
              };
            }
            
            // Check if the order has a review
            const hasReview = await checkOrderHasReview(order.id);
            
            return {
              ...order,
              farmer_profile: farmerData,
              has_review: hasReview
            };
          } catch (e) {
            console.error('Error processing farmer details:', e);
            return {
              ...order,
              farmer_profile: {
                full_name: 'Unknown Farmer'
              }
            };
          }
        })
      );

      setOrders(ordersWithFarmerDetails);
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

  const handleMarkAsCompleted = async (orderId: string) => {
    if (!profile) return;
    
    try {
      setLoading(true);
      const { error } = await supabase
        .from('orders')
        .update({ status: 'completed' })
        .eq('id', orderId)
        .eq('buyer_id', profile.id);
      
      if (error) throw error;
      
      toast({
        title: "Order Completed",
        description: "Order has been marked as completed.",
      });
      
      // Update local state 
      setOrders(orders.map(order => 
        order.id === orderId ? { ...order, status: 'completed' } : order
      ));
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update order status",
        variant: "destructive"
      });
      console.error("Error updating order status:", error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleDeleteOrder = async (orderId: string) => {
    if (!profile) return;
    
    try {
      setLoading(true);
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', orderId)
        .eq('buyer_id', profile.id);
      
      if (error) throw error;
      
      toast({
        title: "Order Deleted",
        description: "Order has been removed from your list.",
      });
      
      // Update local state 
      setOrders(orders.filter(order => order.id !== orderId));
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to delete order",
        variant: "destructive"
      });
      console.error("Error deleting order:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleReviewSubmitted = () => {
    setReviewingOrderId(null);
    // Refresh orders to update the "has_review" status
    fetchOrders();
    toast({
      title: "Review submitted",
      description: "Thank you for your feedback!",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">My Orders</h2>
        <Badge className="text-sm">
          <Package className="mr-2 h-4 w-4" />
          {orders.filter(order => ['accepted', 'pending'].includes(order.status)).length} Active
        </Badge>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-farmer-700"></div>
        </div>
      ) : orders.length === 0 ? (
        <Card className="p-8 text-center">
          <h3 className="text-xl font-semibold text-gray-800 mb-2">No orders yet</h3>
          <p className="text-gray-600 mb-4">
            You haven't placed any orders yet
          </p>
          <a href="/market">
            <Badge className="cursor-pointer px-4 py-2 text-base hover:bg-farmer-800">
              <ShoppingCart className="mr-2 h-4 w-4" />
              Browse Products
            </Badge>
          </a>
        </Card>
      ) : (
        <div className="space-y-6">
          {['pending', 'accepted', 'completed', 'rejected'].map(statusType => {
            const ordersWithStatus = orders.filter(order => order.status === statusType);
            
            if (ordersWithStatus.length === 0) return null;
            
            return (
              <div key={statusType}>
                <h3 className="font-semibold text-gray-700 mb-3 capitalize">
                  {statusType} Orders ({ordersWithStatus.length})
                </h3>
                
                <div className="space-y-4">
                  {ordersWithStatus.map((order) => (
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
                            
                            {order.has_review && (
                              <Badge className="bg-purple-100 text-purple-800">
                                Reviewed
                              </Badge>
                            )}
                          </div>
                          
                          <p className="text-sm text-gray-600 line-clamp-1">{order.product?.description}</p>
                          
                          <div className="flex items-center mt-1 gap-4">
                            <span className="text-farmer-700 font-medium">
                              ₹{order.total_price.toFixed(2)}
                            </span>
                            <span className="text-gray-500 text-sm">
                              Quantity: {order.quantity} {order.product?.unit}{order.quantity > 1 && order.product?.unit !== 'dozen' ? 's' : ''}
                            </span>
                            <span className="text-gray-500 text-sm flex items-center gap-1">
                              {order.farmer_profile?.full_name ? (
                                <>
                                  <Avatar className="h-5 w-5">
                                    <AvatarFallback>{order.farmer_profile.full_name[0]}</AvatarFallback>
                                  </Avatar>
                                  {order.farmer_profile.full_name}
                                </>
                              ) : 'Unknown Farmer'}
                            </span>
                          </div>
                          
                          <div className="flex items-center justify-between mt-3">
                            <p className="text-xs text-gray-500">
                              Ordered: {formatDate(order.created_at)}
                            </p>
                            
                            {(order.status === 'accepted' || order.status === 'pending') && (
                              <div className="flex space-x-2">
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  className="text-xs flex items-center gap-1 bg-green-50 text-green-600 border-green-200 hover:bg-green-100"
                                  onClick={() => handleMarkAsCompleted(order.id)}
                                >
                                  <Check className="h-3.5 w-3.5" />
                                  Mark as Completed
                                </Button>
                                
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button 
                                      size="sm" 
                                      variant="outline"
                                      className="text-xs flex items-center gap-1 bg-red-50 text-red-600 border-red-200 hover:bg-red-100"
                                    >
                                      <Trash className="h-3.5 w-3.5" />
                                      Delete Order
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        This will permanently delete the order for {order.product?.name}. 
                                        This action cannot be undone.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction 
                                        className="bg-red-500 hover:bg-red-600"
                                        onClick={() => handleDeleteOrder(order.id)}
                                      >
                                        Delete
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            )}
                            
                            {order.status === 'completed' && (
                              <div className="flex space-x-2">
                                {!order.has_review && (
                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <Button 
                                        size="sm" 
                                        variant="outline"
                                        className="text-xs flex items-center gap-1 bg-purple-50 text-purple-600 border-purple-200 hover:bg-purple-100"
                                      >
                                        <MessageSquare className="h-3.5 w-3.5" />
                                        Leave Review
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent className="sm:max-w-md">
                                      <DialogHeader>
                                        <DialogTitle>Review your purchase</DialogTitle>
                                      </DialogHeader>
                                      <ReviewForm 
                                        farmerId={order.farmer_id}
                                        orderId={order.id}
                                        onComplete={handleReviewSubmitted}
                                        farmerName={order.farmer_profile?.full_name || 'this farmer'}
                                      />
                                    </DialogContent>
                                  </Dialog>
                                )}
                                
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button 
                                      size="sm" 
                                      variant="outline"
                                      className="text-xs flex items-center gap-1 bg-red-50 text-red-600 border-red-200 hover:bg-red-100"
                                    >
                                      <Trash className="h-3.5 w-3.5" />
                                      Delete Order
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        This will permanently remove this order from your history.
                                        This action cannot be undone.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction 
                                        className="bg-red-500 hover:bg-red-600"
                                        onClick={() => handleDeleteOrder(order.id)}
                                      >
                                        Delete
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            )}
                            
                            {order.status === 'rejected' && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    className="text-xs flex items-center gap-1 bg-red-50 text-red-600 border-red-200 hover:bg-red-100"
                                  >
                                    <Trash className="h-3.5 w-3.5" />
                                    Delete Order
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This will permanently remove this order from your history.
                                      This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction 
                                      className="bg-red-500 hover:bg-red-600"
                                      onClick={() => handleDeleteOrder(order.id)}
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default BuyerOrders;
