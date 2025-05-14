
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import ProductCard from '../ProductCard';
import { Upload, Image } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { useLocation } from 'react-router-dom';

interface Product {
  name: string;
  description: string;
  price: number;
  quantity: number;
  unit: string;
  category: string;
  is_organic: boolean;
  image_url: string;
  show_contact_number: boolean;
  location: string;
  harvest_date?: string;
}

const FarmerAddProduct: React.FC = () => {
  const initialProduct: Product = {
    name: '',
    description: '',
    price: 0,
    quantity: 0,
    unit: 'kg',
    category: 'vegetables',
    is_organic: false,
    image_url: '',
    show_contact_number: false,
    location: '',
    harvest_date: '',
  };
  
  const [product, setProduct] = useState<Product>(initialProduct);
  const [preview, setPreview] = useState(false);
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [productId, setProductId] = useState<string | null>(null);
  
  const { profile } = useAuth();
  const { toast } = useToast();
  const location = useLocation();

  useEffect(() => {
    // Check if we're editing an existing product
    if (location.state && location.state.productId) {
      setIsEditing(true);
      setProductId(location.state.productId);
      fetchProductDetails(location.state.productId);
    } else {
      // Reset form when not editing
      setProduct(initialProduct);
      setImageFile(null);
      setImagePreview(null);
      setIsEditing(false);
      setProductId(null);
    }
  }, [location.state]);

  const fetchProductDetails = async (id: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      if (data) {
        setProduct(data);
        if (data.image_url) {
          setImagePreview(data.image_url);
        }
      }
    } catch (error: any) {
      console.error('Error fetching product details:', error);
      toast({
        title: 'Error',
        description: 'Failed to load product details',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Update the handleChange function to handle input/textarea and checkbox events
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const inputElement = e.target as HTMLInputElement;
    
    // Check if the input type is checkbox
    if (inputElement.type === 'checkbox') {
      setProduct(prev => ({
        ...prev,
        [name]: inputElement.checked
      }));
    } else {
      setProduct(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Handle image file selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) {
      setImageFile(null);
      setImagePreview(null);
      return;
    }
    
    const file = e.target.files[0];
    setImageFile(file);
    
    // Create a preview
    const objectUrl = URL.createObjectURL(file);
    setImagePreview(objectUrl);
    
    // Update the product with the preview URL for now
    setProduct(prev => ({
      ...prev,
      image_url: objectUrl
    }));
  };
  
  // Upload image to Supabase Storage
  const uploadImage = async (): Promise<string> => {
    if (!imageFile || !profile) {
      return product.image_url || '';
    }
    
    setUploading(true);
    try {
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${profile.id}/${uuidv4()}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('product_images')
        .upload(fileName, imageFile, {
          cacheControl: '3600',
          upsert: false
        });
      
      if (error) throw error;
      
      // Get the public URL
      const { data: publicUrlData } = supabase.storage
        .from('product_images')
        .getPublicUrl(data.path);
        
      return publicUrlData.publicUrl;
    } catch (error: any) {
      console.error('Error uploading image:', error);
      toast({
        title: 'Image Upload Failed',
        description: error.message,
        variant: 'destructive',
      });
      return product.image_url || '';
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!profile) {
      toast({
        title: 'Not authenticated',
        description: 'You must be logged in to add a product.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      // Upload image if one is selected
      let imageUrl = product.image_url;
      if (imageFile) {
        imageUrl = await uploadImage();
        if (!imageUrl) {
          // If image upload failed but we still want to continue, we can use a default image
          imageUrl = 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?q=80&w=3540&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D';
        }
      }

      const productData = {
        ...product,
        image_url: imageUrl,
        farmer_id: profile.id,
      };

      let result;
      if (isEditing && productId) {
        // Update existing product
        result = await supabase
          .from('products')
          .update(productData)
          .eq('id', productId);
      } else {
        // Create new product
        result = await supabase
          .from('products')
          .insert(productData);
      }

      const { error } = result;
      if (error) throw error;

      setProduct(initialProduct);
      setImageFile(null);
      setImagePreview(null);
      setPreview(false);
      setIsEditing(false);
      setProductId(null);

      toast({
        title: isEditing ? 'Product updated' : 'Product added',
        description: isEditing 
          ? 'Your product has been updated successfully.' 
          : 'Your product has been added to the marketplace.',
      });
    } catch (error: any) {
      console.error('Error saving product:', error);
      toast({
        title: 'Error',
        description: `Failed to ${isEditing ? 'update' : 'add'} product. Please try again.`,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-6">
      <Card className="w-full md:w-1/2">
        <CardHeader>
          <CardTitle>{isEditing ? 'Edit Product' : 'Add New Product'}</CardTitle>
          <CardDescription>
            {isEditing 
              ? 'Update your product details below.' 
              : 'Fill in the details to list your product on the marketplace.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Product Name</Label>
            <Input
              type="text"
              id="name"
              name="name"
              value={product.name}
              onChange={handleChange}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              value={product.description}
              onChange={handleChange}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="price">Price</Label>
              <Input
                type="number"
                id="price"
                name="price"
                value={product.price}
                onChange={handleChange}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                type="number"
                id="quantity"
                name="quantity"
                value={product.quantity}
                onChange={handleChange}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="unit">Unit</Label>
              <Select value={product.unit} onValueChange={(value) => setProduct(prev => ({ ...prev, unit: value }))}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select unit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="kg">Kg</SelectItem>
                  <SelectItem value="g">G</SelectItem>
                  <SelectItem value="lbs">Lbs</SelectItem>
                  <SelectItem value="dozen">Dozen</SelectItem>
                  <SelectItem value="unit">Unit</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="category">Category</Label>
              <Select value={product.category} onValueChange={(value) => setProduct(prev => ({ ...prev, category: value }))}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vegetables">Vegetables</SelectItem>
                  <SelectItem value="fruits">Fruits</SelectItem>
                  <SelectItem value="grains">Grains</SelectItem>
                  <SelectItem value="dairy">Dairy</SelectItem>
                  <SelectItem value="meat">Meat</SelectItem>
                  <SelectItem value="poultry">Poultry</SelectItem>
                  <SelectItem value="herbs">Herbs</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Harvest Date Field */}
          <div className="grid gap-2">
            <Label htmlFor="harvest_date">Harvest Date</Label>
            <Input
              type="date"
              id="harvest_date"
              name="harvest_date"
              value={product.harvest_date || ''}
              onChange={handleChange}
            />
          </div>
          
          {/* Location Field */}
          <div className="grid gap-2">
            <Label htmlFor="location">Location</Label>
            <Input
              type="text"
              id="location"
              name="location"
              placeholder="Where is this product available"
              value={product.location}
              onChange={handleChange}
            />
          </div>
          
          {/* Image Upload */}
          <div className="grid gap-2">
            <Label htmlFor="image">Product Image</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-md p-4 flex flex-col items-center justify-center">
              {imagePreview ? (
                <div className="relative w-full mb-4">
                  <img 
                    src={imagePreview} 
                    alt="Product preview" 
                    className="mx-auto h-48 object-cover rounded-md" 
                  />
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="absolute top-2 right-2 bg-white"
                    onClick={() => {
                      setImageFile(null);
                      setImagePreview(null);
                      setProduct(prev => ({ ...prev, image_url: '' }));
                    }}
                  >
                    Remove
                  </Button>
                </div>
              ) : (
                <div className="text-center">
                  <div className="mb-4 flex flex-col items-center">
                    <Image className="h-10 w-10 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500">Upload a product image</p>
                    <p className="text-xs text-gray-400 mt-1">PNG, JPG, GIF up to 10MB</p>
                  </div>
                </div>
              )}
              <div className="w-full">
                <Label htmlFor="image_upload" className="cursor-pointer w-full">
                  <div className="flex items-center justify-center p-2 bg-farmer-50 hover:bg-farmer-100 text-farmer-700 rounded-md transition-colors">
                    <Upload className="h-4 w-4 mr-2" />
                    <span>{imageFile ? 'Change Image' : 'Browse Files'}</span>
                  </div>
                  <Input 
                    id="image_upload" 
                    type="file" 
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden" 
                  />
                </Label>
              </div>
            </div>
          </div>
          
          {/* Image URL field - now as fallback */}
          <div className="grid gap-2">
            <Label htmlFor="image_url">Image URL (optional)</Label>
            <Input
              type="text"
              id="image_url"
              name="image_url"
              placeholder="Or provide an image URL"
              value={imagePreview ? '' : product.image_url}
              onChange={handleChange}
              disabled={!!imagePreview}
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="is_organic"
              name="is_organic"
              checked={product.is_organic}
              onCheckedChange={(checked) => setProduct(prev => ({ ...prev, is_organic: !!checked }))}
            />
            <Label htmlFor="is_organic" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Organic
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="show_contact_number"
              name="show_contact_number"
              checked={product.show_contact_number}
              onCheckedChange={(checked) => setProduct(prev => ({ ...prev, show_contact_number: !!checked }))}
            />
            <Label htmlFor="show_contact_number" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Show Contact Number
            </Label>
          </div>
        </CardContent>
        <CardFooter>
          <Button disabled={loading || uploading} onClick={() => setPreview(true)} className="mr-2">
            Preview
          </Button>
          <Button type="submit" disabled={loading || uploading} onClick={handleSubmit}>
            {(loading || uploading) ? (
              <span className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin inline-block"></span>
            ) : (
              isEditing ? 'Update Product' : 'Add Product'
            )}
          </Button>
        </CardFooter>
      </Card>

      {preview && (
        <Card className="w-full md:w-1/2">
          <CardHeader>
            <CardTitle>Product Preview</CardTitle>
            <CardDescription>This is how your product will appear on the marketplace.</CardDescription>
          </CardHeader>
          <CardContent>
            <ProductCard
              product={{
                id: productId || 'preview',
                name: product.name,
                description: product.description,
                price: Number(product.price),
                unit: product.unit,
                quantity: product.quantity,
                image: imagePreview || product.image_url,
                category: product.category,
                isOrganic: product.is_organic,
                farmer: {
                  id: profile?.id || 'unknown',
                  name: profile?.full_name || 'unknown',
                  farm: 'Your Farm',
                  rating: 5,
                },
              }}
              viewMode="grid"
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default FarmerAddProduct;
