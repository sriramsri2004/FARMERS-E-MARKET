
import React from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number;
  size?: number;
  onChange?: (rating: number) => void;
  readOnly?: boolean;
}

export const StarRating: React.FC<StarRatingProps> = ({
  rating,
  size = 20,
  onChange,
  readOnly = false
}) => {
  const stars = Array(5).fill(0);
  
  const handleClick = (selectedRating: number) => {
    if (readOnly) return;
    if (onChange) onChange(selectedRating);
  };

  return (
    <div className="flex">
      {stars.map((_, index) => {
        const starValue = index + 1;
        return (
          <Star
            key={index}
            size={size}
            className={`${
              starValue <= rating
                ? 'text-yellow-400 fill-yellow-400'
                : 'text-gray-300'
            } ${!readOnly && 'cursor-pointer'}`}
            onClick={() => handleClick(starValue)}
            onMouseEnter={readOnly ? undefined : () => {}}
            data-testid={`star-${index}`}
          />
        );
      })}
    </div>
  );
};
