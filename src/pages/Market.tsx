import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Search, Filter } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import MarketPostCard from '@/components/MarketPostCard';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  unit: string;
  quantity: number;
  image_url: string;
  category: string;
  is_organic: boolean;
  location: string;
  harvest_date: string | null;
  created_at: string;
  show_contact_number: boolean;
  farmer: {
    id: string;
    name: string;
    farm?: string;
    rating?: number;
    phone_number?: string;
  };
}

interface FeedItem {
  id: string;
  productId: string;
  product: {
    name: string;
    description: string;
    price: number;
    unit: string;
    category: string;
    image_url: string;
    isOrganic: boolean;
    location: string;
    farmer: {
      id: string;
      name: string;
      farm: string;
    }
  };
  viewsCount: number;
  createdAt: string;
}

const CATEGORIES = [
  "All Categories",
  "Vegetables",
  "Fruits",
  "Dairy",
  "Meat",
  "Poultry",
  "Grains",
  "Herbs",
  "Other"
];

const LOCATIONS = [
  "All Locations",
  "North Region",
  "South Region",
  "East Region",
  "West Region",
  "Central Region"
];

const SORT_OPTIONS = [
  { value: "latest", label: "Latest" },
  { value: "price-low", label: "Price: Low to High" },
  { value: "price-high", label: "Price: High to Low" },
  { value: "popularity", label: "Most Popular" }
];

