import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  User,
  GraduationCap,
  Globe,
  Linkedin,
  Github,
  Phone,
  Mail,
  Save,
  Eye,
  BookOpen,
  Briefcase,
  FileText,
  Upload,
  Image as ImageIcon,
  Loader2,
  CheckCircle,
  Star,
} from 'lucide-react';
import StudentLayout from '../../components/layout/StudentLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { toast } from 'sonner';
import { AuthContext } from '../../context/authContext';
import api from '../../services/api';
import ProfileCompletion from '../../components/ProfileCompletion';

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  university: z.string().min(2, 'University is required'),
  major: z.string().min(2, 'Major is required'),
  graduationYear: z.union([
    z.string().min(4, 'Graduation Year must be at least 4 digits'),
    z.number().min(1900, 'Graduation Year must be valid')
  ]),
  skillsText: z.string().optional(),
  resumeUrl: z.string().min(1, 'Resume URL is required').refine(
    (val) => /^https?:\/\/.+/.test(val),
    'Resume URL must be a valid URL'
  ),
  github: z.string().optional().refine(
    (val) => !val || val === '' || /^https?:\/\/.+/.test(val),
    'GitHub URL must be a valid URL or empty'
  ),
  linkedin: z.string().optional().refine(
    (val) => !val || val === '' || /^https?:\/\/.+/.test(val),
    'LinkedIn URL must be a valid URL or empty'
  ),
  portfolio: z.string().optional().refine(
    (val) => !val || val === '' || /^https?:\/\/.+/.test(val),
    'Portfolio URL must be a valid URL or empty'
  ),
  bio: z.string().optional(),
});

