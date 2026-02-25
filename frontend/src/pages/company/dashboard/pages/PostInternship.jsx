import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import {
  Briefcase,
  MapPin,
  Clock,
  DollarSign,
  Users,
  Calendar,
  Tag,
  FileText,
  Eye,
  Save,
  Send,
  X,
  ArrowLeft,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import { Input } from '../../../../components/ui/Input';
import { Badge } from '../../../../components/ui/Badge';
import { IT_CATEGORIES, COMMON_SKILLS, NEPAL_CITIES } from '../../../../data/options';
import { formatNPR } from '../../../../lib/utils';
import { toast } from 'sonner';

// Validation schema
const internshipSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(100, 'Title cannot exceed 100 characters'),
  category: z.string().min(1, 'Category is required'),
  description: z.string().min(50, 'Description must be at least 50 characters').max(5000, 'Description cannot exceed 5000 characters'),
  responsibilities: z.string().min(30, 'Responsibilities must be at least 30 characters').max(2000, 'Responsibilities cannot exceed 2000 characters'),
  skills: z.array(z.string()).min(1, 'At least one skill is required'),
  minEducation: z.string().min(1, 'Education requirement is required'),
  experienceLevel: z.string().min(1, 'Experience level is required'),
  openings: z.number({ invalid_type_error: 'Number of openings is required' }).min(1, 'At least 1 opening required').max(100, 'Number of openings cannot exceed 100'),
  duration: z.number({ invalid_type_error: 'Duration is required' }).min(1, 'Duration is required').max(12, 'Duration cannot exceed 12 months'),
  startDate: z.string().min(1, 'Start date is required'),
  locations: z.array(z.string()).min(1, 'At least one location is required'),
  workMode: z.string().min(1, 'Work mode is required'),
  isPaid: z.boolean(),
  stipend: z.number().optional().or(z.nan().transform(() => undefined)),
  stipendNote: z.string().optional(),
  perks: z.array(z.string()),
  deadline: z.string().min(1, 'Deadline is required'),
});