const Market: React.FC = () => {
  // Feed state
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [filteredFeedItems, setFilteredFeedItems] = useState<FeedItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [selectedLocation, setSelectedLocation] = useState("All Locations");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [sortOption, setSortOption] = useState("latest");
  const [isOrganicOnly, setIsOrganicOnly] = useState(false);
  const [maxPrice, setMaxPrice] = useState(1000);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const { toast } = useToast();
  const { profile } = useAuth();

  useEffect(() => {
    fetchFeed();

    // Subscribe to real-time updates for products table
    const productsChannel = supabase
      .channel('public:products')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'products' }, 
        () => {
          fetchFeed();
        })
      .subscribe();
      
    // Subscribe to real-time updates for product feed
    const feedChannel = supabase
      .channel('product_feed_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'product_feed' },
        handleFeedUpdate
      )
      .subscribe();

    return () => {
      supabase.removeChannel(productsChannel);
      supabase.removeChannel(feedChannel);
    };
  }, []);

  // Function to transform FeedItems to Product format for MarketPostCard
  const transformToProduct = (feedItem: FeedItem): Product => {
    return {
      id: feedItem.productId,
      name: feedItem.product.name,
      description: feedItem.product.description,
      price: feedItem.product.price,
      unit: feedItem.product.unit,
      quantity: 0, // Default value, will be updated from actual product data
      image_url: feedItem.product.image_url,
      category: feedItem.product.category,
      is_organic: feedItem.product.isOrganic,
      location: feedItem.product.location,
      harvest_date: null, // Default value
      created_at: feedItem.createdAt,
      show_contact_number: false, // Default value
      farmer: {
        id: feedItem.product.farmer.id,
        name: feedItem.product.farmer.name,
        farm: feedItem.product.farmer.farm,
        rating: 0, // Default value
      },
    };
  };

  const fetchFeed = async () => {
    setLoading(true);
    try {
      // Fetch the product feed
      const { data: feedData, error: feedError } = await supabase
        .from('product_feed')
        .select(`
          *,
          product:product_id (
            id,
            name,
            description,
            price,
            unit,
            category,
            image_url,
            is_organic,
            farmer_id,
            location
          )
        `)
        .order('created_at', { ascending: false });

      if (feedError) throw feedError;

      // Get all farmer IDs to fetch their profiles
      const farmerIds = feedData.map(item => item.product?.farmer_id).filter(Boolean);
      
      // Fetch farmer profiles
      const { data: farmerData, error: farmerError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', farmerIds);

      if (farmerError) throw farmerError;

      // Combine the data
      const items: FeedItem[] = feedData.map(item => {
        const farmer = farmerData?.find(f => f.id === item.product?.farmer_id);
        
        return {
          id: item.id,
          productId: item.product_id,
          product: {
            name: item.product?.name || 'Unknown Product',
            description: item.product?.description || '',
            price: item.product?.price || 0,
            unit: item.product?.unit || 'kg',
            category: item.product?.category || '',
            image_url: item.product?.image_url || 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?q=80&w=3540&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
            isOrganic: item.product?.is_organic || false,
            location: item.product?.location || 'Unknown Location',
            farmer: {
              id: item.product?.farmer_id || '',
              name: farmer?.full_name || 'Unknown Farmer',
              farm: 'Local Farm' // Default farm name
            }
          },
          viewsCount: item.views_count,
          createdAt: item.created_at,
        };
      });

      setFeedItems(items);
      setFilteredFeedItems(items);

      // Set max price for slider
      if (items.length > 0) {
        const highestPrice = Math.max(...items.map(item => item.product.price));
        const newMaxPrice = Math.ceil(highestPrice / 100) * 100;
        setMaxPrice(newMaxPrice);
        setPriceRange([0, newMaxPrice]);
      }
    } catch (error) {
      console.error('Error fetching feed:', error);
      toast({
        title: 'Error loading feed',
        description: 'We had trouble loading the feed. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFeedUpdate = (payload: any) => {
    // Refresh the feed when we get an update
    if (payload.eventType === 'UPDATE') {
      // For updates to existing feed items
      const updatedItem = payload.new;
      setFeedItems(prevItems => 
        prevItems.map(item => {
          if (item.id === updatedItem.id) {
            return {
              ...item,
              viewsCount: updatedItem.views_count
            };
          }
          return item;
        })
      );
    } else {
      // For new feed items or other major changes, refresh the feed
      fetchFeed();
    }
  };

  const handlePlaceOrder = async (productId: string, quantity: number, price: number, farmerId: string) => {
    if (!profile) {
      toast({
        title: 'Login required',
        description: 'Please log in to place an order',
        variant: 'destructive'
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('orders')
        .insert({
          product_id: productId,
          buyer_id: profile.id,
          farmer_id: farmerId,
          quantity: quantity,
          total_price: price * quantity,
        })
        .select();

      if (error) throw error;

      toast({
        title: 'Order placed successfully',
        description: 'The farmer will review your order soon',
      });

    } catch (error: any) {
      console.error('Error placing order:', error);
      toast({
        title: 'Error placing order',
        description: error.message || 'Something went wrong',
        variant: 'destructive',
      });
    }
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
      if (diffHours === 0) {
        const diffMinutes = Math.floor(diffTime / (1000 * 60));
        if (diffMinutes === 0) {
          return 'Just now';
        }
        return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;
      }
      return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  // Apply filters when any filter state changes for Feed
  useEffect(() => {
    let result = [...feedItems];
    
    // Filter by search term
    if (searchTerm) {
      result = result.filter(item => 
        item.product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.product.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.product.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.product.farmer.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Category filter
    if (selectedCategory !== "All Categories") {
      result = result.filter(item => 
        item.product.category.toLowerCase() === selectedCategory.toLowerCase());
    }
    
    // Location filter
    if (selectedLocation !== "All Locations") {
      result = result.filter(item => item.product.location === selectedLocation);
    }
    
    // Price range filter
    result = result.filter(item => 
      item.product.price >= priceRange[0] && 
      item.product.price <= priceRange[1]
    );
    
    // Organic filter
    if (isOrganicOnly) {
      result = result.filter(item => item.product.isOrganic === true);
    }
    
    // Apply sorting
    switch (sortOption) {
      case 'latest':
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'price-low':
        result.sort((a, b) => a.product.price - b.product.price);
        break;
      case 'price-high':
        result.sort((a, b) => b.product.price - a.product.price);
        break;
      case 'popularity':
        result.sort((a, b) => b.viewsCount - a.viewsCount);
        break;
      default:
        break;
    }
    
    setFilteredFeedItems(result);
  }, [searchTerm, selectedCategory, selectedLocation, priceRange, isOrganicOnly, sortOption, feedItems]);

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedCategory('All Categories');
    setSelectedLocation('All Locations');
    setPriceRange([0, maxPrice]);
    setSortOption('latest');
    setIsOrganicOnly(false);
  };

  return (
    <div className="min-h-screen bg-farmer-50/50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Marketplace</h1>
          <p className="mt-2 text-gray-600">Browse and connect with farmers offering fresh products</p>
        </div>

        {/* Search Bar and Filter Controls */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input 
                placeholder="Search products, farmers, or categories..." 
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex gap-2">
              <Select value={sortOption} onValueChange={setSortOption}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setViewMode('grid')}
                  className={viewMode === 'grid' ? 'bg-farmer-50 text-farmer-700' : ''}
                >
                  <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1.5 1H6.5V6H1.5V1ZM8.5 1H13.5V6H8.5V1ZM1.5 8H6.5V13H1.5V8ZM8.5 8H13.5V13H8.5V8Z" stroke="currentColor" strokeWidth="1" fill="currentColor"/>
                  </svg>
                </Button>
                
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setViewMode('list')}
                  className={viewMode === 'list' ? 'bg-farmer-50 text-farmer-700' : ''}
                >
                  <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1.5 3H13.5M1.5 7.5H13.5M1.5 12H13.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </Button>
              </div>
              
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="border-farmer-600 text-farmer-700">
                    <Filter className="mr-2 h-4 w-4" />
                    Filter
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-4">
                  <div className="space-y-4">
                    <h4 className="font-medium text-sm">Filter Products</h4>
                    
                    <div className="space-y-2">
                      <Label className="text-sm">Category</Label>
                      <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {CATEGORIES.map(category => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-sm">Location</Label>
                      <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select location" />
                        </SelectTrigger>
                        <SelectContent>
                          {LOCATIONS.map(location => (
                            <SelectItem key={location} value={location}>
                              {location}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label className="text-sm">Price Range</Label>
                        <span className="text-xs text-farmer-700">
                          ₹{priceRange[0]} - ₹{priceRange[1]}
                        </span>
                      </div>
                      <Slider
                        value={priceRange}
                        min={0}
                        max={maxPrice}
                        step={10}
                        onValueChange={(value) => {
                          // Type assertion to ensure the value is treated as [number, number]
                          // This fixes the TypeScript error
                          setPriceRange(value as [number, number]);
                        }}
                        className="my-4"
                      />
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="organic" 
                        checked={isOrganicOnly}
                        onCheckedChange={(checked) => setIsOrganicOnly(checked === true)}
                      />
                      <label
                        htmlFor="organic"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Organic Products Only
                      </label>
                    </div>
                    
                    <div className="flex justify-end pt-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mr-2"
                        onClick={resetFilters}
                      >
                        Reset
                      </Button>
                      <Button size="sm" onClick={() => setShowFilters(false)}>
                        Apply
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
          
          {/* Active filters display */}
          <div className="flex flex-wrap gap-2">
            {selectedCategory !== "All Categories" && (
              <Badge variant="outline" className="bg-farmer-50 border-farmer-200">
                {selectedCategory}
                <button 
                  className="ml-1 text-gray-500 hover:text-gray-700"
                  onClick={() => setSelectedCategory("All Categories")}
                >
                  ×
                </button>
              </Badge>
            )}
            
            {selectedLocation !== "All Locations" && (
              <Badge variant="outline" className="bg-amber-50 border-amber-200">
                {selectedLocation}
                <button 
                  className="ml-1 text-gray-500 hover:text-gray-700"
                  onClick={() => setSelectedLocation("All Locations")}
                >
                  ×
                </button>
              </Badge>
            )}
            
            {(priceRange[0] > 0 || priceRange[1] < maxPrice) && (
              <Badge variant="outline" className="bg-blue-50 border-blue-200">
                ₹{priceRange[0]} - ₹{priceRange[1]}
                <button 
                  className="ml-1 text-gray-500 hover:text-gray-700"
                  onClick={() => setPriceRange([0, maxPrice])}
                >
                  ×
                </button>
              </Badge>
            )}
            
            {isOrganicOnly && (
              <Badge variant="outline" className="bg-green-50 border-green-200">
                Organic Only
                <button 
                  className="ml-1 text-gray-500 hover:text-gray-700"
                  onClick={() => setIsOrganicOnly(false)}
                >
                  ×
                </button>
              </Badge>
            )}
          </div>
        </div>

        {/* Products Feed */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <div key={i} className="bg-white rounded-lg shadow-sm p-4 h-64 animate-pulse">
                <div className="h-32 bg-gray-200 rounded mb-3"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="h-8 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              </div>
            ))}
          </div>
        ) : filteredFeedItems.length === 0 ? (
          <Card className="p-8 text-center">
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No products found</h3>
            <p className="text-gray-600 mb-4">
              Try adjusting your search or filters
            </p>
            <Button onClick={resetFilters}>Clear Filters</Button>
          </Card>
        ) : (
          <div className={viewMode === 'grid' ? 
            "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4" : 
            "flex flex-col gap-4"
          }>
            {filteredFeedItems.map(item => {
              const product = transformToProduct(item);
              return (
                <MarketPostCard 
                  key={item.id} 
                  product={product}
                  viewMode={viewMode}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Market;
