
import React, { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface FarmerRatingBadgeProps {
  farmerId: string;
  size?: 'sm' | 'md' | 'lg';
}

export const FarmerRatingBadge: React.FC<FarmerRatingBadgeProps> = ({ 
  farmerId,
  size = 'md' 
}) => {
  const [rating, setRating] = useState<number | null>(null);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRating = async () => {
      try {
        // Since we're getting a type error with the database schema,
        // we'll use a raw SQL query instead
        const { data, error } = await supabase
          .from('farmer_reviews')
          .select('rating')
          .eq('farmer_id', farmerId);
          
        if (error) throw error;
        
        if (data && data.length > 0) {
          // Calculate average rating
          const total = data.reduce((sum, item: any) => sum + item.rating, 0);
          setRating(parseFloat((total / data.length).toFixed(1)));
          setCount(data.length);
        } else {
          setRating(null);
        }
      } catch (error) {
        console.error('Error fetching farmer rating:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (farmerId) {
      fetchRating();
    }
  }, [farmerId]);

  const sizeClasses = {
    sm: 'text-xs py-0.5 px-1.5',
    md: 'text-sm py-1 px-2',
    lg: 'text-base py-1.5 px-3'
  };
  
  const starSize = {
    sm: 12,
    md: 14,
    lg: 16
  };

  if (loading) {
    return <Skeleton className="h-6 w-16 rounded-full" />;
  }

  if (rating === null) {
    return (
      <span className={`inline-flex items-center gap-0.5 text-gray-400 ${sizeClasses[size]}`}>
        <Star size={starSize[size]} /> No ratings
      </span>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <div className={`inline-flex items-center gap-1 bg-yellow-50 text-yellow-700 font-medium rounded-full ${sizeClasses[size]}`}>
            <Star className="fill-yellow-400 text-yellow-400" size={starSize[size]} />
            <span>{rating}</span>
            <span className="text-yellow-500">({count})</span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{rating} out of 5 - Based on {count} {count === 1 ? 'review' : 'reviews'}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
