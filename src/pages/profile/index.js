import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useUser } from '@supabase/auth-helpers-react';
import { getProfile, updateProfile, updateProfilePicture } from '../../services/profiles';
import Layout from '../../components/layout/Layout';
import { Camera, Loader2, Check, MapPin, Mail, User, Edit3, Save, X } from 'lucide-react';

const ProfilePage = () => {
  const router = useRouter();
  const user = useUser();
  const fileInputRef = useRef(null);
  
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    display_name: '',
    bio: '',
    contact_email: '',
    contact_phone: '',
    website: '',
  });

  useEffect(() => {
    if (user === undefined) {
      setLoading(true);
      return;
    }
    if (!user) {
      router.push('/auth/login?redirect=/profile');
      return;
    }

    const fetchProfile = async () => {
      setLoading(true);
      setError(null);
      const { profile: fetchedProfile, error: fetchError } = await getProfile(user.id);
      if (fetchError) {
        setError('Failed to load profile data. Please try again.');
      } else {
        setProfile(fetchedProfile);
        setFormData({
          display_name: fetchedProfile?.display_name || '',
          bio: fetchedProfile?.bio || '',
          contact_email: fetchedProfile?.contact_email || '',
          contact_phone: fetchedProfile?.contact_phone || '',
          website: fetchedProfile?.website || '',
        });
      }
      setLoading(false);
    };
    fetchProfile();
  }, [user, router]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccessMessage('');
    
    const { error: updateError } = await updateProfile(user.id, formData);
    
    if (updateError) {
      setError('Failed to save profile. Please try again.');
    } else {
      setProfile(prev => ({ ...prev, ...formData }));
      setSuccessMessage('Profile saved successfully!');
      setIsEditing(false);
      setTimeout(() => setSuccessMessage(''), 3000);
    }
    setSaving(false);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (JPEG, PNG, etc.)');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('Image must be less than 10MB');
      return;
    }

    setUploadingImage(true);
    setError(null);
    
    const { url, error: uploadError } = await updateProfilePicture(user.id, file);
    
    if (uploadError) {
      setError('Failed to upload image. Please try again.');
    } else {
      setProfile(prev => ({ ...prev, profile_picture_url: url }));
      setSuccessMessage('Profile picture updated!');
      setTimeout(() => setSuccessMessage(''), 3000);
    }
    setUploadingImage(false);
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-red-600 animate-spin" />
        </div>
      </Layout>
    );
  }

  if (error && !profile) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12 max-w-lg text-center">
          <div className="bg-red-900/20 text-red-200 p-4 rounded border border-red-500/50">
            {error}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Head>
        <title>Your Profile | DommeDirectory</title>
      </Head>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Success/Error Messages */}
        {successMessage && (
          <div className="mb-4 p-4 bg-green-900/20 border border-green-500/50 rounded-lg flex items-center gap-2">
            <Check className="w-5 h-5 text-green-500" />
            <span className="text-green-200">{successMessage}</span>
          </div>
        )}
        
        {error && (
          <div className="mb-4 p-4 bg-red-900/20 border border-red-500/50 rounded-lg">
            <span className="text-red-200">{error}</span>
          </div>
        )}

        <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl overflow-hidden">
          {/* Header with Cover Image */}
          <div className="h-32 bg-gradient-to-r from-red-900/50 to-red-800/30 relative">
            <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#1a1a1a] to-transparent" />
          </div>

          {/* Profile Header */}
          <div className="px-6 pb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-end -mt-12 mb-6 gap-4">
              {/* Profile Image */}
              <div className="relative">
                <div className="w-24 h-24 rounded-xl bg-[#262626] border-4 border-[#1a1a1a] overflow-hidden flex items-center justify-center">
                  {profile?.profile_picture_url ? (
                    <img 
                      src={profile.profile_picture_url} 
                      alt={profile.display_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-12 h-12 text-gray-600" />
                  )}
                </div>
                
                {/* Upload Button */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImage}
                  className="absolute -bottom-2 -right-2 w-8 h-8 bg-red-600 hover:bg-red-700 rounded-full flex items-center justify-center text-white shadow-lg disabled:opacity-50 transition-colors"
                >
                  {uploadingImage ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Camera className="w-4 h-4" />
                  )}
                </button>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>

              {/* Name & Actions */}
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-bold text-white truncate">
                  {profile?.display_name || 'Your Profile'}
                </h1>
                <div className="flex items-center gap-2 text-gray-400 text-sm mt-1">
                  <Mail className="w-4 h-4" />
                  <span>{user?.email}</span>
                </div>
              </div>

              <button
                onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : isEditing ? (
                  <>
                    <Save className="w-4 h-4" />
                    Save
                  </>
                ) : (
                  <>
                    <Edit3 className="w-4 h-4" />
                    Edit
                  </>
                )}
              </button>
            </div>

            {/* Profile Form */}
            <div className="space-y-6">
              {/* Display Name */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Display Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="display_name"
                    value={formData.display_name}
                    onChange={handleInputChange}
                    className="w-full bg-[#262626] text-white rounded-lg py-3 px-4 border border-gray-700 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 transition-colors"
                    placeholder="Your professional name"
                  />
                ) : (
                  <p className="text-white text-lg">{profile?.display_name || 'Not set'}</p>
                )}
              </div>

              {/* Bio */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Bio
                </label>
                {isEditing ? (
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full bg-[#262626] text-white rounded-lg py-3 px-4 border border-gray-700 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 transition-colors resize-none"
                    placeholder="Tell clients about yourself, your experience, and what you offer..."
                  />
                ) : (
                  <p className="text-gray-300 whitespace-pre-wrap bg-[#262626] p-4 rounded-lg border border-gray-700">
                    {profile?.bio || 'No bio added yet.'}
                  </p>
                )}
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Location
                </label>
                <div className="flex items-center gap-2 text-white">
                  <MapPin className="w-5 h-5 text-red-600" />
                  <span>
                    {profile?.locations
                      ? `${profile.locations.city}, ${profile.locations.state}, ${profile.locations.country}`
                      : 'Not set'}
                  </span>
                </div>
              </div>

              {/* Contact Info - Only show in edit mode or if filled */}
              {(isEditing || formData.contact_email || formData.contact_phone || formData.website) && (
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Contact Email
                    </label>
                    {isEditing ? (
                      <input
                        type="email"
                        name="contact_email"
                        value={formData.contact_email}
                        onChange={handleInputChange}
                        className="w-full bg-[#262626] text-white rounded-lg py-3 px-4 border border-gray-700 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 transition-colors"
                        placeholder="your@email.com"
                      />
                    ) : (
                      <p className="text-white">{profile?.contact_email || 'Not set'}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Phone
                    </label>
                    {isEditing ? (
                      <input
                        type="tel"
                        name="contact_phone"
                        value={formData.contact_phone}
                        onChange={handleInputChange}
                        className="w-full bg-[#262626] text-white rounded-lg py-3 px-4 border border-gray-700 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 transition-colors"
                        placeholder="+1 (555) 123-4567"
                      />
                    ) : (
                      <p className="text-white">{profile?.contact_phone || 'Not set'}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Website */}
              {(isEditing || formData.website) && (
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Website
                  </label>
                  {isEditing ? (
                    <input
                      type="url"
                      name="website"
                      value={formData.website}
                      onChange={handleInputChange}
                      className="w-full bg-[#262626] text-white rounded-lg py-3 px-4 border border-gray-700 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 transition-colors"
                      placeholder="https://yourwebsite.com"
                    />
                  ) : (
                    <a 
                      href={profile?.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-red-600 hover:text-red-500"
                    >
                      {profile?.website}
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* Cancel Button when editing */}
            {isEditing && (
              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setFormData({
                      display_name: profile?.display_name || '',
                      bio: profile?.bio || '',
                      contact_email: profile?.contact_email || '',
                      contact_phone: profile?.contact_phone || '',
                      website: profile?.website || '',
                    });
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Quick Links */}
        <div className="mt-6 grid sm:grid-cols-3 gap-4">
          <Link 
            href="/dashboard"
            className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-4 hover:border-red-600/50 transition-colors"
          >
            <h3 className="text-white font-medium mb-1">Dashboard</h3>
            <p className="text-gray-400 text-sm">View your stats and activity</p>
          </Link>
          
          <Link 
            href="/listings/create"
            className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-4 hover:border-red-600/50 transition-colors"
          >
            <h3 className="text-white font-medium mb-1">Create Listing</h3>
            <p className="text-gray-400 text-sm">Add a new service listing</p>
          </Link>
          
          <Link 
            href="/verification"
            className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-4 hover:border-red-600/50 transition-colors"
          >
            <h3 className="text-white font-medium mb-1">Get Verified</h3>
            <p className="text-gray-400 text-sm">Build trust with clients</p>
          </Link>
        </div>
      </div>
    </Layout>
  );
};

export default ProfilePage;
