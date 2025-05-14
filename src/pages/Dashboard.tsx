
import React, { useEffect, useState } from 'react';
import { Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import FarmerProducts from '@/components/dashboard/FarmerProducts';
import FarmerAddProduct from '@/components/dashboard/FarmerAddProduct';
import BuyerOrders from '@/components/dashboard/BuyerOrders';
import BuyerFavorites from '@/components/dashboard/BuyerFavorites';
import ProfileTab from '@/components/dashboard/ProfileTab';

const Dashboard: React.FC = () => {
  const { profile, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<string>("profile");
  
  useEffect(() => {
    if (location.state && location.state.activeTab) {
      setActiveTab(location.state.activeTab);
    }
  }, [location.state]);
  
  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }
  
  if (!profile) {
    return <Navigate to="/login" replace />;
  }
  
  const isFarmer = profile.role === 'farmer';

  return (
    <div className="min-h-screen bg-farmer-50/50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Welcome back, {profile.full_name}</p>
        </div>
        
        <Tabs defaultValue="profile" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            {isFarmer ? (
              <>
                <TabsTrigger value="products">My Products</TabsTrigger>
                <TabsTrigger value="add-product">Add Product</TabsTrigger>
              </>
            ) : (
              <>
                <TabsTrigger value="orders">My Orders</TabsTrigger>
                <TabsTrigger value="favorites">Favorites</TabsTrigger>
              </>
            )}
          </TabsList>
          
          <TabsContent value="profile">
            <ProfileTab />
          </TabsContent>
          
          {isFarmer && (
            <>
              <TabsContent value="products">
                <FarmerProducts />
              </TabsContent>
              
              <TabsContent value="add-product">
                <FarmerAddProduct />
              </TabsContent>
            </>
          )}
          
          {!isFarmer && (
            <>
              <TabsContent value="orders">
                <BuyerOrders />
              </TabsContent>
              
              <TabsContent value="favorites">
                <BuyerFavorites />
              </TabsContent>
            </>
          )}
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;
