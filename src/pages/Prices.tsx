
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface PriceItem {
  id: string;
  name: string;
  category: string;
  price: number;
  change: number;
  percentChange: number;
  lastUpdated: string;
  trend: 'up' | 'down' | 'stable';
}

const Prices: React.FC = () => {
  const [prices, setPrices] = useState<PriceItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredPrices, setFilteredPrices] = useState<PriceItem[]>([]);
  const { toast } = useToast();
  const { profile } = useAuth();

  // Fetch initial market prices
  useEffect(() => {
    fetchMarketPrices();
    
    // Subscribe to real-time updates
    const channel = supabase
      .channel('market_prices_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'market_prices' },
        handlePriceUpdate
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchMarketPrices = async () => {
    const { data, error } = await supabase
      .from('market_prices')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error fetching prices:', error);
      toast({
        title: "Error fetching prices",
        description: "Unable to load current market prices",
        variant: "destructive"
      });
      return;
    }

    const formattedPrices = data.map(item => ({
      id: item.id,
      name: item.name,
      category: item.category,
      price: item.price,
      change: 0,
      percentChange: 0,
      lastUpdated: item.updated_at,
      trend: 'stable' as const
    }));

    setPrices(formattedPrices);
    setFilteredPrices(formattedPrices);
  };

  const handlePriceUpdate = (payload: any) => {
    if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
      const newPrice = payload.new;
      
      setPrices(prevPrices => {
        const existingPriceIndex = prevPrices.findIndex(p => p.id === newPrice.id);
        const updatedPrices = [...prevPrices];
        
        const priceItem: PriceItem = {
          id: newPrice.id,
          name: newPrice.name,
          category: newPrice.category,
          price: newPrice.price,
          change: existingPriceIndex >= 0 ? newPrice.price - prevPrices[existingPriceIndex].price : 0,
          percentChange: existingPriceIndex >= 0 
            ? ((newPrice.price - prevPrices[existingPriceIndex].price) / prevPrices[existingPriceIndex].price) * 100 
            : 0,
          lastUpdated: newPrice.updated_at,
          trend: existingPriceIndex >= 0 
            ? newPrice.price > prevPrices[existingPriceIndex].price 
              ? 'up' 
              : newPrice.price < prevPrices[existingPriceIndex].price 
                ? 'down' 
                : 'stable'
            : 'stable'
        };

        if (existingPriceIndex >= 0) {
          updatedPrices[existingPriceIndex] = priceItem;
        } else {
          updatedPrices.push(priceItem);
        }

        return updatedPrices;
      });
    }
  };

  // Filter prices based on search
  useEffect(() => {
    const filtered = prices.filter(price =>
      price.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      price.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredPrices(filtered);
  }, [prices, searchTerm]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'vegetables':
        return '🥬';
      case 'fruits':
        return '🍎';
      case 'grains':
        return '🌾';
      case 'dairy':
        return '🥛';
      case 'meat':
        return '🥩';
      case 'poultry':
        return '🍗';
      case 'herbs':
        return '🌿';
      default:
        return '📦';
    }
  };

  return (
    <div className="min-h-screen bg-farmer-50/50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Market Prices</h1>
          <p className="mt-2 text-gray-600">Track the latest commodity prices from local markets</p>
        </div>
        
        <div className="flex justify-between items-center mb-6 gap-4 flex-wrap">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input 
              placeholder="Search products or categories..." 
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <Button variant="outline" onClick={() => window.print()}>
            Download Price List
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredPrices.map(item => (
            <div 
              key={item.id} 
              className={`bg-white rounded-xl p-6 border shadow-sm transition-all duration-500 
                ${item.trend === 'up' ? 'animate-scale-in border-green-100' : 
                  item.trend === 'down' ? 'animate-scale-in border-red-100' : 'border-gray-100'}`}
            >
              <div className="flex items-center mb-4">
                <div className="text-2xl mr-2">{getCategoryIcon(item.category)}</div>
                <div>
                  <h3 className="font-semibold text-lg text-gray-900">{item.name}</h3>
                  <p className="text-sm text-gray-500">{item.category}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Current Price</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ₹{item.price.toFixed(2)}
                    <span className="text-xs font-normal text-gray-500">/kg</span>
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500">Change</p>
                  <div className="flex items-baseline">
                    <p className={`text-lg font-semibold ${
                      item.trend === 'up' ? 'text-green-600' : 
                      item.trend === 'down' ? 'text-red-600' : 
                      'text-gray-600'
                    }`}>
                      ₹{item.change >= 0 ? '+' : ''}{item.change.toFixed(2)}
                    </p>
                    <p className={`ml-1 ${
                      item.trend === 'up' ? 'text-green-600' : 
                      item.trend === 'down' ? 'text-red-600' : 
                      'text-gray-600'
                    }`}>
                      ({item.change >= 0 ? '+' : ''}{item.percentChange.toFixed(1)}%)
                    </p>
                    {item.trend === 'up' && (
                      <svg className="w-4 h-4 text-green-600 ml-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                    {item.trend === 'down' && (
                      <svg className="w-4 h-4 text-red-600 ml-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="mt-4 text-xs text-gray-500">
                Last updated: {formatDate(item.lastUpdated)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Prices;
