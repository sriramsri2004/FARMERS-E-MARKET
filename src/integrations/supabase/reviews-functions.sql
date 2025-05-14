
-- Function to add a farmer review with validation
CREATE OR REPLACE FUNCTION public.add_farmer_review(
  p_farmer_id UUID,
  p_order_id UUID,
  p_rating INTEGER,
  p_comment TEXT DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_buyer_id UUID;
  v_result UUID;
BEGIN
  -- Get the authenticated user's ID
  v_buyer_id := auth.uid();
  
  -- Verify that the buyer is the one who placed the order
  PERFORM 1 FROM orders
  WHERE id = p_order_id AND buyer_id = v_buyer_id
  LIMIT 1;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'You can only review orders that you have placed';
  END IF;
  
  -- Verify order belongs to specified farmer
  PERFORM 1 FROM orders
  WHERE id = p_order_id AND farmer_id = p_farmer_id
  LIMIT 1;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'The order does not belong to the specified farmer';
  END IF;
  
  -- Check if the review already exists
  PERFORM 1 FROM farmer_reviews
  WHERE order_id = p_order_id AND buyer_id = v_buyer_id
  LIMIT 1;
  
  IF FOUND THEN
    RAISE EXCEPTION 'You have already reviewed this order';
  END IF;
  
  -- Insert the review
  INSERT INTO farmer_reviews (
    farmer_id,
    buyer_id,
    order_id,
    rating,
    comment
  ) VALUES (
    p_farmer_id,
    v_buyer_id,
    p_order_id,
    p_rating,
    p_comment
  )
  RETURNING id INTO v_result;
  
  RETURN v_result;
END;
$$;

-- Function to check if an order has a review
CREATE OR REPLACE FUNCTION public.check_order_has_review(
  p_order_id UUID
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM farmer_reviews
    WHERE order_id = p_order_id
  );
END;
$$;

-- Function to get farmer reviews with buyer details
CREATE OR REPLACE FUNCTION public.get_farmer_reviews(
  p_farmer_id UUID
) RETURNS TABLE (
  id UUID,
  farmer_id UUID,
  buyer_id UUID,
  order_id UUID,
  rating INTEGER,
  comment TEXT,
  created_at TIMESTAMPTZ,
  buyer JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    fr.id,
    fr.farmer_id,
    fr.buyer_id,
    fr.order_id,
    fr.rating,
    fr.comment,
    fr.created_at,
    json_build_object(
      'full_name', p.full_name,
      'profile_image_url', pe.profile_image_url
    )::JSONB as buyer
  FROM 
    farmer_reviews fr
  JOIN 
    profiles p ON fr.buyer_id = p.id
  LEFT JOIN 
    profiles_extended pe ON fr.buyer_id = pe.id
  WHERE 
    fr.farmer_id = p_farmer_id
  ORDER BY 
    fr.created_at DESC;
END;
$$;
