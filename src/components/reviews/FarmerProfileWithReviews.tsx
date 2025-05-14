
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FarmerRatingBadge } from './FarmerRatingBadge';
import { FarmerReviews } from './FarmerReviews';
import { supabase } from '@/integrations/supabase/client';

interface FarmerProfile {
  id: string;
  full_name: string | null;
  profile_image_url?: string | null;
  bio?: string | null;
  phone_number?: string | null;
  location?: string | null;
}

interface FarmerProfileWithReviewsProps {
  farmerId: string;
}

export const FarmerProfileWithReviews: React.FC<FarmerProfileWithReviewsProps> = ({ farmerId }) => {
  const [farmer, setFarmer] = useState<FarmerProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFarmerProfile = async () => {
      try {
        // Get basic profile information
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id, full_name')
          .eq('id', farmerId)
          .single();
          
        if (profileError) throw profileError;
        
        // Get extended profile details
        const { data: extendedData, error: extendedError } = await supabase
          .from('profiles_extended')
          .select('profile_image_url, bio, phone_number, location')
          .eq('id', farmerId)
          .single();
        
        let farmerData: FarmerProfile = {
          id: profileData.id,
          full_name: profileData.full_name
        };
        
        if (!extendedError && extendedData) {
          farmerData = {
            ...farmerData,
            ...extendedData
          };
        }
        
        setFarmer(farmerData);
      } catch (error) {
        console.error('Error fetching farmer profile:', error);
      } finally {
        setLoading(false);
      }
    };

    if (farmerId) {
      fetchFarmerProfile();
    }
  }, [farmerId]);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse flex space-x-4">
            <div className="rounded-full bg-gray-200 h-16 w-16"></div>
            <div className="flex-1 space-y-4 py-1">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!farmer) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-gray-500">Farmer profile not found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-0">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <Avatar className="h-16 w-16">
              {farmer.profile_image_url ? (
                <AvatarImage src={farmer.profile_image_url} alt={farmer.full_name || 'Farmer'} />
              ) : (
                <AvatarFallback>{farmer.full_name?.[0] || 'F'}</AvatarFallback>
              )}
            </Avatar>
            <div>
              <CardTitle>{farmer.full_name || 'Unnamed Farmer'}</CardTitle>
              <div className="flex items-center mt-1 space-x-2">
                <FarmerRatingBadge farmerId={farmerId} />
                {farmer.location && (
                  <span className="text-sm text-gray-500">{farmer.location}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="reviews" className="mt-4">
          <TabsList>
            <TabsTrigger value="info">Information</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
          </TabsList>
          <TabsContent value="info" className="pt-4">
            {farmer.bio ? (
              <p className="text-gray-700">{farmer.bio}</p>
            ) : (
              <p className="text-gray-500 italic">No bio available</p>
            )}
            {farmer.phone_number && (
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-500">Contact</p>
                <p className="text-gray-700">{farmer.phone_number}</p>
              </div>
            )}
          </TabsContent>
          <TabsContent value="reviews" className="pt-4">
            <FarmerReviews farmerId={farmerId} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
