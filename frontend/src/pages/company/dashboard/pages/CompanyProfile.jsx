import React, { useState, useEffect, useCallback, useContext } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Building2,
  Upload,
  Globe,
  Linkedin,
  Twitter,
  Facebook,
  Instagram,
  Github,
  MapPin,
  Users,
  Phone,
  Mail,
  CheckCircle2,
  AlertCircle,
  Save,
  Eye,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import { Input } from '../../../../components/ui/Input';
import { Badge } from '../../../../components/ui/Badge';
import { toast } from 'sonner';
import axios from 'axios';
import { AuthContext } from '../../../../context/authContext';

const profileSchema = z.object({
  companyName: z.string().min(2, 'Company name is required'),
  tagline: z.string().min(5, 'Tagline must be at least 5 characters'),
  about: z.string().min(50, 'About must be at least 50 characters'),
  industry: z.string().min(2, 'Industry is required'),
  companySize: z.string().min(1, 'Company size is required'),
  foundedYear: z.string().regex(/^\d{4}$/, 'Enter a valid year'),
  location: z.string().min(2, 'Location is required'),
  phone: z.string().min(9, 'Phone number is required'),
  website: z.string().url('Invalid website URL').optional().or(z.literal('')),
  linkedin: z.string().url('Invalid LinkedIn URL').optional().or(z.literal('')),
  twitter: z.string().url('Invalid Twitter URL').optional().or(z.literal('')),
  facebook: z.string().url('Invalid Facebook URL').optional().or(z.literal('')),
  instagram: z.string().url('Invalid Instagram URL').optional().or(z.literal('')),
  github: z.string().url('Invalid GitHub URL').optional().or(z.literal('')),
});

