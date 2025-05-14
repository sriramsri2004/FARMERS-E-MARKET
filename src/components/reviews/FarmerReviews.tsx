
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { StarRating } from './StarRating';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  buyer: {
    full_name: string | null;
    profile_image_url?: string | null;
  } | null;
}

interface FarmerReviewsProps {
  farmerId: string;
}

// Define the RPC function parameter types
interface GetFarmerReviewsParams {
  p_farmer_id: string;
}

export const FarmerReviews: React.FC<FarmerReviewsProps> = ({ farmerId }) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [averageRating, setAverageRating] = useState(0);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        // Fix Type Error: Use any for parameters and proper type for the response
        const { data, error } = await supabase.rpc<Review[], any>('get_farmer_reviews', {
          p_farmer_id: farmerId
        });
        
        if (error) throw error;
        
        // Ensure data is typed correctly
        const typedData = data as Review[] || [];
        setReviews(typedData);
        
        // Calculate average rating
        if (typedData && typedData.length > 0) {
          const total = typedData.reduce((sum, review) => sum + review.rating, 0);
          setAverageRating(parseFloat((total / typedData.length).toFixed(1)));
        }
      } catch (error) {
        console.error('Error fetching reviews:', error);
      } finally {
        setLoading(false);
      }
    };

    if (farmerId) {
      fetchReviews();
    }
  }, [farmerId]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return <div className="p-4 text-center">Loading reviews...</div>;
  }

  if (reviews.length === 0) {
    return <div className="p-4 text-center text-gray-500">No reviews yet</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-medium">Customer Reviews</h3>
          <div className="flex items-center gap-2">
            <StarRating rating={averageRating} readOnly size={16} />
            <span className="text-sm font-medium">{averageRating} out of 5</span>
            <span className="text-sm text-gray-500">({reviews.length} reviews)</span>
          </div>
        </div>
      </div>
      
      <div className="space-y-4">
        {reviews.map((review) => (
          <Card key={review.id} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Avatar className="h-8 w-8">
                  {review.buyer?.profile_image_url ? (
                    <AvatarImage src={review.buyer.profile_image_url} alt="Reviewer" />
                  ) : (
                    <AvatarFallback>{review.buyer?.full_name?.[0] || '?'}</AvatarFallback>
                  )}
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{review.buyer?.full_name || 'Anonymous'}</p>
                      <div className="flex items-center gap-2">
                        <StarRating rating={review.rating} readOnly size={14} />
                        <span className="text-xs text-gray-500">{formatDate(review.created_at)}</span>
                      </div>
                    </div>
                  </div>
                  {review.comment && (
                    <p className="mt-2 text-gray-700">{review.comment}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
