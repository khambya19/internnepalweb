import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
} from '@tanstack/react-table';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  Calendar,
  X,
  Github,
  Globe,
  Mail,
  GraduationCap,
  ArrowLeft,
  Users,
  Briefcase,
  Inbox,
  FileText,
  MapPin,
  DollarSign,
  Linkedin,
  StickyNote,
  CheckSquare,
  Square,
  Trash2,
  Star,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import { Badge } from '../../../../components/ui/Badge';
import { Input } from '../../../../components/ui/Input';
import { SearchWithHistory } from '../../../../components/ui/SearchWithHistory';
import { formatRelativeDate, formatNPR } from '../../../../lib/utils';
import { toast } from 'sonner';
import axios from 'axios';
import EmptyState from '../../../../components/EmptyState';

const STATUS_COLORS = {
  Pending:              { bg: 'bg-gray-100',   text: 'text-gray-800'   },
  Applied:              { bg: 'bg-gray-100',   text: 'text-gray-800'   },
  'Under Review':       { bg: 'bg-yellow-100', text: 'text-yellow-800' },
  Shortlisted:          { bg: 'bg-blue-100',   text: 'text-blue-800'   },
  'Interview Scheduled':{ bg: 'bg-purple-100', text: 'text-purple-800' },
  Offered:              { bg: 'bg-teal-100',   text: 'text-teal-800'   },
  Hired:                { bg: 'bg-green-100',  text: 'text-green-800'  },
  Rejected:             { bg: 'bg-red-100',    text: 'text-red-800'    },
};

const STATUS_OPTIONS = ['Pending','Under Review','Shortlisted','Interview Scheduled','Offered','Hired','Rejected'];
const RATING_SKILL_OPTIONS = [
  'Hardworking',
  'Punctual',
  'Creative',
  'Good communicator',
  'Technical skills',
  'Team player',
];

const statusBadgeVariants = {
  active: 'success',
  Draft: 'secondary',
  closed: 'warning',
};

const canRateStatus = (status) => {
  const normalized = String(status || '').trim().toLowerCase();
  return normalized === 'hired' || normalized === 'offered';
};