const CompanyProfile = () => {
  const { refreshUser } = useContext(AuthContext);
  const [showPreview, setShowPreview] = useState(false);
  const [logoPreview, setLogoPreview] = useState(null);
  const [bannerPreview, setBannerPreview] = useState(null);
  const [userEmail, setUserEmail] = useState('');

  const [loading, setLoading] = useState(true);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    watch,
  } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      companyName: '',
      tagline: '',
      about: '',
      industry: '',
      companySize: '',
      foundedYear: '',
      location: '',
      phone: '',
      website: '',
      linkedin: '',
      twitter: '',
      facebook: '',
      instagram: '',
      github: '',
      logo: null,
      banner: null,
    },
  });

  const fetchProfile = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:6060/api/company/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success && res.data.data) {
        const data = res.data.data;
        reset({
          companyName: data.companyName || data.User?.name || '',
          tagline: data.tagline || '',
          about: data.about || '',
          industry: data.industry || '',
          companySize: data.companySize || '',
          foundedYear: data.foundedYear || '',
          location: data.location || '',
          phone: data.phone || data.User?.phone || '',
          website: data.website || '',
          linkedin: data.linkedin || '',
          twitter: data.twitter || '',
          facebook: data.facebook || '',
          instagram: data.instagram || '',
          github: data.github || '',
        });
        setUserEmail(data.User?.email || '');
        setLogoPreview(data.logo || null);
        setBannerPreview(data.banner || null);
      }
    } catch (err) {
      if (err.response?.status !== 404) {
        toast.error('Failed to load profile. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }, [reset]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const onSubmit = async (data) => {
    try {
      const token = localStorage.getItem('token');
      const payload = {
        ...data,
        logo: logoPreview,
        banner: bannerPreview,
      };

      const res = await axios.put('http://localhost:6060/api/company/profile', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success) {
        toast.success('✓ Company profile updated successfully! Your changes are now visible to students.');
        await refreshUser().catch(() => {});
        await fetchProfile(); // Refetch to get latest data from database
        setShowPreview(true);
      }
    } catch (err) {
      console.error('Profile update error:', err);
      toast.error('Failed to update profile. Please try again.');
    }
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBannerUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setBannerPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const formData = watch();

  return (
    <div className="space-y-6">
      {/* Header - black text for visibility */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
              Company Profile
            </h1>
          </div>
          <p className="mt-1 text-sm sm:text-base text-gray-700 dark:text-gray-200">
            Manage your company information and branding
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowPreview(!showPreview)} className="border-gray-300 text-gray-900 dark:text-white">
            <Eye size={18} className="mr-2" />
            {showPreview ? 'Edit' : 'Preview'}
          </Button>
          {/* Save Changes button removed from header, only present at bottom */}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-12">
           <span className="text-gray-500">Loading profile...</span>
        </div>
      ) : showPreview ? (
        /* Preview Mode */
        <div className="space-y-6">
          {/* Banner */}
          <Card className="overflow-hidden p-0">
            <div
              className={`h-48 ${
                bannerPreview
                  ? 'bg-cover bg-center'
                  : 'bg-gradient-to-r from-blue-600 to-purple-600'
              }`}
              style={bannerPreview ? { backgroundImage: `url(${bannerPreview})` } : {}}
            />
            <div className="relative px-6 pb-6">
              <div className="absolute -top-16 flex h-32 w-32 items-center justify-center rounded-lg border-4 border-white bg-white shadow-lg dark:border-gray-900 dark:bg-gray-800">
                {logoPreview ? (
                  <img
                    src={logoPreview}
                    alt="Logo"
                    className="h-full w-full rounded-lg object-cover"
                  />
                ) : (
                  <Building2 size={48} className="text-gray-400" />
                )}
              </div>
              <div className="ml-40 mt-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formData.companyName}
                </h2>
                <p className="text-gray-900 dark:text-gray-100">{formData.tagline}</p>
              </div>
            </div>
          </Card>

          {/* About */}
          <Card>
            <CardHeader>
              <CardTitle>About Us</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-gray-900 dark:text-gray-100">
                {formData.about}
              </p>
            </CardContent>
          </Card>

          {/* Details Grid */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Company Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Building2 size={18} className="text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Industry</p>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{formData.industry}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Users size={18} className="text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Company Size</p>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{formData.companySize} employees</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin size={18} className="text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Location</p>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{formData.location}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Phone size={18} className="text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Phone</p>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{formData.phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Mail size={18} className="text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{userEmail}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Globe size={18} className="text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Website</p>
                    <a
                      href={formData.website}
                      className="font-medium text-blue-600 hover:text-blue-500 hover:underline"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {formData.website}
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Social Links */}
          <Card>
            <CardHeader>
              <CardTitle>Social Media</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                {formData.linkedin && (
                  <a
                    href={formData.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-blue-600 hover:underline"
                  >
                    <Linkedin size={18} />
                    LinkedIn
                  </a>
                )}
                {formData.twitter && (
                  <a
                    href={formData.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-blue-400 hover:underline"
                  >
                    <Twitter size={18} />
                    Twitter
                  </a>
                )}
                {formData.facebook && (
                  <a
                    href={formData.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-blue-600 hover:underline"
                  >
                    <Facebook size={18} />
                    Facebook
                  </a>
                )}
                {formData.instagram && (
                  <a
                    href={formData.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-pink-600 hover:underline"
                  >
                    <Instagram size={18} />
                    Instagram
                  </a>
                )}
                {formData.github && (
                  <a
                    href={formData.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-gray-900 hover:underline dark:text-white"
                  >
                    <Github size={18} />
                    GitHub
                  </a>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        /* Edit Mode */
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Branding */}
          <Card>
            <CardHeader>
              <CardTitle>Branding</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Logo Upload */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-gray-100">
                  Company Logo
                </label>
                <div className="flex items-center gap-4">
                  <div className="flex h-24 w-24 items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
                    {logoPreview ? (
                      <img
                        src={logoPreview}
                        alt="Logo preview"
                        className="h-full w-full rounded-lg object-cover"
                      />
                    ) : (
                      <Building2 size={32} className="text-gray-400" />
                    )}
                  </div>
                  <div>
                    <input
                      type="file"
                      id="logo"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                    <label htmlFor="logo">
                      <Button type="button" variant="outline" className="gap-2" asChild>
                        <span>
                          <Upload size={18} />
                          Upload Logo
                        </span>
                      </Button>
                    </label>
                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                      Recommended: 400x400px, PNG or JPG
                    </p>
                  </div>
                </div>
              </div>

              {/* Banner Upload */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-gray-100">
                  Cover Banner
                </label>
                <div className="space-y-4">
                  <div
                    className={`h-48 w-full rounded-lg border-2 border-dashed border-gray-300 ${
                      bannerPreview
                        ? 'bg-cover bg-center'
                        : 'bg-gradient-to-r from-blue-600 to-purple-600'
                    }`}
                    style={bannerPreview ? { backgroundImage: `url(${bannerPreview})` } : {}}
                  />
                  <div>
                    <input
                      type="file"
                      id="banner"
                      accept="image/*"
                      onChange={handleBannerUpload}
                      className="hidden"
                    />
                    <label htmlFor="banner">
                      <Button type="button" variant="outline" className="gap-2" asChild>
                        <span>
                          <Upload size={18} />
                          Upload Banner
                        </span>
                      </Button>
                    </label>
                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                      Recommended: 1920x400px, PNG or JPG
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-gray-100">
                    Company Name *
                  </label>
                  <Input {...register('companyName')} placeholder="Tech Innovations Pvt. Ltd." />
                  {errors.companyName && (
                    <p className="mt-1 text-xs text-red-600">{errors.companyName.message}</p>
                  )}
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-gray-100">
                    Industry *
                  </label>
                  <Input {...register('industry')} placeholder="Information Technology" />
                  {errors.industry && (
                    <p className="mt-1 text-xs text-red-600">{errors.industry.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-gray-100">
                  Tagline *
                </label>
                <Input
                  {...register('tagline')}
                  placeholder="Building the future of technology in Nepal"
                />
                {errors.tagline && (
                  <p className="mt-1 text-xs text-red-600">{errors.tagline.message}</p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-gray-100">
                  About Company *
                </label>
                <textarea
                  {...register('about')}
                  rows={6}
                  className="w-full rounded-lg border border-gray-300 bg-white text-gray-900 px-4 py-2 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-50"
                  placeholder="Tell us about your company..."
                />
                {errors.about && (
                  <p className="mt-1 text-xs text-red-600">{errors.about.message}</p>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-gray-100">
                    Company Size *
                  </label>
                  <select
                    {...register('companySize')}
                    className="w-full rounded-lg border border-gray-300 bg-white text-gray-900 px-4 py-2 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-50"
                  >
                    <option value="">Select size</option>
                    <option value="1-10">1-10</option>
                    <option value="11-50">11-50</option>
                    <option value="51-200">51-200</option>
                    <option value="201-500">201-500</option>
                    <option value="500+">500+</option>
                  </select>
                  {errors.companySize && (
                    <p className="mt-1 text-xs text-red-600">{errors.companySize.message}</p>
                  )}
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-gray-100">
                    Founded Year *
                  </label>
                  <Input {...register('foundedYear')} placeholder="2018" />
                  {errors.foundedYear && (
                    <p className="mt-1 text-xs text-red-600">{errors.foundedYear.message}</p>
                  )}
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-gray-100">
                    Location *
                  </label>
                  <Input {...register('location')} placeholder="Kathmandu, Nepal" />
                  {errors.location && (
                    <p className="mt-1 text-xs text-red-600">{errors.location.message}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-gray-100">
                    Phone *
                  </label>
                  <Input {...register('phone')} placeholder="014234567" />
                  {errors.phone && (
                    <p className="mt-1 text-xs text-red-600">{errors.phone.message}</p>
                  )}
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-gray-100">
                    Email *
                  </label>
                  <Input 
                    value={userEmail}
                    type="email" 
                    placeholder="hr@company.com.np"
                    disabled
                    readOnly
                    className="cursor-not-allowed bg-gray-100 dark:bg-gray-800"
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Email is set from your account and cannot be changed here.</p>
                </div>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-gray-100">
                  Website
                </label>
                <Input {...register('website')} placeholder="https://www.company.com.np" />
                {errors.website && (
                  <p className="mt-1 text-xs text-red-600">{errors.website.message}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Social Media */}
          <Card>
            <CardHeader>
              <CardTitle>Social Media Links</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-gray-100">
                  <Linkedin size={16} className="mr-2 inline" />
                  LinkedIn
                </label>
                <Input
                  {...register('linkedin')}
                  placeholder="https://linkedin.com/company/your-company"
                />
                {errors.linkedin && (
                  <p className="mt-1 text-xs text-red-600">{errors.linkedin.message}</p>
                )}
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-gray-100">
                  <Twitter size={16} className="mr-2 inline" />
                  Twitter
                </label>
                <Input {...register('twitter')} placeholder="https://twitter.com/yourcompany" />
                {errors.twitter && (
                  <p className="mt-1 text-xs text-red-600">{errors.twitter.message}</p>
                )}
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-gray-100">
                  <Facebook size={16} className="mr-2 inline" />
                  Facebook
                </label>
                <Input {...register('facebook')} placeholder="https://facebook.com/yourcompany" />
                {errors.facebook && (
                  <p className="mt-1 text-xs text-red-600">{errors.facebook.message}</p>
                )}
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-gray-100">
                  <Instagram size={16} className="mr-2 inline" />
                  Instagram
                </label>
                <Input
                  {...register('instagram')}
                  placeholder="https://instagram.com/yourcompany"
                />
                {errors.instagram && (
                  <p className="mt-1 text-xs text-red-600">{errors.instagram.message}</p>
                )}
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-gray-100">
                  <Github size={16} className="mr-2 inline" />
                  GitHub
                </label>
                <Input {...register('github')} placeholder="https://github.com/yourcompany" />
                {errors.github && (
                  <p className="mt-1 text-xs text-red-600">{errors.github.message}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setShowPreview(true)}>
              Cancel
            </Button>
            <Button type="submit">
              Save Changes
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};

export default CompanyProfile;
