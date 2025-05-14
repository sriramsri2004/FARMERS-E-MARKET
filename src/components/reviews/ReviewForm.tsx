
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { StarRating } from './StarRating';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ReviewFormProps {
  farmerId: string;
  orderId: string;
  onComplete: () => void;
  farmerName: string;
}

// Define the RPC function parameter types
interface AddFarmerReviewParams {
  p_farmer_id: string;
  p_order_id: string;
  p_rating: number;
  p_comment: string | null;
}

export const ReviewForm: React.FC<ReviewFormProps> = ({ 
  farmerId, 
  orderId, 
  onComplete,
  farmerName 
}) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (rating === 0) {
      toast({
        title: 'Rating required',
        description: 'Please select a rating before submitting',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Since we're getting a type error with the database schema,
      // we'll use a raw SQL query instead
      const { data: userData } = await supabase.auth.getUser();
      if (!userData || !userData.user) {
        throw new Error('User not authenticated');
      }
      
      // Fix Type Error: Use any as a workaround for the parameter type
      const { error } = await supabase.rpc<any, any>('add_farmer_review', {
        p_farmer_id: farmerId,
        p_order_id: orderId,
        p_rating: rating,
        p_comment: comment || null
      });

      if (error) throw error;
      
      toast({
        title: 'Review submitted',
        description: 'Thank you for your feedback!',
      });
      
      onComplete();
    } catch (error: any) {
      console.error('Error submitting review:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit review. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <h3 className="text-lg font-medium">Rate your experience with {farmerName}</h3>
        <p className="text-sm text-gray-500 mb-2">Your feedback helps other buyers make informed decisions</p>
        <div className="flex items-center gap-2">
          <StarRating rating={rating} onChange={setRating} size={24} />
          <span className="text-sm text-gray-500">
            {rating > 0 ? `${rating} out of 5` : 'Select a rating'}
          </span>
        </div>
      </div>
      
      <div>
        <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-1">
          Your review (optional)
        </label>
        <Textarea
          id="comment"
          placeholder="Share your experience with this farmer..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="min-h-[100px]"
        />
      </div>
      
      <div className="flex justify-end gap-2">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onComplete}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={rating === 0 || isSubmitting}
        >
          {isSubmitting ? 'Submitting...' : 'Submit Review'}
        </Button>
      </div>
    </form>
  );
};
