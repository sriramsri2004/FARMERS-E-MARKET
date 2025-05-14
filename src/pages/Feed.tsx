
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Search, Filter } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

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

const Feed: React.FC = () => {
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { profile } = useAuth();
  
  // Filter states
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [selectedLocation, setSelectedLocation] = useState("All Locations");
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [maxPrice, setMaxPrice] = useState(1000);

  useEffect(() => {
    fetchFeed();

    // Subscribe to real-time updates for products table
    const productsChannel = supabase
      .channel('public:products')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'products' },
        async (payload) => {
          // A new product was added, fetch its details and add to feed
          await handleNewProduct(payload.new as any);
        }
      )
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
  }, [profile]);

  const handleNewProduct = async (newProduct: any) => {
    try {
      // Get farmer info
      const { data: farmerData, error: farmerError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('id', newProduct.farmer_id)
        .single();

      if (farmerError) throw farmerError;

      // Get feed item for this product
      const { data: feedData, error: feedError } = await supabase
        .from('product_feed')
        .select('*')
        .eq('product_id', newProduct.id)
        .single();

      if (feedError) throw feedError;

      // Create new feed item
      const newFeedItem: FeedItem = {
        id: feedData.id,
        productId: newProduct.id,
        product: {
          name: newProduct.name || 'Unknown Product',
          description: newProduct.description || '',
          price: newProduct.price || 0,
          unit: newProduct.unit || 'kg',
          category: newProduct.category || '',
          image_url: newProduct.image_url || 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?q=80&w=3540&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
          isOrganic: newProduct.is_organic || false,
          location: newProduct.location || 'Unknown Location',
          farmer: {
            id: newProduct.farmer_id || '',
            name: farmerData?.full_name || 'Unknown Farmer',
            farm: 'Local Farm'
          }
        },
        viewsCount: feedData.views_count || 0,
        createdAt: feedData.created_at,
      };

      // Add to the beginning of the feed
      setFeedItems(prevItems => {
        // Check if this item already exists in the feed
        const exists = prevItems.some(item => item.id === newFeedItem.id);
        if (exists) {
          return prevItems;
        }
        toast({
          title: "New Product Added!",
          description: `${newFeedItem.product.name} is now available from ${newFeedItem.product.farmer.name}`,
        });
        return [newFeedItem, ...prevItems];
      });

      // Update max price if needed
      if (newProduct.price > maxPrice) {
        setMaxPrice(Math.ceil(newProduct.price / 100) * 100);
        setPriceRange([priceRange[0], Math.ceil(newProduct.price / 100) * 100]);
      }
    } catch (error) {
      console.error('Error handling new product:', error);
    }
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
      const feedItems: FeedItem[] = feedData.map(item => {
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

      setFeedItems(feedItems);

      // Set max price for slider
      if (feedItems.length > 0) {
        const highestPrice = Math.max(...feedItems.map(item => item.product.price));
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

  // Filter feed items based on search and filters
  const filteredFeedItems = feedItems.filter(item => {
    // Search term filter
    const matchesSearch = 
      item.product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.product.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.product.location.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Category filter
    const matchesCategory = 
      selectedCategory === "All Categories" || 
      item.product.category === selectedCategory;
    
    // Location filter
    const matchesLocation = 
      selectedLocation === "All Locations" || 
      item.product.location === selectedLocation;
    
    // Price range filter
    const matchesPrice = 
      item.product.price >= priceRange[0] && 
      item.product.price <= priceRange[1];
    
    return matchesSearch && matchesCategory && matchesLocation && matchesPrice;
  });

  return (
    <div className="min-h-screen bg-farmer-50/50">
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Product Feed</h1>
          <p className="mt-1 text-gray-600 text-sm">Discover fresh products from local farmers</p>
        </div>
        
        {/* Search and Filter Controls */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex justify-between items-center mb-4 gap-2 flex-wrap">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input 
                placeholder="Search products..." 
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button 
              variant="outline" 
              className="border-farmer-600 text-farmer-700"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="mr-2 h-4 w-4" />
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </Button>
          </div>
          
          {/* Advanced Filters */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2 animate-fade-in">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Category</label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {CATEGORIES.map(category => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Location</label>
                <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {LOCATIONS.map(location => (
                        <SelectItem key={location} value={location}>
                          {location}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <label className="text-sm font-medium text-gray-700">Price Range</label>
                  <span className="text-sm text-farmer-700">
                    ₹{priceRange[0]} - ₹{priceRange[1]}
                  </span>
                </div>
                <Slider
                  value={priceRange}
                  min={0}
                  max={maxPrice}
                  step={10}
                  onValueChange={setPriceRange}
                  className="my-4"
                />
              </div>
            </div>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="bg-white rounded-lg shadow-sm p-4 h-48 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="h-24 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              </div>
            ))}
          </div>
        ) : filteredFeedItems.length === 0 ? (
          <Card className="p-8 text-center">
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No products found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || showFilters ? 
                'Try adjusting your search or filters' : 
                'There are no products in your feed yet'}
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {filteredFeedItems.map(item => (
              <Card key={item.id} className="overflow-hidden hover:shadow-md transition-shadow duration-200 animate-fade-in border-farmer-100">
                {/* Product Image */}
                <div className="h-40 relative">
                  <img 
                    src={item.product.image_url} 
                    alt={item.product.name} 
                    className="w-full h-full object-cover"
                  />
                  {item.product.isOrganic && (
                    <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                      Organic
                    </div>
                  )}
                </div>
                
                <div className="p-4">
                  {/* Header with farmer info */}
                  <div className="flex items-center mb-2">
                    <Avatar className="h-6 w-6 bg-farmer-100 text-farmer-700 mr-2">
                      <div className="text-xs font-semibold">
                        {item.product.farmer.name.charAt(0)}
                      </div>
                    </Avatar>
                    <div className="flex justify-between items-center w-full">
                      <span className="text-xs text-gray-500">
                        {item.product.farmer.name}
                      </span>
                      <span className="text-xs text-gray-400">
                        {formatDate(item.createdAt)}
                      </span>
                    </div>
                  </div>
                  
                  {/* Content */}
                  <h4 className="font-medium text-gray-900 mb-1">{item.product.name}</h4>
                  <p className="text-gray-600 text-sm mb-2 line-clamp-2">{item.product.description}</p>
                  
                  <div className="flex justify-between items-center text-sm">
                    <div>
                      <span className="bg-farmer-50 text-farmer-700 text-xs px-2 py-0.5 rounded-full">
                        {item.product.category}
                      </span>
                      {item.product.location && (
                        <span className="bg-amber-50 text-amber-700 text-xs px-2 py-0.5 rounded-full ml-1">
                          {item.product.location}
                        </span>
                      )}
                    </div>
                    <p className="font-medium text-farmer-700 text-sm">
                      ₹{item.product.price}/{item.product.unit}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Feed;