const PostInternship = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const editingPosting = location.state?.posting;
  const isEditing = !!editingPosting;

  const [skillInput, setSkillInput] = useState('');
  const [filteredSkills, setFilteredSkills] = useState([]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting, dirtyFields },
  } = useForm({
    resolver: zodResolver(internshipSchema),
    mode: 'onChange',
    defaultValues: editingPosting || {
      title: '',
      category: '',
      description: '',
      responsibilities: '',
      skills: [],
      minEducation: '',
      experienceLevel: 'Entry Level',
      openings: 1,
      duration: 3,
      startDate: '',
      locations: [],
      workMode: '',
      isPaid: false,
      stipend: 0,
      stipendNote: '',
      perks: [],
      deadline: '',
    },
  });

  const watchedFields = watch();
  const isPaid = watch('isPaid');
  const selectedSkills = watch('skills');
  const selectedLocations = watch('locations') || [];
  const selectedPerks = watch('perks') || [];

  // Helper function to get input border color based on validation state
  const getInputClassName = (fieldName, baseClassName = '') => {
    const hasError = errors[fieldName];
    const isFieldDirty = dirtyFields[fieldName];
    const fieldValue = watchedFields[fieldName];
    const hasValue = fieldValue !== '' && fieldValue !== undefined && fieldValue !== null && (Array.isArray(fieldValue) ? fieldValue.length > 0 : true);

    // Show green border only while typing (dirty), not after blur
    if (hasError) {
      return `${baseClassName} border-red-500 focus:border-red-500 focus:ring-red-500/20`;
    }
    if (isFieldDirty && hasValue && !hasError) {
      return `${baseClassName} border-green-500 focus:border-green-500 focus:ring-green-500/20`;
    }
    return baseClassName;
  };

  // Filter skills based on input
  useEffect(() => {
    const safeSelectedSkills = Array.isArray(selectedSkills) ? selectedSkills : [];
    if (skillInput) {
      const filtered = COMMON_SKILLS.filter(
        (skill) =>
          skill.toLowerCase().includes(skillInput.toLowerCase()) &&
          !safeSelectedSkills.includes(skill)
      );
      setFilteredSkills(filtered);
    } else {
      setFilteredSkills([]);
    }
  }, [skillInput, selectedSkills]);

  const addSkill = (skill) => {
    const safeSelectedSkills = Array.isArray(selectedSkills) ? selectedSkills : [];
    if (!safeSelectedSkills.includes(skill)) {
      setValue('skills', [...safeSelectedSkills, skill], { shouldValidate: true });
      setSkillInput('');
    }
  };

  const removeSkill = (skill) => {
    const safeSelectedSkills = Array.isArray(selectedSkills) ? selectedSkills : [];
    setValue(
      'skills',
      safeSelectedSkills.filter((s) => s !== skill),
      { shouldValidate: true }
    );
  };

  const toggleLocation = (city) => {
    if (selectedLocations.includes(city)) {
      setValue(
        'locations',
        selectedLocations.filter((l) => l !== city)
      );
    } else {
      setValue('locations', [...selectedLocations, city]);
    }
  };

  const togglePerk = (perk) => {
    if (selectedPerks.includes(perk)) {
      setValue(
        'perks',
        selectedPerks.filter((p) => p !== perk)
      );
    } else {
      setValue('perks', [...selectedPerks, perk]);
    }
  };

  const onSubmit = async (data, isDraft = false) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Not authenticated');

      const payload = { ...data, status: isDraft ? 'Draft' : 'active' };
      
      if (isEditing) {
        await axios.put(`http://localhost:6060/api/jobs/${editingPosting.id}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post('http://localhost:6060/api/jobs', payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      
      toast.success(
        isDraft
          ? '✓ Internship saved as draft. You can publish it later from My Listings.'
          : isEditing
          ? '✓ Internship updated successfully. Changes are now live.'
          : '✓ Internship posted successfully! It is now visible to students.'
      );
      
      navigate('/company/dashboard/my-listings');
    } catch (error) {
      if (error?.response?.data?.code === 'PROFILE_INCOMPLETE') {
        toast.error('Please complete your company profile before posting internships.');
        navigate('/company/dashboard/profile');
        return;
      }
      toast.error(error.response?.data?.message || 'Failed to post internship. Ensure you have created your company profile.');
    }
  };

  const perksOptions = [
    'Certificate',
    'Letter of Recommendation',
    'Pre-Placement Offer (PPO)',
    'Flexible Hours',
    'Meal Allowance',
    'Transport Allowance',
    'Work from Home',
    'Mentorship',
  ];

  const uniquePreviewLocations = Array.from(
    new Set((watchedFields.locations || []).map((item) => String(item || '').trim()).filter(Boolean))
  );
  const uniquePreviewSkills = Array.from(
    new Set((watchedFields.skills || []).map((item) => String(item || '').trim()).filter(Boolean))
  );
  const uniquePreviewPerks = Array.from(
    new Set((watchedFields.perks || []).map((item) => String(item || '').trim()).filter(Boolean))
  );
  const previewDescription = String(watchedFields.description || '').trim();
  const previewResponsibilities = String(watchedFields.responsibilities || '').trim();
  const previewMetaRows = [
    { key: 'location', label: 'Location', icon: MapPin, value: uniquePreviewLocations.length ? uniquePreviewLocations.join(', ') : 'Not specified' },
    { key: 'workMode', label: 'Work Mode', icon: Briefcase, value: watchedFields.workMode || 'Not specified' },
    { key: 'duration', label: 'Duration', icon: Clock, value: watchedFields.duration > 0 ? `${watchedFields.duration} months` : 'Not specified' },
    {
      key: 'stipend',
      label: 'Stipend',
      icon: DollarSign,
      value: watchedFields.isPaid && watchedFields.stipend > 0 ? `${formatNPR(watchedFields.stipend)}/month` : 'Unpaid'
    },
    { key: 'openings', label: 'Openings', icon: Users, value: watchedFields.openings > 0 ? String(watchedFields.openings) : 'Not specified' },
    {
      key: 'deadline',
      label: 'Deadline',
      icon: Calendar,
      value: watchedFields.deadline ? new Date(watchedFields.deadline).toLocaleDateString() : 'Not specified'
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        {isEditing && (
          <button
            onClick={() => navigate('/company/dashboard/my-listings')}
            className="flex items-center gap-2 text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white mb-4 text-sm font-medium transition-colors"
          >
            <ArrowLeft size={18} />
            Back to My Postings
          </button>
        )}
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
          {isEditing ? 'Edit Internship Posting' : 'Post New Internship'}
        </h1>
        <p className="mt-2 text-lg text-gray-700 dark:text-gray-200">
          {isEditing 
            ? 'Update the details of your internship posting below.' 
            : 'Fill in the details below to create your internship posting'}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Form */}
        <div className="lg:col-span-2">
          <form 
            onSubmit={handleSubmit(
              (data) => onSubmit(data, false), 
              () => {
                toast.error("Please fill all required fields correctly.");
              }
            )} 
            className="space-y-6"
          >
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase size={20} />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Title */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Internship Title *
                  </label>
                  <Input
                    {...register('title')}
                    placeholder="e.g. Full Stack Developer Intern"
                    className={getInputClassName('title')}
                  />
                  {errors.title && (
                    <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
                  )}
                </div>

                {/* Category */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Category *
                  </label>
                  <select
                    {...register('category')}
                    className={getInputClassName('category', 'w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-50 focus:outline-none focus:ring-2')}
                  >
                    <option value="">Select category</option>
                    {IT_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                  {errors.category && (
                    <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Job Description *
                  </label>
                  <textarea
                    {...register('description')}
                    rows={6}
                    placeholder="Describe the internship role, what the intern will learn, and what makes this opportunity unique..."
                    className={getInputClassName('description', 'w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-50 focus:outline-none focus:ring-2')}
                  />
                  {errors.description && (
                    <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
                  )}
                </div>

                {/* Responsibilities */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Responsibilities *
                  </label>
                  <textarea
                    {...register('responsibilities')}
                    rows={5}
                    placeholder="List the key responsibilities and day-to-day tasks..."
                    className={getInputClassName('responsibilities', 'w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-50 focus:outline-none focus:ring-2')}
                  />
                  {errors.responsibilities && (
                    <p className="mt-1 text-sm text-red-600">{errors.responsibilities.message}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Skills & Requirements */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Tag size={20} />
                  Skills & Requirements
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Skills */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Required Skills *
                  </label>
                  <div className="relative">
                    <Input
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      placeholder="Type a skill and press Enter..."
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && skillInput.trim()) {
                          e.preventDefault();
                          if (filteredSkills.length > 0) {
                            addSkill(filteredSkills[0]);
                          } else {
                            addSkill(skillInput.trim());
                          }
                        }
                      }}
                      className={errors.skills ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : (selectedSkills.length > 0 ? 'border-green-500 focus:border-green-500 focus:ring-green-500/20' : '')}
                    />
                    {filteredSkills.length > 0 && (
                      <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md border border-gray-200 bg-white shadow-lg dark:border-gray-800 dark:bg-gray-900">
                        {filteredSkills.map((skill) => (
                          <button
                            key={skill}
                            type="button"
                            onClick={() => addSkill(skill)}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
                          >
                            {skill}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {selectedSkills.map((skill) => (
                      <Badge key={skill} variant="default" className="gap-1">
                        {skill}
                        <button
                          type="button"
                          onClick={() => removeSkill(skill)}
                          className="ml-1 rounded-full hover:bg-blue-700 hover:text-white"
                        >
                          <X size={14} />
                        </button>
                      </Badge>
                    ))}
                  </div>
                  {errors.skills && (
                    <p className="mt-1 text-sm text-red-600">{errors.skills.message}</p>
                  )}
                </div>

                {/* Education & Experience */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Minimum Education *
                    </label>
                    <select
                      {...register('minEducation')}
                      className={getInputClassName('minEducation', 'w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-50 focus:outline-none focus:ring-2')}
                    >
                      <option value="">Select education</option>
                      <option value="Running BIT">Running BIT</option>
                      <option value="Running BCA">Running BCA</option>
                      <option value="Running BSc CSIT">Running BSc CSIT</option>
                      <option value="Running BE Computer">Running BE Computer</option>
                      <option value="Any Graduate">Any Graduate</option>
                      <option value="Any IT Student">Any IT Student</option>
                    </select>
                    {errors.minEducation && (
                      <p className="mt-1 text-sm text-red-600">{errors.minEducation.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Experience Level *
                    </label>
                    <select
                      {...register('experienceLevel')}
                      className={getInputClassName('experienceLevel', 'w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-50 focus:outline-none focus:ring-2')}
                    >
                      <option value="Entry Level">Entry Level (No experience)</option>
                      <option value="Some Experience">Some Experience (6+ months)</option>
                      <option value="Intermediate">Intermediate (1+ years)</option>
                    </select>
                    {errors.experienceLevel && (
                      <p className="mt-1 text-sm text-red-600">{errors.experienceLevel.message}</p>
                    )}
                  </div>
                </div>

                {/* Openings */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Number of Openings *
                  </label>
                  <Input
                    type="number"
                    {...register('openings', { valueAsNumber: true })}
                    min={1}
                    max={100}
                    className={getInputClassName('openings')}
                  />
                  {errors.openings && (
                    <p className="mt-1 text-sm text-red-600">{errors.openings.message}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Nepal Logistics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin size={20} />
                  Location & Duration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Duration and Start Date */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Duration (months) *
                    </label>
                    <Input
                      type="number"
                      {...register('duration', { valueAsNumber: true })}
                      min={1}
                      max={12}
                      className={getInputClassName('duration')}
                    />
                    {errors.duration && (
                      <p className="mt-1 text-sm text-red-600">{errors.duration.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Start Date *
                    </label>
                    <Input 
                      type="date" 
                      {...register('startDate')} 
                      className={getInputClassName('startDate')}
                    />
                    {errors.startDate && (
                      <p className="mt-1 text-sm text-red-600">{errors.startDate.message}</p>
                    )}
                  </div>
                </div>

                {/* Work Mode */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Work Mode *
                  </label>
                  <div className="flex gap-4 flex-wrap">
                    {['On-site', 'Remote', 'Hybrid'].map((mode) => (
                      <label
                        key={mode}
                        className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200"
                      >
                        <input
                          type="radio"
                          {...register('workMode')}
                          value={mode}
                          className="h-4 w-4 text-blue-600"
                        />
                        <span>{mode}</span>
                      </label>
                    ))}
                  </div>
                  {errors.workMode && (
                    <p className="mt-1 text-sm text-red-600">{errors.workMode.message}</p>
                  )}
                </div>

                {/* Locations */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Location(s) *
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {NEPAL_CITIES.map((city) => (
                      <button
                        key={city}
                        type="button"
                        onClick={() => toggleLocation(city)}
                        className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                          selectedLocations.includes(city)
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300'
                        }`}
                      >
                        {city}
                      </button>
                    ))}
                  </div>
                  {errors.locations && (
                    <p className="mt-1 text-sm text-red-600">{errors.locations.message}</p>
                  )}
                </div>

                {/* Stipend */}
                <div>
                  <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    <input
                      type="checkbox"
                      {...register('isPaid')}
                      className="h-4 w-4 rounded text-blue-600"
                    />
                    Paid Internship
                  </label>

                  {isPaid && (
                    <div className="mt-2 space-y-2">
                      <Input
                        type="number"
                        {...register('stipend', { valueAsNumber: true })}
                        placeholder="Enter monthly stipend in NPR"
                        min={0}
                        className={getInputClassName('stipend')}
                      />
                      <Input
                        {...register('stipendNote')}
                        placeholder="Additional stipend details (optional)"
                        className={getInputClassName('stipendNote')}
                      />
                    </div>
                  )}
                </div>

                {/* Perks */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Perks & Benefits
                  </label>
                  <div className="grid gap-2 md:grid-cols-2">
                    {perksOptions.map((perk) => (
                      <label
                        key={perk}
                        className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200"
                      >
                        <input
                          type="checkbox"
                          checked={selectedPerks.includes(perk)}
                          onChange={() => togglePerk(perk)}
                          className="h-4 w-4 rounded text-blue-600"
                        />
                        <span>{perk}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Deadline */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Application Deadline *
                  </label>
                  <Input 
                    type="date" 
                    {...register('deadline')} 
                    className={getInputClassName('deadline')}
                  />
                  {errors.deadline && (
                    <p className="mt-1 text-sm text-red-600">{errors.deadline.message}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/company/dashboard/my-listings')}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={handleSubmit((data) => onSubmit(data, true))}
                disabled={isSubmitting}
                className="gap-2"
              >
                <Save size={18} />
                Save as Draft
              </Button>
              <Button type="submit" disabled={isSubmitting} className="gap-2">
                <Send size={18} />
                {isEditing ? 'Update Posting' : 'Publish Internship'}
              </Button>
            </div>
          </form>
        </div>

        {/* Live Preview */}
        <div className="lg:col-span-1">
          <div className="sticky top-20">
            <div className="rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden bg-white dark:bg-slate-900">
              <div className="flex flex-col space-y-1.5 p-6">
                <h3 className="flex items-center gap-2 text-2xl font-semibold leading-none tracking-tight text-slate-900 dark:text-white">
                  <Eye size={20} className="text-slate-900 dark:text-white" />
                  Preview
                </h3>
              </div>
              <div className="p-6 pt-0 space-y-4">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                    {watchedFields.title || 'Internship Title'}
                  </h3>
                  {watchedFields.category && (
                    <Badge variant="default" className="mt-2 bg-slate-100 text-slate-800 dark:bg-slate-500 dark:text-white border-0">
                      {watchedFields.category}
                    </Badge>
                  )}
                </div>

                <div className="rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                  <dl className="divide-y divide-slate-200 dark:divide-slate-700">
                    {previewMetaRows.map((row) => {
                      const Icon = row.icon;
                      return (
                        <div key={row.key} className="grid grid-cols-[1fr,1.4fr] gap-3 px-3 py-2.5 text-sm">
                          <dt className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                            <Icon size={14} className="shrink-0" />
                            {row.label}
                          </dt>
                          <dd className="text-slate-900 dark:text-slate-100 font-medium break-words text-right">
                            {row.value}
                          </dd>
                        </div>
                      );
                    })}
                  </dl>
                </div>

                {previewDescription && (
                  <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3">
                    <h4 className="mb-2 text-sm font-semibold text-slate-900 dark:text-white">Description</h4>
                    <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap break-words">
                      {previewDescription}
                    </p>
                  </div>
                )}

                {previewResponsibilities && (
                  <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3">
                    <h4 className="mb-2 text-sm font-semibold text-slate-900 dark:text-white">Key Responsibilities</h4>
                    <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap break-words">
                      {previewResponsibilities}
                    </p>
                  </div>
                )}

                {(watchedFields.experienceLevel || watchedFields.minEducation || uniquePreviewSkills.length > 0) && (
                  <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3 space-y-3">
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Qualifications & Skills</h4>
                    <dl className="space-y-2 text-sm">
                      {watchedFields.experienceLevel && (
                        <div className="grid grid-cols-[1fr,1.4fr] gap-3">
                          <dt className="text-slate-500 dark:text-slate-400">Experience</dt>
                          <dd className="text-slate-900 dark:text-slate-100 font-medium text-right">{watchedFields.experienceLevel}</dd>
                        </div>
                      )}
                      {watchedFields.minEducation && (
                        <div className="grid grid-cols-[1fr,1.4fr] gap-3">
                          <dt className="text-slate-500 dark:text-slate-400">Education</dt>
                          <dd className="text-slate-900 dark:text-slate-100 font-medium text-right">{watchedFields.minEducation}</dd>
                        </div>
                      )}
                    </dl>
                    {uniquePreviewSkills.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {uniquePreviewSkills.map((skill) => (
                          <Badge key={skill} variant="outline" className="border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {uniquePreviewPerks.length > 0 && (
                  <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3">
                    <h4 className="mb-2 text-sm font-semibold text-slate-900 dark:text-white">Perks & Benefits</h4>
                    <ul className="space-y-1 text-sm text-slate-700 dark:text-slate-300">
                      {uniquePreviewPerks.map((perk) => (
                        <li key={perk}>• {perk}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostInternship;