const Applications = () => {
  const location = useLocation();
  const initialPostingId = location.state?.postingId || null;

  const [data, setData] = useState([]);
  const [postings, setPostings] = useState([]);
  const [loading, setLoading] = useState(true);

  // view: 'jobs' | 'applicants'
  const [view, setView] = useState(initialPostingId ? 'applicants' : 'jobs');
  const [activePosting, setActivePosting] = useState(initialPostingId || null);

  const [globalFilter, setGlobalFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [starredFilter, setStarredFilter] = useState('all'); // 'all' | 'starred'
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showInterviewModal, setShowInterviewModal] = useState(null);
  const [rejectModal, setRejectModal] = useState({ open: false, applicationId: null });
  const [rejectReason, setRejectReason] = useState('');
  const [isRejectSaving, setIsRejectSaving] = useState(false);
  const [interviewDetails, setInterviewDetails] = useState({
    date: '', time: '', mode: 'Online', link: '', message: '',
  });
  const [isExporting, setIsExporting] = useState(false);
  const [notesOpen, setNotesOpen] = useState({});
  const [notesSaveStatus, setNotesSaveStatus] = useState({});
  const [ratingModal, setRatingModal] = useState({ open: false, applicationId: null });
  const [ratingValue, setRatingValue] = useState(0);
  const [ratingReview, setRatingReview] = useState('');
  const [ratingSkills, setRatingSkills] = useState([]);
  const [isRatingSaving, setIsRatingSaving] = useState(false);
  
  // Bulk reject states
  const [selectedApplicationIds, setSelectedApplicationIds] = useState([]);
  const [bulkRejectModal, setBulkRejectModal] = useState(false);
  const [bulkRejectReason, setBulkRejectReason] = useState('');
  const [isBulkRejecting, setIsBulkRejecting] = useState(false);

  /* ── Fetch ── */
  // Fetch all jobs and their applications
  const fetchApplications = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // Fetch all posted jobs
      const jobsRes = await axios.get('http://localhost:6060/api/jobs/my-jobs', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Fetch all applications
      const appsRes = await axios.get('http://localhost:6060/api/applications/company/all', {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (jobsRes.data.success) {
        setPostings(jobsRes.data.data);
      }
      
      if (appsRes.data.success) {
        const apps = appsRes.data.data.map((app) => ({
          id: app.id,
          postingId: app.Job.id,
          postingTitle: app.Job.title,
          studentName: app.User?.name || 'Unknown',
          studentEmail: app.User?.email || '',
          studentPhone: app.User?.phone || '',
          studentAvatar: app.User?.StudentProfile?.avatar || '',
          studentBio: app.User?.StudentProfile?.bio || '',
          openToWork: Boolean(app.User?.StudentProfile?.openToWork),
          college: app.User?.StudentProfile?.university || '',
          major: app.User?.StudentProfile?.major || '',
          year: app.User?.StudentProfile?.graduationYear || '',
          skills: app.User?.StudentProfile?.skills || [],
          appliedDate: app.createdAt,
          matchScore: 0,
          status: app.status,
          coverLetter: app.coverLetter,
          // Always use the student's latest resume link from profile settings.
          resume: app.User?.StudentProfile?.resumeUrl || '',
          github: app.User?.StudentProfile?.github || '',
          linkedin: app.User?.StudentProfile?.linkedin || '',
          portfolio: app.User?.StudentProfile?.portfolio || '',
          interviewDate: app.interviewDate || null,
          interviewTime: app.interviewTime || null,
          interviewMessage: app.interviewMessage || null,
          rejectionReason: app.rejectionReason || '',
          companyNotes: app.companyNotes || '',
          studentProfileId: app.User?.StudentProfile?.id || null,
          internRating: app.InternRating
            ? {
                id: app.InternRating.id,
                rating: Number(app.InternRating.rating || 0),
                review: app.InternRating.review || '',
                skills: Array.isArray(app.InternRating.skills) ? app.InternRating.skills : [],
                createdAt: app.InternRating.createdAt || null,
              }
            : null,
          isStarred: app.isStarred || false,
        }));
        setData(apps);
      }
    } catch (error) {
      if (error?.response?.data?.code === 'PROFILE_INCOMPLETE') {
        toast.error('Please complete your company profile to view applications.');
      } else {
        toast.error('Failed to load data. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchApplications(); }, []);

  useEffect(() => {
    if (!selectedStudent?.id) return;
    const latest = data.find((item) => item.id === selectedStudent.id);
    if (latest) setSelectedStudent(latest);
  }, [data, selectedStudent?.id]);

  useEffect(() => {
    const studentProfileId = selectedStudent?.studentProfileId;
    if (!studentProfileId) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    axios
      .post(
        'http://localhost:6060/api/views/record',
        { targetType: 'student_profile', targetId: studentProfileId },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      .catch(() => {});
  }, [selectedStudent?.studentProfileId]);

  /* ── Status change ── */
  const handleStatusChange = useCallback(async (applicationId, newStatus) => {
    if (newStatus === 'Rejected') {
      setRejectModal({ open: true, applicationId });
      setRejectReason('');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const res = await axios.put(
        `http://localhost:6060/api/applications/${applicationId}`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        setData((prev) =>
          prev.map((app) => (app.id === applicationId ? { ...app, status: newStatus } : app))
        );
        if (newStatus === 'Interview Scheduled') {
          setShowInterviewModal(applicationId);
        } else {
          toast.success(`✓ Application status updated to "${newStatus}". The candidate has been notified.`);
        }
      }
    } catch {
      toast.error('Failed to update status. Please try again.');
    }
  }, []);

  const handleRejectWithReason = async () => {
    if (!rejectModal.applicationId) return;
    try {
      setIsRejectSaving(true);
      const token = localStorage.getItem('token');
      const reason = String(rejectReason || '').trim();
      const res = await axios.put(
        `http://localhost:6060/api/applications/${rejectModal.applicationId}`,
        { status: 'Rejected', rejectionReason: reason || null },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        setData((prev) =>
          prev.map((app) =>
            app.id === rejectModal.applicationId
              ? { ...app, status: 'Rejected', rejectionReason: reason }
              : app
          )
        );
        toast.success('✓ Application rejected. The candidate has been notified' + (reason ? ' with your feedback.' : '.'));
        setRejectModal({ open: false, applicationId: null });
        setRejectReason('');
      }
    } catch {
      toast.error('Failed to reject candidate. Please try again.');
    } finally {
      setIsRejectSaving(false);
    }
  };

  const handleScheduleInterview = async () => {
    const applicationId = showInterviewModal;
    try {
      const token = localStorage.getItem('token');
      const isOnline = interviewDetails.mode === 'Online';
      const linkLabel = isOnline ? 'Meeting Link' : 'Location (Maps)';
      const linkLine = interviewDetails.link ? `\n${linkLabel}: ${interviewDetails.link}` : '';
      const payload = {
        status: 'Interview Scheduled',
        interviewDate: interviewDetails.date,
        interviewTime: interviewDetails.time,
        interviewMessage: `Mode: ${interviewDetails.mode}${linkLine}\n${interviewDetails.message}`,
      };
      const res = await axios.put(
        `http://localhost:6060/api/applications/${applicationId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        setData(data.map((app) =>
          app.id === applicationId
            ? { ...app, status: 'Interview Scheduled', interviewDate: interviewDetails.date, interviewTime: interviewDetails.time, interviewMessage: `Mode: ${interviewDetails.mode}${linkLine}\n${interviewDetails.message}` }
            : app
        ));
        toast.success(interviewDetails.isEdit ? 'Interview details updated.' : 'Interview scheduled. The candidate has been notified.');
      }
    } catch {
      toast.error('Failed to schedule interview. Please try again.');
    } finally {
      setShowInterviewModal(null);
      setInterviewDetails({ date: '', time: '', mode: 'Online', link: '', message: '' });
    }
  };

  const getNotePreview = (note) => {
    const text = String(note || '').trim();
    if (!text) return 'Add note...';
    return text.length > 50 ? `${text.slice(0, 50)}...` : text;
  };

  const saveApplicationNotes = useCallback(async (applicationId, notesValue) => {
    try {
      setNotesSaveStatus((prev) => ({ ...prev, [applicationId]: 'saving' }));
      const token = localStorage.getItem('token');
      const res = await axios.patch(
        `http://localhost:6060/api/applications/${applicationId}/notes`,
        { notes: notesValue },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        const updated = res.data.data;
        setData((prev) =>
          prev.map((app) =>
            app.id === applicationId ? { ...app, companyNotes: updated.companyNotes || '' } : app
          )
        );
        setNotesSaveStatus((prev) => ({ ...prev, [applicationId]: 'saved' }));
        toast.success('✓ Notes saved successfully.');
        window.setTimeout(() => {
          setNotesSaveStatus((prev) => ({ ...prev, [applicationId]: 'idle' }));
        }, 1200);
      }
    } catch {
      setNotesSaveStatus((prev) => ({ ...prev, [applicationId]: 'error' }));
      toast.error('Failed to save notes.');
    }
  }, []);

  const openRatingModal = useCallback((applicationId) => {
    const target = data.find((item) => item.id === applicationId);
    setRatingModal({ open: true, applicationId });
    setRatingValue(Number(target?.internRating?.rating || 0));
    setRatingReview(target?.internRating?.review || '');
    setRatingSkills(Array.isArray(target?.internRating?.skills) ? target.internRating.skills : []);
  }, [data]);

  const toggleRatingSkill = (skill) => {
    setRatingSkills((prev) =>
      prev.includes(skill) ? prev.filter((item) => item !== skill) : [...prev, skill]
    );
  };

  const handleSubmitRating = async () => {
    if (!ratingModal.applicationId) return;
    if (!Number.isInteger(Number(ratingValue)) || Number(ratingValue) < 1 || Number(ratingValue) > 5) {
      toast.error('Please select a rating between 1 and 5.');
      return;
    }

    try {
      setIsRatingSaving(true);
      const token = localStorage.getItem('token');
      const res = await axios.post(
        'http://localhost:6060/api/ratings',
        {
          applicationId: ratingModal.applicationId,
          rating: Number(ratingValue),
          review: ratingReview,
          skills: ratingSkills,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        const rating = res.data.data;
        setData((prev) =>
          prev.map((item) =>
            item.id === ratingModal.applicationId
              ? {
                  ...item,
                  internRating: {
                    id: rating.id,
                    rating: Number(rating.rating || 0),
                    review: rating.review || '',
                    skills: Array.isArray(rating.skills) ? rating.skills : [],
                    createdAt: rating.createdAt || null,
                  },
                }
              : item
          )
        );
        toast.success('✓ Intern rating submitted successfully. Thank you for your feedback!');
        setRatingModal({ open: false, applicationId: null });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save rating.');
    } finally {
      setIsRatingSaving(false);
    }
  };

  /* ── Toggle star handler ── */
  const handleToggleStar = useCallback(async (applicationId) => {
    try {
      // Optimistic update
      setData((prev) =>
        prev.map((app) =>
          app.id === applicationId ? { ...app, isStarred: !app.isStarred } : app
        )
      );

      const token = localStorage.getItem('token');
      const res = await axios.patch(
        `http://localhost:6060/api/applications/${applicationId}/star`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!res.data.success) {
        // Revert on failure
        setData((prev) =>
          prev.map((app) =>
            app.id === applicationId ? { ...app, isStarred: !app.isStarred } : app
          )
        );
        toast.error('Failed to update star status.');
      }
    } catch {
      // Revert on error
      setData((prev) =>
        prev.map((app) =>
          app.id === applicationId ? { ...app, isStarred: !app.isStarred } : app
        )
      );
      toast.error('Failed to update star status.');
    }
  }, []);

  /* ── Filtered data for table ── */
  // Only show applicants for selected job
  const filteredData = useMemo(() => {
    let filtered = activePosting ? data.filter((a) => a.postingId === activePosting) : data;
    if (statusFilter !== 'all') filtered = filtered.filter((a) => a.status === statusFilter);
    if (starredFilter === 'starred') filtered = filtered.filter((a) => a.isStarred);
    
    // Sort: starred applications first, then by applied date
    return filtered.sort((a, b) => {
      // Starred first
      if (a.isStarred && !b.isStarred) return -1;
      if (!a.isStarred && b.isStarred) return 1;
      // Then by date (newest first)
      return new Date(b.appliedDate) - new Date(a.appliedDate);
    });
  }, [data, activePosting, statusFilter, starredFilter]);

  /* ── Bulk reject handler ── */
  const handleBulkReject = async () => {
    if (selectedApplicationIds.length === 0) return;
    
    try {
      setIsBulkRejecting(true);
      const token = localStorage.getItem('token');
      const reason = String(bulkRejectReason || '').trim();
      
      const res = await axios.post(
        'http://localhost:6060/api/applications/bulk-reject',
        { 
          applicationIds: selectedApplicationIds, 
          rejectionReason: reason || null 
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        // Update local state
        setData((prev) =>
          prev.map((app) =>
            selectedApplicationIds.includes(app.id)
              ? { ...app, status: 'Rejected', rejectionReason: reason }
              : app
          )
        );
        
        toast.success(res.data.message || `${selectedApplicationIds.length} applications rejected`);
        
        // Reset state
        setSelectedApplicationIds([]);
        setBulkRejectModal(false);
        setBulkRejectReason('');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reject applications. Please try again.');
    } finally {
      setIsBulkRejecting(false);
    }
  };
  
  /* ── Selection handlers ── */
  const toggleSelectAll = useCallback(() => {
    if (selectedApplicationIds.length === filteredData.length) {
      setSelectedApplicationIds([]);
    } else {
      setSelectedApplicationIds(filteredData.map(app => app.id));
    }
  }, [selectedApplicationIds.length, filteredData]);
  
  const toggleSelectApplication = useCallback((appId) => {
    setSelectedApplicationIds(prev => 
      prev.includes(appId) 
        ? prev.filter(id => id !== appId)
        : [...prev, appId]
    );
  }, []);

  /* ── Table columns ── */
  const columns = useMemo(() => [
    {
      id: 'select',
      header: () => (
        <button
          onClick={toggleSelectAll}
          className="flex items-center justify-center w-5 h-5 rounded border-2 border-gray-300 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400 transition-colors"
          title={selectedApplicationIds.length === filteredData.length ? 'Deselect all' : 'Select all'}
        >
          {selectedApplicationIds.length === filteredData.length && filteredData.length > 0 ? (
            <CheckSquare size={18} className="text-blue-600 dark:text-blue-400" />
          ) : (
            <Square size={18} className="text-gray-400" />
          )}
        </button>
      ),
      cell: ({ row }) => (
        <button
          onClick={() => toggleSelectApplication(row.original.id)}
          className="flex items-center justify-center w-5 h-5 rounded border-2 border-gray-300 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400 transition-colors"
          title={selectedApplicationIds.includes(row.original.id) ? 'Deselect' : 'Select'}
        >
          {selectedApplicationIds.includes(row.original.id) ? (
            <CheckSquare size={18} className="text-blue-600 dark:text-blue-400" />
          ) : (
            <Square size={18} className="text-gray-400" />
          )}
        </button>
      ),
    },
    {
      id: 'star',
      header: () => (
        <div className="flex items-center justify-center">
          <Star size={16} className="text-gray-400" />
        </div>
      ),
      cell: ({ row }) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleToggleStar(row.original.id);
          }}
          className="flex items-center justify-center rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          title={row.original.isStarred ? 'Remove star' : 'Star applicant'}
        >
          <Star
            size={18}
            className={row.original.isStarred ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'}
          />
        </button>
      ),
    },
    {
      accessorKey: 'studentName',
      header: 'Student',
      cell: ({ row }) => (
        <button onClick={() => setSelectedStudent(row.original)} className="flex items-center gap-3 text-left hover:opacity-80">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-blue-700 text-sm font-bold text-white">
            {row.original.studentName.split(' ').map((n) => n[0]).join('')}
          </div>
          <div className="min-w-0">
            <p className="font-medium text-gray-900 dark:text-white truncate inline-flex items-center gap-1.5">
              <span className="truncate">{row.original.studentName}</span>
              {String(row.original.companyNotes || '').trim() && (
                <StickyNote size={14} className="text-amber-500 shrink-0" />
              )}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{row.original.studentEmail}</p>
          </div>
        </button>
      ),
    },
    {
      accessorKey: 'college',
      header: 'College',
      cell: ({ row }) => (
        <div className="text-sm">
          <p className="font-medium text-gray-900 dark:text-white">{row.original.college}</p>
          <p className="text-gray-500 dark:text-gray-400 text-xs">{row.original.year}</p>
        </div>
      ),
    },
    {
      accessorKey: 'skills',
      header: 'Skills',
      cell: ({ getValue }) => {
        const skills = getValue();
        return (
          <div className="flex flex-wrap gap-1">
            {skills.slice(0, 2).map((s) => <Badge key={s} variant="outline" className="text-xs">{s}</Badge>)}
            {skills.length > 2 && <Badge variant="outline" className="text-xs">+{skills.length - 2}</Badge>}
          </div>
        );
      },
    },
    {
      accessorKey: 'appliedDate',
      header: 'Applied',
      cell: ({ getValue }) => <span className="text-sm text-gray-500 dark:text-gray-400">{formatRelativeDate(getValue())}</span>,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const c = STATUS_COLORS[row.original.status] || STATUS_COLORS['Applied'];
        return (
          <select
            value={row.original.status}
            onChange={(e) => handleStatusChange(row.original.id, e.target.value)}
            className={`rounded-md border-0 px-2 py-1 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 ${c.bg} ${c.text}`}
          >
            {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        );
      },
    },
    {
      id: 'notes',
      header: 'Notes',
      cell: ({ row }) => {
        const app = row.original;
        const isOpen = !!notesOpen[app.id];
        const status = notesSaveStatus[app.id] || 'idle';

        if (isOpen) {
          return (
            <div className="w-[220px]">
              <textarea
                autoFocus
                defaultValue={app.companyNotes || ''}
                rows={3}
                onBlur={async (e) => {
                  setNotesOpen((prev) => ({ ...prev, [app.id]: false }));
                  const nextValue = String(e.target.value || '').trim();
                  const currentValue = String(app.companyNotes || '').trim();
                  if (nextValue === currentValue) return;
                  await saveApplicationNotes(app.id, nextValue);
                }}
                className="w-full rounded-md border border-gray-300 bg-white px-2.5 py-2 text-xs text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                placeholder="Add private note..."
              />
              <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
                {status === 'saving' ? 'Saving...' : status === 'saved' ? 'Saved ✓' : status === 'error' ? 'Failed to save' : ''}
              </p>
            </div>
          );
        }

        return (
          <button
            type="button"
            onClick={() => {
              setNotesOpen((prev) => ({ ...prev, [app.id]: true }));
            }}
            className="w-[220px] rounded-md border border-dashed border-gray-300 px-2.5 py-2 text-left text-xs text-gray-500 transition hover:border-gray-400 hover:text-gray-700 dark:border-gray-600 dark:text-gray-400 dark:hover:border-gray-500 dark:hover:text-gray-200"
            title="Click to add/edit private notes"
          >
            {getNotePreview(app.companyNotes)}
          </button>
        );
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <button onClick={() => setSelectedStudent(row.original)} className="rounded-md p-2 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400" title="View Profile">
            <Eye size={16} />
          </button>
          {row.original.resume && (
            <button onClick={() => window.open(row.original.resume, '_blank')} className="rounded-md p-2 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400" title="View Resume">
              <Download size={16} />
            </button>
          )}
        </div>
      ),
    },
  ], [notesOpen, notesSaveStatus, handleStatusChange, saveApplicationNotes, selectedApplicationIds, filteredData, toggleSelectAll, toggleSelectApplication, handleToggleStar]);

  const table = useReactTable({
    data: filteredData,
    columns,
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });

  /* ── Helpers ── */
  const openPosting = (postingId) => {
    setActivePosting(postingId);
    setGlobalFilter('');
    setStatusFilter('all');
    setView('applicants');
  };
  const parseInterviewMessage = (msg) => {
    if (!msg) return { mode: '', link: '', message: '' };
    const lines = msg.split('\n');
    let mode = 'Online';
    let link = '';
    let message = '';
    
    // Parse mode
    if (lines[0] && lines[0].startsWith('Mode: ')) {
      mode = lines[0].replace('Mode: ', '').trim();
    }
    
    // Parse link
    if (lines[1] && (lines[1].startsWith('Meeting Link: ') || lines[1].startsWith('Location (Maps): '))) {
      link = lines[1].replace('Meeting Link: ', '').replace('Location (Maps): ', '').trim();
      
      // Parse message
      if (lines.length > 2) message = lines.slice(2).join('\n').trim();
    } else {
      if (lines.length > 1) message = lines.slice(1).join('\n').trim();
    }

    return { mode, link, message };
  };

  const formatDateTime = (value, includeTime = false) => {
    if (!value) return 'N/A';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);

    if (includeTime) {
      return date.toLocaleString('en-NP', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      });
    }

    return date.toLocaleDateString('en-NP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const openInterviewModal = (studentId, isEdit = false) => {
    const student = data.find(s => s.id === studentId);
    if (isEdit && student && student.interviewMessage) {
      const parsed = parseInterviewMessage(student.interviewMessage);
      setInterviewDetails({
        date: student.interviewDate || '',
        time: student.interviewTime || '',
        mode: parsed.mode || 'Online',
        link: parsed.link || '',
        message: parsed.message || '',
        isEdit: true,
      });
    } else {
      setInterviewDetails({ date: '', time: '', mode: 'Online', link: '', message: '', isEdit: false });
    }
    setShowInterviewModal(studentId);
    setSelectedStudent(null);
  };

  const goBack = () => {
    setView('jobs');
    setActivePosting(null);
    setGlobalFilter('');
    setStatusFilter('all');
  };

  /* ── Export to CSV ── */
  const exportToCSV = () => {
    setIsExporting(true);
    
    try {
      // Get the filtered data to export
      const dataToExport = filteredData;
      
      if (dataToExport.length === 0) {
        toast.error('No data to export');
        setIsExporting(false);
        return;
      }

      // CSV Headers
      const headers = [
        'Applicant Name',
        'Email',
        'Phone',
        'University',
        'Major',
        'Graduation Year',
        'Applied Job Title',
        'Application Date',
        'Current Status',
        'Resume Link'
      ];

      // CSV Rows
      const rows = dataToExport.map(app => [
        app.studentName || '',
        app.studentEmail || '',
        app.studentPhone || '',
        app.college || '',
        app.major || '',
        app.year || '',
        app.postingTitle || '',
        new Date(app.appliedDate).toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'short', 
          day: 'numeric' 
        }),
        app.status || '',
        app.resume || ''
      ]);

      // Escape CSV values (handle commas, quotes, newlines)
      const escapeCSV = (value) => {
        if (value == null) return '';
        const stringValue = String(value);
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      };

      // Build CSV string
      const csvContent = [
        headers.map(escapeCSV).join(','),
        ...rows.map(row => row.map(escapeCSV).join(','))
      ].join('\n');

      // Create Blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      
      // Generate filename with current date
      const today = new Date();
      const dateStr = today.toISOString().split('T')[0]; // YYYY-MM-DD
      const filename = `applications-${dateStr}.csv`;
      
      link.href = url;
      link.download = filename;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(`Exported ${dataToExport.length} application${dataToExport.length !== 1 ? 's' : ''} to CSV`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export CSV');
    } finally {
      setIsExporting(false);
    }
  };

  const activePostingObj = postings.find((p) => p.id === activePosting);

  /* ═══════════════════ RENDER ═══════════════════ */
  return (
    <div className="space-y-6">

      {/* ── JOB CARDS VIEW ── */}
      {view === 'jobs' && (
        <>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                Applications
              </h1>
              <p className="mt-1 text-sm sm:text-base text-gray-700 dark:text-gray-200">
                Select a job posting to view its applicants
              </p>
            </div>
          </div>

          {/* ── STATUS SUMMARY CARDS ── */}
          {!loading && (
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
              {[
                { label: 'Total', value: data.length, bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-700 dark:text-slate-200', border: 'border-slate-300 dark:border-slate-600', filter: 'all' },
                { label: 'Applied', value: data.filter(a => a.status === 'Applied').length, bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-700 dark:text-gray-200', border: 'border-gray-300 dark:border-gray-600', filter: 'Applied' },
                { label: 'Under Review', value: data.filter(a => a.status === 'Under Review').length, bg: 'bg-yellow-50 dark:bg-yellow-900/30', text: 'text-yellow-800 dark:text-yellow-300', border: 'border-yellow-300 dark:border-yellow-600', filter: 'Under Review' },
                { label: 'Shortlisted', value: data.filter(a => a.status === 'Shortlisted').length, bg: 'bg-blue-50 dark:bg-blue-900/30', text: 'text-blue-800 dark:text-blue-300', border: 'border-blue-300 dark:border-blue-600', filter: 'Shortlisted' },
                { label: 'Interview', value: data.filter(a => a.status === 'Interview Scheduled').length, bg: 'bg-purple-50 dark:bg-purple-900/30', text: 'text-purple-800 dark:text-purple-300', border: 'border-purple-300 dark:border-purple-600', filter: 'Interview Scheduled' },
                { label: 'Hired', value: data.filter(a => a.status === 'Hired').length, bg: 'bg-green-50 dark:bg-green-900/30', text: 'text-green-800 dark:text-green-300', border: 'border-green-300 dark:border-green-600', filter: 'Hired' },
                { label: 'Rejected', value: data.filter(a => a.status === 'Rejected').length, bg: 'bg-red-50 dark:bg-red-900/30', text: 'text-red-800 dark:text-red-300', border: 'border-red-300 dark:border-red-600', filter: 'Rejected' },
              ].map((card) => {
                const isActive = statusFilter === card.filter;
                return (
                  <button
                    key={card.label}
                    onClick={() => setStatusFilter(isActive && card.filter !== 'all' ? 'all' : card.filter)}
                    className={`flex flex-col items-start rounded-xl border-2 p-3 sm:p-4 transition-all duration-200 hover:shadow-md active:scale-95 ${card.bg} ${card.border} ${isActive ? 'ring-2 ring-blue-500 ring-offset-1 dark:ring-offset-slate-900' : ''}`}
                  >
                    <span className={`text-2xl sm:text-3xl font-bold leading-tight ${card.text}`}>{card.value}</span>
                    <span className={`mt-1 text-xs font-medium leading-tight ${card.text} opacity-80`}>{card.label}</span>
                  </button>
                );
              })}
            </div>
          )}

          {loading ? (
            <Card>
              <CardContent className="flex justify-center items-center py-16">
                <span className="text-gray-700 dark:text-gray-200">Loading job postings...</span>
              </CardContent>
            </Card>
          ) : postings.length === 0 ? (
            <Card>
              <CardContent>
                <EmptyState
                  icon={Briefcase}
                  title="No job postings yet"
                  description="Post an internship to start receiving applications from talented students."
                />
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {postings.map((posting) => {
                // Get real applicant count from database
                const apps = data.filter((a) => a.postingId === posting.id);
                const deadline = posting.deadline ? new Date(posting.deadline) : null;
                const daysLeft = deadline && !isNaN(deadline.getTime()) 
                  ? Math.ceil((deadline - new Date()) / (1000 * 60 * 60 * 24))
                  : null;
                return (
                  <Card key={posting.id} className="relative hover:shadow-lg transition-shadow">
                    <CardContent className="p-6 space-y-4">
                      {/* Header with Icon and Status */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-blue-50 dark:bg-blue-950">
                            {posting.CompanyProfile?.logo ? (
                              <img src={posting.CompanyProfile.logo.startsWith('http') || posting.CompanyProfile.logo.startsWith('data:') ? posting.CompanyProfile.logo : `/${posting.CompanyProfile.logo}`} alt="Logo" className="h-full w-full object-cover" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center bg-blue-600 text-lg font-bold text-white">
                                {(posting.CompanyProfile?.companyName || 'C').charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-lg text-gray-900 dark:text-white line-clamp-2 break-all" title={posting.title}>
                              {posting.title}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                              Posted {new Date(posting.postedDate || posting.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <Badge variant={statusBadgeVariants[posting.status]} className="shrink-0">
                          {posting.status}
                        </Badge>
                      </div>

                      {/* Category Badge */}
                      <div>
                        <Badge variant="outline">{posting.category}</Badge>
                      </div>

                      {/* Job Details */}
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                          <MapPin size={16} className="shrink-0" />
                          <span className="truncate">{posting.location || posting.locations?.[0] || 'Remote'}</span>
                          {posting.mode && <span className="text-gray-400">• {posting.workMode || posting.mode}</span>}
                        </div>
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                          <DollarSign size={16} className="shrink-0" />
                          <span className="font-medium text-gray-900 dark:text-white">
                          {posting.stipend != null && posting.stipend !== '' && Number(posting.stipend) > 0
                            ? formatNPR(posting.stipend)
                            : posting.isPaid
                              ? 'Paid'
                              : 'Unpaid'}
                          </span>
                        </div>
                        {deadline && (
                          <div className="flex items-center gap-2">
                            <Calendar size={16} className="shrink-0 text-gray-400" />
                            <span className={daysLeft && daysLeft < 7 ? 'text-red-600 font-medium' : 'text-gray-600 dark:text-gray-400'}>
                              {daysLeft && daysLeft > 0 ? `${daysLeft} days left` : daysLeft === 0 ? 'Today' : 'Expired'}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Stats */}
                      <div className="flex items-center gap-4 pt-2 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-2">
                          <Eye size={16} className="text-gray-400" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {Number(posting.viewCount ?? posting.views ?? 0)} views
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Inbox size={16} className="text-blue-600" />
                          <span className="text-sm font-medium text-blue-600">{apps.length} applications</span>
                        </div>
                      </div>

                      {/* Action Button */}
                      <div className="pt-2">
                        <Button
                          onClick={() => openPosting(posting.id)}
                          className="w-full bg-blue-600 text-white hover:bg-blue-700"
                        >
                          View Applicants
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ── APPLICANTS VIEW ── */}
      {view === 'applicants' && (
        <>
          {/* Header with back button and export */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                onClick={goBack}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 transition-colors"
                title="Back to jobs"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                  {activePostingObj?.title || 'Applicants'}
                </h1>
                <p className="mt-0.5 text-sm text-gray-700 dark:text-gray-200">
                  {filteredData.length} applicant{filteredData.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            
            {/* Export CSV Button */}
            <Button
              onClick={exportToCSV}
              disabled={isExporting || filteredData.length === 0}
              variant="outline"
              className="flex items-center gap-2 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <Download size={16} />
              {isExporting ? 'Exporting...' : 'Export CSV'}
            </Button>
          </div>

          {/* Starred Filter Tabs */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setStarredFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                starredFilter === 'all'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              All
              <span className="ml-1.5 opacity-75">({data.filter(a => activePosting ? a.postingId === activePosting : true).length})</span>
            </button>
            <button
              onClick={() => setStarredFilter('starred')}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all flex items-center gap-1.5 ${
                starredFilter === 'starred'
                  ? 'bg-yellow-500 text-white shadow-md'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              <Star size={14} className={starredFilter === 'starred' ? 'fill-white' : 'fill-yellow-400 text-yellow-400'} />
              Starred
              <span className="ml-1 opacity-75">
                ({data.filter(a => (activePosting ? a.postingId === activePosting : true) && a.isStarred).length})
              </span>
            </button>
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="p-4 sm:p-5">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-700 dark:text-gray-200">Filter by Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="all">All Status</option>
                    {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-700 dark:text-gray-200">Search</label>
                  <SearchWithHistory
                    historyKey="company-applications"
                    placeholder="Search by name or email..."
                    value={globalFilter ?? ''}
                    onChange={setGlobalFilter}
                    inputClassName="text-sm"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white">{filteredData.length} Application{filteredData.length !== 1 ? 's' : ''}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                {loading ? (
                  <div className="flex justify-center items-center py-12">
                    <span className="text-gray-700 dark:text-gray-200">Loading...</span>
                  </div>
                ) : filteredData.length === 0 ? (
                  <EmptyState
                    icon={Users}
                    title="No applicants found"
                    description="No students have applied to this position yet. Try sharing the job posting to reach more candidates."
                  />
                ) : (
                  <table className="w-full">
                    <thead className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                      {table.getHeaderGroups().map((hg) => (
                        <tr key={hg.id}>
                          {hg.headers.map((h) => (
                            <th key={h.id} className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-700 dark:text-gray-300">
                              {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
                            </th>
                          ))}
                        </tr>
                      ))}
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                      {table.getRowModel().rows.map((row) => (
                        <tr key={row.id} className="hover:bg-gray-50/60 dark:hover:bg-gray-800/50 transition-colors">
                          {row.getVisibleCells().map((cell) => (
                            <td key={cell.id} className="px-5 py-3.5">
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Pagination */}
              {filteredData.length > 0 && (
                <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-700 px-5 py-3.5">
                  <span className="text-sm text-gray-700 dark:text-gray-200">
                    Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}–
                    {Math.min((table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize, filteredData.length)} of {filteredData.length}
                  </span>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
                      <ChevronLeft size={16} /> Previous
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
                      Next <ChevronRight size={16} />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* ── Student Detail Modal ── */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4">
          <div className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white dark:bg-gray-900 shadow-2xl">
            {/* Sticky Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between gap-2 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-5 py-4">
              <div className="min-w-0 flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-600 text-sm font-bold text-white">
                  {selectedStudent.studentAvatar ? (
                    <img src={selectedStudent.studentAvatar} alt={selectedStudent.studentName} className="h-full w-full object-cover" />
                  ) : (
                    (selectedStudent.studentName || 'S').charAt(0).toUpperCase()
                  )}
                </div>
                <div className="min-w-0">
                  <h2 className="text-base font-bold text-gray-900 dark:text-white">Applicant Profile</h2>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">{selectedStudent.studentName}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Applied for:{' '}
                    <span className="font-medium text-gray-700 dark:text-gray-300 break-all">
                      {selectedStudent.postingTitle}
                    </span>
                  </p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {selectedStudent.openToWork && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-green-300 bg-green-50 px-2 py-0.5 text-[11px] font-semibold text-green-700 dark:border-green-700 dark:bg-green-900/30 dark:text-green-300">
                        <Briefcase size={11} />
                        Open to Work
                      </span>
                    )}
                    {selectedStudent.internRating && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700 dark:border-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                        <Star size={11} className="fill-yellow-400 text-yellow-500" />
                        Reviewed {selectedStudent.internRating.rating}/5
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button onClick={() => setSelectedStudent(null)} className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400">
                <X size={18} />
              </button>
            </div>
            {/* Split sections: Interview/Status and Actions */}
            <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-gray-100 dark:divide-gray-800">
              {/* Interview/Status Section */}
              <div className="flex-1 px-5 py-5">
                <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">Interview & Status</h3>
                <div className="mb-2">
                  {(() => { const c = STATUS_COLORS[selectedStudent.status] || STATUS_COLORS['Applied']; return <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${c.bg} ${c.text}`}>{selectedStudent.status}</span>; })()}
                  <span className="ml-2 text-xs text-gray-400 dark:text-gray-500">Applied {formatRelativeDate(selectedStudent.appliedDate)}</span>
                </div>
                {(() => {
                  const interview = parseInterviewMessage(selectedStudent.interviewMessage);
                  const hasInterviewDetails = Boolean(
                    selectedStudent.interviewDate ||
                    selectedStudent.interviewTime ||
                    interview.mode ||
                    interview.link ||
                    interview.message
                  );

                  if (!hasInterviewDetails) {
                    return (
                      <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                        No interview details available yet.
                      </p>
                    );
                  }

                  return (
                    <div className="mt-3 space-y-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/70 dark:bg-gray-800/40 p-3">
                      {selectedStudent.interviewDate && (
                        <p className="text-xs text-gray-700 dark:text-gray-300">
                          <span className="font-semibold">Interview Date:</span> {formatDateTime(selectedStudent.interviewDate)}
                        </p>
                      )}
                      {selectedStudent.interviewTime && (
                        <p className="text-xs text-gray-700 dark:text-gray-300">
                          <span className="font-semibold">Interview Time:</span> {selectedStudent.interviewTime}
                        </p>
                      )}
                      {interview.mode && (
                        <p className="text-xs text-gray-700 dark:text-gray-300">
                          <span className="font-semibold">Mode:</span> {interview.mode}
                        </p>
                      )}
                      {interview.link && (
                        <p className="text-xs text-gray-700 dark:text-gray-300 break-all">
                          <span className="font-semibold">{interview.mode === 'In-person' ? 'Location:' : 'Meeting Link:'}</span>{' '}
                          <a
                            href={interview.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-blue-600 hover:underline dark:text-blue-400"
                          >
                            {interview.link}
                          </a>
                        </p>
                      )}
                      {interview.message && (
                        <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                          <span className="font-semibold">Message:</span> {interview.message}
                        </p>
                      )}
                    </div>
                  );
                })()}
              </div>
              {/* Actions Section */}
              <div className="flex flex-col gap-4 px-5 py-5 min-w-[180px] items-start">
                <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">Actions</h3>
                {selectedStudent.resume && (
                  <a href={selectedStudent.resume} target="_blank" rel="noopener noreferrer" className="shrink-0 flex items-center gap-1.5 rounded-lg border border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/30 px-3 py-2 text-xs font-medium text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900/50 transition-colors">
                    <Download size={13} />
                    View Resume
                  </a>
                )}
                <button onClick={() => handleToggleStar(selectedStudent.id)} className="flex items-center gap-1.5 rounded-lg border border-yellow-300 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-900/30 px-3 py-2 text-xs font-medium text-yellow-700 dark:text-yellow-300 hover:bg-yellow-100 dark:hover:bg-yellow-900/50 transition-colors">
                  <Star size={13} className={selectedStudent.isStarred ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'} />
                  {selectedStudent.isStarred ? 'Bookmarked' : 'Bookmark'}
                </button>
                {canRateStatus(selectedStudent.status) && (
                  <button
                    onClick={() => openRatingModal(selectedStudent.id)}
                    className="flex items-center gap-1.5 rounded-lg border border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/30 px-3 py-2 text-xs font-medium text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                  >
                    <Star size={13} className={selectedStudent.internRating ? 'fill-yellow-400 text-yellow-500' : ''} />
                    {selectedStudent.internRating ? 'Update Review' : 'Add Review'}
                  </button>
                )}
              </div>
            </div>
            {/* ...existing code for other sections (education, skills, online presence) can follow below ... */}
            {/* EDUCATION Section */}
            {(selectedStudent.college || selectedStudent.major || selectedStudent.year) && (
              <div className="px-5 py-5">
                <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">Education</h3>
                <div className="space-y-3">
                  {selectedStudent.college && (
                    <div>
                      <p className="text-xs text-gray-400 dark:text-gray-500">University</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white mt-0.5">{selectedStudent.college}</p>
                      </div>
                    )}
                    {selectedStudent.major && (
                      <div>
                        <p className="text-xs text-gray-400 dark:text-gray-500">Major</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white mt-0.5">{selectedStudent.major}</p>
                      </div>
                    )}
                    {selectedStudent.year && (
                      <div>
                        <p className="text-xs text-gray-400 dark:text-gray-500">Graduation Year</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white mt-0.5">{selectedStudent.year}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ── CONTACT INFORMATION Section ── */}
              {(selectedStudent.studentPhone || selectedStudent.studentEmail) && (
                <div className="px-5 py-5">
                  <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">Contact Information</h3>
                  <div className="space-y-3">
                    {selectedStudent.studentPhone && (
                      <div>
                        <p className="text-xs text-gray-400 dark:text-gray-500">Phone</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white mt-0.5">{selectedStudent.studentPhone}</p>
                      </div>
                    )}
                    {selectedStudent.studentEmail && (
                      <div>
                        <p className="text-xs text-gray-400 dark:text-gray-500">Email</p>
                        <a href={`mailto:${selectedStudent.studentEmail}`} className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline mt-0.5 block">{selectedStudent.studentEmail}</a>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {selectedStudent.studentBio && (
                <div className="px-5 py-5">
                  <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">About Candidate</h3>
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                    {selectedStudent.studentBio}
                  </p>
                </div>
              )}

              {/* ── SKILLS Section ── */}
              {selectedStudent.skills.length > 0 && (
                <div className="px-5 py-5">
                  <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedStudent.skills.map(s => (
                      <span key={s} className="rounded-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-1 text-xs font-medium text-gray-700 dark:text-gray-300">{s}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* ── ONLINE PRESENCE Section ── */}
              {(selectedStudent.linkedin || selectedStudent.github || selectedStudent.portfolio) && (
                <div className="px-5 py-5">
                  <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">Online Presence</h3>
                  <div className="space-y-2">

                    {selectedStudent.linkedin && (
                      <a
                        href={selectedStudent.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 px-4 py-3 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors group"
                      >
                        {/* LinkedIn icon */}
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#0A66C2] shadow-sm">
                          <Linkedin size={18} className="text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-blue-800 dark:text-blue-200">LinkedIn</p>
                          <p className="text-xs text-blue-600 dark:text-blue-400 truncate">{selectedStudent.linkedin}</p>
                        </div>
                        <Globe size={14} className="text-blue-400 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                      </a>
                    )}

                    {selectedStudent.github && (
                      <a
                        href={selectedStudent.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-750 transition-colors group"
                      >
                        {/* GitHub icon */}
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-900 dark:bg-gray-700 shadow-sm">
                          <Github size={18} className="text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">GitHub</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{selectedStudent.github}</p>
                        </div>
                        <Globe size={14} className="text-gray-400 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                      </a>
                    )}

                    {selectedStudent.portfolio && (
                      <a
                        href={selectedStudent.portfolio}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 rounded-xl border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/20 px-4 py-3 hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors group"
                      >
                        {/* Portfolio globe icon */}
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-purple-600 shadow-sm">
                          <Globe size={18} className="text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-purple-800 dark:text-purple-200">Portfolio</p>
                          <p className="text-xs text-purple-600 dark:text-purple-400 truncate">{selectedStudent.portfolio}</p>
                        </div>
                        <Globe size={14} className="text-purple-400 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                      </a>
                    )}

                  </div>
                </div>
              )}

              {/* ── COVER LETTER Section ── */}
              <div className="px-5 py-5 border-t border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                    <FileText size={16} className="text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Cover Letter</h3>
                </div>
                <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30 p-4">
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                    {String(selectedStudent.coverLetter || '').trim() || 'No cover letter submitted by this applicant.'}
                  </p>
                </div>
              </div>

              {selectedStudent.internRating && (
                <div className="px-5 py-5">
                  <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">Internship Review</h3>
                  <div className="rounded-xl border border-amber-200 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-amber-800 dark:text-amber-300">
                        <Star size={14} className="fill-yellow-400 text-yellow-500" />
                        {selectedStudent.internRating.rating}/5
                      </span>
                      <span className="text-xs text-amber-700/80 dark:text-amber-300/80">
                        Reviewed {formatDateTime(selectedStudent.internRating.createdAt, true)}
                      </span>
                    </div>
                    {selectedStudent.internRating.review && (
                      <p className="mt-2 text-sm text-gray-700 dark:text-gray-200 leading-relaxed whitespace-pre-wrap">
                        {selectedStudent.internRating.review}
                      </p>
                    )}
                    {Array.isArray(selectedStudent.internRating.skills) && selectedStudent.internRating.skills.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {selectedStudent.internRating.skills.map((skill) => (
                          <span
                            key={skill}
                            className="rounded-full border border-amber-300 dark:border-amber-600 bg-white/80 dark:bg-amber-900/30 px-2.5 py-1 text-[11px] font-medium text-amber-800 dark:text-amber-200"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ── ACTION BUTTONS ── */}
              <div className="px-5 py-4 flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={() => { handleStatusChange(selectedStudent.id, 'Shortlisted'); setSelectedStudent(null); }}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Shortlist Candidate
                </Button>
                <Button
                  onClick={() => openInterviewModal(selectedStudent.id, selectedStudent.status === 'Interview Scheduled')}
                  variant="outline"
                  className="flex-1"
                >
                  {selectedStudent.status === 'Interview Scheduled' ? 'Edit Interview' : 'Schedule Interview'}
                </Button>
                {canRateStatus(selectedStudent.status) && (
                  <Button
                    onClick={() => openRatingModal(selectedStudent.id)}
                    variant="outline"
                    className="flex-1"
                  >
                    {selectedStudent.internRating ? (
                      <span className="inline-flex items-center gap-1.5">
                        <Star size={14} className="fill-yellow-400 text-yellow-500" />
                        Rated ✓ ({selectedStudent.internRating.rating}/5)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5">
                        <Star size={14} />
                        Rate Intern
                      </span>
                    )}
                  </Button>
                )}
              </div>

            </div>
          </div>
      )}

      {/* ── Reject Reason Modal ── */}
      {rejectModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-gray-900 shadow-2xl overflow-hidden">
            <div className="flex items-start justify-between gap-3 border-b border-gray-200 dark:border-gray-700 px-5 py-4">
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">Reject Candidate</h3>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Add a reason (optional). This will be visible to the student.
                </p>
              </div>
              <button
                onClick={() => {
                  if (isRejectSaving) return;
                  setRejectModal({ open: false, applicationId: null });
                  setRejectReason('');
                }}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <X size={18} />
              </button>
            </div>

            <div className="px-5 py-4">
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Rejection reason (optional)
              </label>
              <textarea
                rows={4}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. We needed someone with stronger React + API integration experience for this role."
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div className="flex items-center gap-3 border-t border-gray-200 dark:border-gray-700 px-5 py-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  if (isRejectSaving) return;
                  setRejectModal({ open: false, applicationId: null });
                  setRejectReason('');
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleRejectWithReason}
                disabled={isRejectSaving}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white disabled:opacity-60"
              >
                {isRejectSaving ? 'Rejecting...' : 'Confirm Reject'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Rate Intern Modal ── */}
      {ratingModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-gray-900 shadow-2xl overflow-hidden">
            <div className="flex items-start justify-between gap-3 border-b border-gray-200 dark:border-gray-700 px-5 py-4">
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">Rate Intern</h3>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Share your experience working with this intern
                </p>
              </div>
              <button
                onClick={() => {
                  if (isRatingSaving) return;
                  setRatingModal({ open: false, applicationId: null });
                }}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 px-5 py-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Rating
                </label>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setRatingValue(value)}
                      className="rounded-md p-1 hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                      <Star
                        size={22}
                        className={
                          value <= ratingValue
                            ? 'fill-yellow-400 text-yellow-500'
                            : 'text-gray-300 dark:text-gray-600'
                        }
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Review
                </label>
                <textarea
                  rows={4}
                  value={ratingReview}
                  onChange={(e) => setRatingReview(e.target.value)}
                  placeholder="Share your experience working with this intern"
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Skills
                </label>
                <div className="flex flex-wrap gap-2">
                  {RATING_SKILL_OPTIONS.map((skill) => {
                    const checked = ratingSkills.includes(skill);
                    return (
                      <button
                        key={skill}
                        type="button"
                        onClick={() => toggleRatingSkill(skill)}
                        className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                          checked
                            ? 'border-blue-600 bg-blue-50 text-blue-700 dark:border-blue-500 dark:bg-blue-900/30 dark:text-blue-300'
                            : 'border-gray-300 text-gray-600 dark:border-gray-600 dark:text-gray-300'
                        }`}
                      >
                        {skill}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 border-t border-gray-200 dark:border-gray-700 px-5 py-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setRatingModal({ open: false, applicationId: null })}
                disabled={isRatingSaving}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                onClick={handleSubmitRating}
                disabled={isRatingSaving}
              >
                {isRatingSaving ? 'Saving...' : 'Submit Rating'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Interview Modal ── */}
      {showInterviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4">
          <div className="w-full max-w-md max-h-[95vh] flex flex-col rounded-2xl bg-white dark:bg-gray-900 shadow-2xl overflow-hidden">

            {/* Sticky Header */}
            <div className="shrink-0 z-10 flex items-start sm:items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
              <div className="pr-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">
                  {interviewDetails.isEdit ? 'Edit Interview' : 'Schedule Interview'}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">The candidate will be notified by email</p>
              </div>
              <button
                onClick={() => setShowInterviewModal(null)}
                className="shrink-0 rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"
                title="Close"
              >
                <X size={20} />
              </button>
            </div>

            {/* Scrollable Form Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">

              {/* Date & Time row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Date</label>
                  <Input type="date" value={interviewDetails.date} onChange={(e) => setInterviewDetails({ ...interviewDetails, date: e.target.value })} />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Time</label>
                  <Input type="time" value={interviewDetails.time} onChange={(e) => setInterviewDetails({ ...interviewDetails, time: e.target.value })} />
                </div>
              </div>

              {/* Mode toggle */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Interview Mode</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setInterviewDetails({ ...interviewDetails, mode: 'Online', link: '' })}
                    className={`flex items-center justify-center gap-2 rounded-xl border-2 py-3 text-sm font-semibold transition-all ${
                      interviewDetails.mode === 'Online'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:border-gray-300'
                    }`}
                  >
                    <Globe size={16} />
                    Online
                  </button>
                  <button
                    type="button"
                    onClick={() => setInterviewDetails({ ...interviewDetails, mode: 'In-person', link: '' })}
                    className={`flex items-center justify-center gap-2 rounded-xl border-2 py-3 text-sm font-semibold transition-all ${
                      interviewDetails.mode === 'In-person'
                        ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
                        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:border-gray-300'
                    }`}
                  >
                    <Briefcase size={16} />
                    In-person
                  </button>
                </div>
              </div>

              {/* Dynamic link field based on mode */}
              {interviewDetails.mode === 'Online' ? (
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    <span className="flex items-center gap-1.5">
                      <Globe size={14} className="text-blue-500" />
                      Meeting Link
                      <span className="text-xs text-gray-400 font-normal">(Google Meet, Zoom, Teams...)</span>
                    </span>
                  </label>
                  <Input
                    type="url"
                    value={interviewDetails.link}
                    onChange={(e) => setInterviewDetails({ ...interviewDetails, link: e.target.value })}
                    placeholder="https://meet.google.com/xxx-xxxx-xxx"
                    className="placeholder:text-gray-400"
                  />
                </div>
              ) : (
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    <span className="flex items-center gap-1.5">
                      <Globe size={14} className="text-orange-500" />
                      Office Location (Google Maps Link)
                    </span>
                  </label>
                  <Input
                    type="url"
                    value={interviewDetails.link}
                    onChange={(e) => setInterviewDetails({ ...interviewDetails, link: e.target.value })}
                    placeholder="https://maps.google.com/?q=your+office+address"
                    className="placeholder:text-gray-400"
                  />
                  <p className="mt-1 text-xs text-gray-400">Share a Google Maps link so the candidate can find the office easily.</p>
                </div>
              )}

              {/* Optional message */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Additional Message
                  <span className="ml-1 text-xs text-gray-400 font-normal">(Optional)</span>
                </label>
                <textarea
                  value={interviewDetails.message}
                  onChange={(e) => setInterviewDetails({ ...interviewDetails, message: e.target.value })}
                  rows={3}
                  placeholder={interviewDetails.mode === 'Online'
                    ? 'e.g. Please join 5 minutes early. Have your portfolio ready...'
                    : 'e.g. Ask for John at the reception. Bring a printed resume...'}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="sticky bottom-0 mt-4 -mx-5 -mb-5 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 p-5 pt-4">
                <div className="flex gap-3">
                  <Button
                    onClick={() => setShowInterviewModal(null)}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleScheduleInterview}
                    disabled={!interviewDetails.date || !interviewDetails.time}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
                  >
                    {interviewDetails.isEdit ? 'Save Changes' : 'Send Invite'}
                  </Button>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ── Floating Action Bar (Bulk Actions) ── */}
      {selectedApplicationIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 animate-in slide-in-from-bottom-5 duration-300">
          <div className="flex items-center gap-3 rounded-full border-2 border-blue-500 bg-white dark:bg-gray-900 px-6 py-3 shadow-2xl">
            <span className="text-sm font-semibold text-gray-900 dark:text-white">
              {selectedApplicationIds.length} selected
            </span>
            <div className="h-5 w-px bg-gray-300 dark:bg-gray-600" />
            <Button
              onClick={() => setBulkRejectModal(true)}
              size="sm"
              className="bg-red-600 hover:bg-red-700 text-white font-semibold flex items-center gap-2"
            >
              <Trash2 size={16} />
              Reject Selected
            </Button>
            <Button
              onClick={() => setSelectedApplicationIds([])}
              size="sm"
              variant="outline"
              className="font-semibold"
            >
              Clear
            </Button>
          </div>
        </div>
      )}

      {/* ── Bulk Reject Confirmation Modal ── */}
      {bulkRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-gray-900 shadow-2xl">
            <div className="flex items-start justify-between border-b border-gray-200 dark:border-gray-700 px-5 py-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  Reject {selectedApplicationIds.length} applicant{selectedApplicationIds.length !== 1 ? 's' : ''}?
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  They will be notified by email
                </p>
              </div>
              <button
                onClick={() => {
                  if (isBulkRejecting) return;
                  setBulkRejectModal(false);
                  setBulkRejectReason('');
                }}
                className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400"
                title="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="px-5 py-4">
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Rejection reason (optional)
              </label>
              <textarea
                rows={4}
                value={bulkRejectReason}
                onChange={(e) => setBulkRejectReason(e.target.value)}
                placeholder="e.g. We are moving forward with candidates whose experience more closely matches our requirements."
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                This reason will be included in the rejection email sent to all selected candidates.
              </p>
            </div>

            <div className="flex items-center gap-3 border-t border-gray-200 dark:border-gray-700 px-5 py-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  if (isBulkRejecting) return;
                  setBulkRejectModal(false);
                  setBulkRejectReason('');
                }}
                disabled={isBulkRejecting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleBulkReject}
                disabled={isBulkRejecting}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white disabled:opacity-60"
              >
                {isBulkRejecting ? 'Rejecting...' : `Reject ${selectedApplicationIds.length}`}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Applications;
