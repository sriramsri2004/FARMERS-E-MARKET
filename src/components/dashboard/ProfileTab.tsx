
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Calendar as CalendarIcon, Upload } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

interface ExtendedProfile {
  bio: string | null;
  location: string | null;
  phone_number: string | null;
  profile_image_url: string | null;
  gender: string | null;
  age: number | null;
  village: string | null;
  district: string | null;
  state: string | null;
  address: string | null;
  pin_code: string | null;
}

const ProfileTab = () => {
  const { profile, user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [profileData, setProfileData] = useState<ExtendedProfile>({
    bio: '',
    location: '',
    phone_number: '',
    profile_image_url: null,
    gender: '',
    age: null,
    village: '',
    district: '',
    state: '',
    address: '',
    pin_code: ''
  });

  useEffect(() => {
    fetchExtendedProfile();
  }, []);

  const fetchExtendedProfile = async () => {
    if (!profile?.id) return;

    try {
      const { data, error } = await supabase
        .from('profiles_extended')
        .select('*')
        .eq('id', profile.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "No rows found" error
        console.error('Error fetching profile:', error);
        return;
      }

      if (data) {
        setProfileData(data);
      }
    } catch (error) {
      console.error('Error in fetchExtendedProfile:', error);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!profile?.id || !e.target.files || e.target.files.length === 0) return;

    try {
      setUploading(true);
      const file = e.target.files[0];
      const fileExt = file.name.split('.').pop();
      const filePath = `${profile.id}-${Math.random().toString(36).substring(2)}.${fileExt}`;

      // Check if the storage bucket exists, if not create it
      const { data: bucketExists } = await supabase
        .storage
        .getBucket('profiles');

      if (!bucketExists) {
        const { data, error } = await supabase
          .storage
          .createBucket('profiles', {
            public: true
          });

        if (error) {
          throw error;
        }
      }

      const { error: uploadError } = await supabase
        .storage
        .from('profiles')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: publicUrl } = supabase
        .storage
        .from('profiles')
        .getPublicUrl(filePath);

      setProfileData(prev => ({ ...prev, profile_image_url: publicUrl.publicUrl }));

      toast({
        title: "Success",
        description: "Profile photo uploaded",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to upload image: " + error.message,
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!profile?.id) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('profiles_extended')
        .upsert({
          id: profile.id,
          ...profileData
        });

      if (error) throw error;

      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      });
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile: " + error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-900">My Profile</h2>
        <p className="text-gray-600">Manage your profile information</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Avatar className="w-24 h-24">
                {profileData.profile_image_url ? (
                  <AvatarImage src={profileData.profile_image_url} alt={profile?.full_name || 'Profile'} />
                ) : (
                  <AvatarFallback className="text-xl">
                    {profile?.full_name?.charAt(0) || "U"}
                  </AvatarFallback>
                )}
              </Avatar>
              <label 
                htmlFor="profile-photo" 
                className="absolute bottom-0 right-0 p-1 bg-farmer-700 rounded-full cursor-pointer hover:bg-farmer-800 transition-colors"
              >
                <Upload className="h-4 w-4 text-white" />
                <input 
                  id="profile-photo"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                  disabled={uploading}
                />
              </label>
            </div>
            <div>
              <CardTitle>Profile Information</CardTitle>
              <p className="text-sm text-gray-500 mt-1">Update your personal details</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input 
              value={profile?.full_name || ''} 
              disabled 
              className="bg-gray-50"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input 
                id="phone"
                placeholder="Your phone number"
                value={profileData.phone_number || ''}
                onChange={(e) => setProfileData(prev => ({ ...prev, phone_number: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gender">Gender</Label>
              <Select 
                value={profileData.gender || ''} 
                onValueChange={(value) => setProfileData(prev => ({ ...prev, gender: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                  <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="age">Age</Label>
              <Input 
                id="age"
                type="number"
                placeholder="Your age"
                value={profileData.age || ''}
                onChange={(e) => setProfileData(prev => ({ 
                  ...prev, 
                  age: e.target.value ? parseInt(e.target.value) : null 
                }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input 
                id="location"
                placeholder="General location"
                value={profileData.location || ''}
                onChange={(e) => setProfileData(prev => ({ ...prev, location: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea 
              id="bio"
              placeholder="Tell us about yourself"
              value={profileData.bio || ''}
              onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
            />
          </div>

          <div className="border-t pt-4 mt-4">
            <h3 className="font-semibold text-lg mb-3">Address Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="village">Village/Town</Label>
                <Input 
                  id="village"
                  placeholder="Your village or town"
                  value={profileData.village || ''}
                  onChange={(e) => setProfileData(prev => ({ ...prev, village: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="district">District</Label>
                <Input 
                  id="district"
                  placeholder="Your district"
                  value={profileData.district || ''}
                  onChange={(e) => setProfileData(prev => ({ ...prev, district: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input 
                  id="state"
                  placeholder="Your state"
                  value={profileData.state || ''}
                  onChange={(e) => setProfileData(prev => ({ ...prev, state: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pin_code">PIN Code</Label>
                <Input 
                  id="pin_code"
                  placeholder="PIN code"
                  value={profileData.pin_code || ''}
                  onChange={(e) => setProfileData(prev => ({ ...prev, pin_code: e.target.value }))}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address">Full Address</Label>
                <Textarea 
                  id="address"
                  placeholder="Your full address"
                  value={profileData.address || ''}
                  onChange={(e) => setProfileData(prev => ({ ...prev, address: e.target.value }))}
                />
              </div>
            </div>
          </div>

          <Button 
            onClick={handleSave} 
            className="w-full bg-farmer-700 hover:bg-farmer-800"
            disabled={isLoading}
          >
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfileTab;