const Profile = () => {
  const { user, setUser, refreshUser } = useContext(AuthContext);
  const [showPreview, setShowPreview] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileViewCount, setProfileViewCount] = useState(0);
  const [openToWork, setOpenToWork] = useState(false);
  const [ratings, setRatings] = useState([]);
  const [ratingsLoading, setRatingsLoading] = useState(false);
  
  const [logoPreview, setLogoPreview] = useState(null);
  const [bannerPreview, setBannerPreview] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    watch,
  } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      phone: '',
      university: '',
      major: '',
      graduationYear: '',
      skillsText: '',
      resumeUrl: '',
      github: '',
      linkedin: '',
      portfolio: '',
      bio: '',
    },
  });

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/student/profile');
      if (res.data.success && res.data.data) {
        const data = res.data.data;
        reset({
          name: data.User?.name || user?.name || '',
          email: data.User?.email || user?.email || '',
          phone: data.User?.phone || '',
          university: data.university || '',
          major: data.major || '',
          graduationYear: data.graduationYear || '',
          skillsText: Array.isArray(data.skills) ? data.skills.join(', ') : '',
          resumeUrl: data.resumeUrl || '',
          github: data.github || '',
          linkedin: data.linkedin || '',
          portfolio: data.portfolio || '',
          bio: data.bio || '',
        });
        setLogoPreview(data.avatar || data.profilePicture || data.logo || null);
        setBannerPreview(data.banner || null);
        setProfileViewCount(Number(data.viewCount || 0));
        setOpenToWork(Boolean(data.openToWork));
      }
    } catch (err) {
      if (err.response?.status !== 404) {
        toast.error('Failed to load profile. Please try again.');
      } else {
        // Just reset to user defaults if no profile exists
        reset({
          name: user?.name || '',
          email: user?.email || '',
          bio: '',
        });
        setProfileViewCount(0);
      }
    } finally {
      setLoading(false);
    }
  }, [reset, user?.email, user?.name]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    const fetchRatings = async () => {
      if (!user?.id) return;
      try {
        setRatingsLoading(true);
        const res = await api.get(`/ratings/student/${user.id}`);
        if (res.data?.success && Array.isArray(res.data.data)) {
          setRatings(res.data.data);
        } else {
          setRatings([]);
        }
      } catch {
        setRatings([]);
      } finally {
        setRatingsLoading(false);
      }
    };
    fetchRatings();
  }, [user?.id]);

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  } 

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

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      const payload = {
        name: data.name,
        phone: data.phone || '',
        university: data.university,
        major: data.major,
        graduationYear: data.graduationYear,
        skills: data.skillsText
          ? data.skillsText.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
        resumeUrl: data.resumeUrl || '',
        github: data.github || '',
        linkedin: data.linkedin || '',
        portfolio: data.portfolio || '',
        bio: data.bio || '',
        avatar: logoPreview,
        banner: bannerPreview,
        openToWork: openToWork,
      };

      const res = await api.put('/student/profile', payload);
      
      if (res.data.success) {
        toast.success('✅ Profile updated successfully! Your changes are saved.', { duration: 4000 });
        
        // Refresh user data from backend to update navbar immediately
        await refreshUser().catch(() => {});
        
        reset(data);
        fetchProfile();
      } else {
        toast.error('Server returned an error. Please try again.');
      }
    } catch (err) {
      console.error('Profile save error:', err?.response?.data || err.message);
      const msg = err?.response?.data?.message || err?.response?.data?.error || 'Failed to update profile.';
      toast.error(`❌ ${msg}`);
    } finally {
      setSaving(false);
    }
  };

  const formData = watch();
  const skillsArray = formData.skillsText ? formData.skillsText.split(',').map((s) => s.trim()).filter(Boolean) : [];
  const completionProfile = {
    ...formData,
    avatar: logoPreview,
  };

  const handleNavigateToSection = (sectionId) => {
    if (showPreview) {
      setShowPreview(false);
    }

    window.setTimeout(() => {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, showPreview ? 120 : 0);
  };

  const averageRating = ratings.length
    ? Number(
        (
          ratings.reduce((sum, item) => sum + Number(item.rating || 0), 0) /
          ratings.length
        ).toFixed(1)
      )
    : 0;

  const renderStars = (value) => (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={14}
          className={
            star <= Number(value || 0)
              ? 'fill-yellow-400 text-yellow-500'
              : 'text-gray-300 dark:text-gray-600'
          }
        />
      ))}
    </div>
  );

  return (
    <StudentLayout user={user}>
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Header - match company profile */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                User Profile
              </h1>
            </div>
            <p className="mt-1 text-sm sm:text-base text-gray-700 dark:text-gray-300">
              Manage your personal information and resume
            </p>
            <p className="mt-1 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              {profileViewCount > 0
                ? `${profileViewCount} people viewed your profile`
                : 'No views yet'}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowPreview(!showPreview)} className="border-gray-300 text-gray-900 dark:text-white bg-white dark:bg-slate-900 hover:bg-gray-50 dark:hover:bg-slate-800">
              <Eye size={18} className="mr-2" />
              {showPreview ? 'Edit' : 'Preview'}
            </Button>
            {/* Save Changes button removed from header, only present at bottom */}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center p-12">
            <span className="text-gray-500 dark:text-gray-400">Loading profile...</span>
          </div>
        ) : (
          <>
            <ProfileCompletion
              profile={completionProfile}
              onNavigateToItem={handleNavigateToSection}
            />
          {showPreview ? (
          /* Preview Mode */
          <div className="space-y-6">
            {/* Banner */}
            <Card className="overflow-hidden p-0 border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-900">
              <div
                className={`h-48 ${
                  bannerPreview
                    ? 'bg-cover bg-center'
                    : 'bg-gradient-to-r from-blue-600 to-cyan-500'
                }`}
                style={bannerPreview ? { backgroundImage: `url(${bannerPreview})` } : {}}
              />
              <div className="relative px-6 pb-6">
                <div className="absolute -top-16 flex h-32 w-32 items-center justify-center rounded-lg border-4 border-white dark:border-gray-900 bg-white dark:bg-slate-900 shadow-lg">
                  {logoPreview ? (
                    <img
                      src={logoPreview.startsWith('http') || logoPreview.startsWith('data:') ? logoPreview : `http://localhost:6060/${logoPreview}`}
                      alt="Profile"
                      className="h-full w-full rounded-lg object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-200 text-5xl font-bold">
                      {formData.name?.charAt(0) || 'S'}
                    </div>
                  )}
                </div>
                <div className="ml-40 mt-6 flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {formData.name}
                      </h2>
                      {openToWork && (
                        <Badge className="bg-green-500 text-white font-bold text-xs px-3 py-1 dark:bg-green-600">
                          <Briefcase size={12} className="mr-1 inline" />
                          #OPEN TO WORK
                        </Badge>
                      )}
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 font-medium">{formData.email}</p>
                  </div>
                  {formData.resumeUrl && (
                    <Button variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-50" onClick={() => window.open(formData.resumeUrl, '_blank')}>
                      <FileText size={16} className="mr-2" />
                      View Resume
                    </Button>
                  )}
                </div>
              </div>
            </Card>

            {/* Details Grid */}
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-900">
                <CardHeader>
                  <CardTitle>Education</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <GraduationCap size={18} className="text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">University</p>
                      <p className="font-medium text-gray-900 dark:text-white">{formData.university || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <BookOpen size={18} className="text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Major</p>
                      <p className="font-medium text-gray-900 dark:text-white">{formData.major || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Briefcase size={18} className="text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Graduation Year</p>
                      <p className="font-medium text-gray-900 dark:text-white">{formData.graduationYear || 'N/A'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-900">
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Phone size={18} className="text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Phone</p>
                      <p className="font-medium text-gray-900 dark:text-white">{formData.phone || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail size={18} className="text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                      <p className="font-medium text-gray-900 dark:text-white">{formData.email}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Skills */}
            {skillsArray.length > 0 && (
              <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-900">
                <CardHeader>
                  <CardTitle>Skills</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {skillsArray.map((skill, index) => (
                      <Badge key={index} variant="outline" className="text-gray-700 dark:text-gray-100 bg-gray-50 dark:bg-slate-800">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Links */}
            <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-900">
              <CardHeader>
                <CardTitle>Online Presence</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-6">
                  {formData.linkedin && (
                    <a
                      href={formData.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline font-medium"
                    >
                      <Linkedin size={20} />
                      LinkedIn
                    </a>
                  )}
                  {formData.github && (
                    <a
                      href={formData.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-gray-900 dark:text-gray-100 hover:underline font-medium"
                    >
                      <Github size={20} />
                      GitHub
                    </a>
                  )}
                  {formData.portfolio && (
                    <a
                      href={formData.portfolio}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-purple-600 dark:text-purple-400 hover:underline font-medium"
                    >
                      <Globe size={20} />
                      Portfolio
                    </a>
                  )}
                  {!formData.linkedin && !formData.github && !formData.portfolio && (
                    <span className="text-gray-500 dark:text-gray-400 italic">No links added</span>
                  )}
                </div>
              </CardContent>
            </Card>

            {formData.bio && (
              <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-900">
                <CardHeader>
                  <CardTitle>About</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-200 whitespace-pre-wrap">
                    {formData.bio}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          /* Edit Mode */
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Validation Errors Display */}
            {Object.keys(errors).length > 0 && (
              <div className="rounded-lg border-2 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-4">
                <h3 className="text-sm font-semibold text-red-800 dark:text-red-200 mb-2">
                  Please fix the following errors:
                </h3>
                <ul className="list-disc list-inside space-y-1">
                  {Object.entries(errors).map(([field, error]) => (
                    <li key={field} className="text-sm text-red-700 dark:text-red-300">
                      <strong>{field}:</strong> {error.message}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {/* Branding */}
            <Card id="photo-section" className="scroll-mt-24 border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-900">
              <CardHeader>
                <CardTitle>Branding</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Logo Upload */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">
                    Profile Picture / Logo
                  </label>
                  <div className="flex items-center gap-4">
                    <div className="flex h-24 w-24 items-center justify-center rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-slate-800">
                      {logoPreview ? (
                        <img
                          src={logoPreview.startsWith('http') || logoPreview.startsWith('data:') ? logoPreview : `http://localhost:6060/${logoPreview}`}
                          alt="Logo preview"
                          className="h-full w-full rounded-lg object-cover"
                        />
                      ) : (
                        <ImageIcon size={32} className="text-gray-400 dark:text-gray-300" />
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
                        <Button type="button" variant="outline" className="gap-2 bg-white dark:bg-slate-900 hover:bg-gray-50 dark:hover:bg-slate-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white" asChild>
                          <span>
                            <Upload size={18} />
                            Upload Photo
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
                  <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">
                    Cover Banner
                  </label>
                  <div className="space-y-4">
                    <div
                      className={`h-48 w-full rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 ${
                        bannerPreview
                          ? 'bg-cover bg-center'
                          : 'bg-gradient-to-r from-blue-600 to-cyan-500'
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
                        <Button type="button" variant="outline" className="gap-2 bg-white dark:bg-slate-900 hover:bg-gray-50 dark:hover:bg-slate-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white" asChild>
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
            <Card id="basic-info-section" className="scroll-mt-24 border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-900">
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">
                      Full Name
                    </label>
                    <Input {...register('name')} placeholder="John Doe" className="bg-white dark:bg-slate-900 text-gray-900 dark:text-white" />
                    {errors.name && (
                      <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">
                      Email
                    </label>
                    <Input {...register('email')} type="email" placeholder="john@example.com" disabled className="bg-gray-100 dark:bg-slate-800 cursor-not-allowed text-gray-500 dark:text-gray-400" />
                    {errors.email && (
                      <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
                    )}
                  </div>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">
                    Phone
                  </label>
                  <Input {...register('phone')} placeholder="9812345678" className="bg-white dark:bg-slate-900 text-gray-900 dark:text-white" />
                </div>
              </CardContent>
            </Card>

            {/* Education Info */}
            <Card id="education-section" className="scroll-mt-24 border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-900">
              <CardHeader>
                <CardTitle>Education</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">
                      University *
                    </label>
                    <Input {...register('university')} placeholder="Tribhuvan University" className="bg-white dark:bg-slate-900 text-gray-900 dark:text-white" />
                    {errors.university && (
                      <p className="mt-1 text-xs text-red-600">{errors.university.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">
                      Major *
                    </label>
                    <Input {...register('major')} placeholder="BSc. CSIT" className="bg-white dark:bg-slate-900 text-gray-900 dark:text-white" />
                    {errors.major && (
                      <p className="mt-1 text-xs text-red-600">{errors.major.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">
                      Graduation Year *
                    </label>
                    <Input {...register('graduationYear')} placeholder="2024" className="bg-white dark:bg-slate-900 text-gray-900 dark:text-white" />
                    {errors.graduationYear && (
                      <p className="mt-1 text-xs text-red-600">{errors.graduationYear.message}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card id="skills-section" className="scroll-mt-24 border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-900">
              <CardHeader>
                <CardTitle>Skills</CardTitle>
              </CardHeader>
              <CardContent>
                <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">
                  Technical Skills (Comma separated)
                </label>
                <textarea
                  {...register('skillsText')}
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 px-4 py-2 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                  placeholder="React, Node.js, Python, TypeScript..."
                />
              </CardContent>
            </Card>

            {/* Links */}
            <Card id="links-section" className="scroll-mt-24 border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-900">
              <CardHeader>
                <CardTitle>Links & Resume</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">
                    <Globe size={16} className="mr-2 inline" />
                    Resume URL
                  </label>
                  <Input {...register('resumeUrl')} placeholder="https://drive.google.com/.../view" className="bg-white dark:bg-slate-900 text-gray-900 dark:text-white" />
                  {errors.resumeUrl && (
                    <p className="mt-1 text-xs text-red-600">{errors.resumeUrl.message}</p>
                  )}
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">
                    <Linkedin size={16} className="mr-2 inline" />
                    LinkedIn
                  </label>
                  <Input {...register('linkedin')} placeholder="https://linkedin.com/in/username" className="bg-white dark:bg-slate-900 text-gray-900 dark:text-white" />
                  {errors.linkedin && (
                    <p className="mt-1 text-xs text-red-600">{errors.linkedin.message}</p>
                  )}
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">
                    <Github size={16} className="mr-2 inline" />
                    GitHub
                  </label>
                  <Input {...register('github')} placeholder="https://github.com/username" className="bg-white dark:bg-slate-900 text-gray-900 dark:text-white" />
                  {errors.github && (
                    <p className="mt-1 text-xs text-red-600">{errors.github.message}</p>
                  )}
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">
                    <Globe size={16} className="mr-2 inline" />
                    Portfolio Website
                  </label>
                  <Input {...register('portfolio')} placeholder="https://yourportfolio.com" className="bg-white dark:bg-slate-900 text-gray-900 dark:text-white" />
                  {errors.portfolio && (
                    <p className="mt-1 text-xs text-red-600">{errors.portfolio.message}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card id="bio-section" className="scroll-mt-24 border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-900">
              <CardHeader>
                <CardTitle>About</CardTitle>
              </CardHeader>
              <CardContent>
                <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">
                  Bio / About You
                </label>
                <textarea
                  {...register('bio')}
                  rows={4}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 px-4 py-2 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                  placeholder="Tell recruiters about yourself, your interests, and what kind of internship you are looking for..."
                />
              </CardContent>
            </Card>

            {/* Work Preferences */}
            <Card id="preferences-section" className="scroll-mt-24 border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-900">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase size={20} />
                  Work Preferences
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-800">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Briefcase size={18} className="text-green-600 dark:text-green-400" />
                      <label className="text-sm font-semibold text-gray-900 dark:text-white">
                        Open to Work
                      </label>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Let companies know you are actively looking for opportunities
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setOpenToWork(!openToWork)}
                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 ${
                      openToWork ? 'bg-green-600' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                        openToWork ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                {openToWork && (
                  <div className="mt-3 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                    <p className="text-xs text-green-800 dark:text-green-300 flex items-center gap-2">
                      <CheckCircle size={14} />
                      Your profile will show a green "#OPEN TO WORK" badge to companies!
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Submit Button */}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowPreview(true)} className="bg-white dark:bg-slate-900 hover:bg-gray-50 dark:hover:bg-slate-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white">
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="min-w-[140px] bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <span className="flex items-center gap-2">
                    <Loader2 size={16} className="animate-spin" />
                    Saving...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Save size={16} />
                    Save Changes
                  </span>
                )}
              </Button>
            </div>
          </form>
        )}
            {/* Internship Reviews */}
            {!ratingsLoading && ratings.length > 0 && (
              <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-900">
                <CardHeader>
                  <CardTitle className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <span>Internship Reviews</span>
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                      ⭐ {averageRating} average from {ratings.length} internship{ratings.length !== 1 ? 's' : ''}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {ratings.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-800 p-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {item.CompanyProfile?.companyName || 'Company'}
                          {item.Application?.Job?.title ? ` · ${item.Application.Job.title}` : ''}
                        </p>
                        {renderStars(item.rating)}
                      </div>
                      {item.review && (
                        <p className="mt-2 text-sm text-gray-700 dark:text-gray-200 leading-relaxed">
                          {item.review}
                        </p>
                      )}
                      {Array.isArray(item.skills) && item.skills.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {item.skills.map((skill) => (
                            <Badge key={`${item.id}-${skill}`} variant="outline">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </StudentLayout>
  );
};

export default Profile;
