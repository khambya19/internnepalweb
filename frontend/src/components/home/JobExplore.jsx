import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import api from "../../services/api";
import JobCard from "../JobCard";
import { AuthContext } from "../../context/authContext";
import { formatFullDate, getDaysLeft, timeAgo } from "../../utils/dateUtils";

const JobExplore = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});
  const [savedJobIds, setSavedJobIds] = useState([]);
  const [appliedJobIds, setAppliedJobIds] = useState([]);

  useEffect(() => {
    let isMounted = true;

    const fetchJobs = async () => {
      try {
        const res = await api.get("/jobs", { params: { sortBy: "newest" } });
        if (!isMounted || !res.data?.success) return;

        const mapped = (res.data.data || [])
          .map((job) => ({
            id: job.id,
            title: job.title,
            companyId: job.company?.id || null,
            company: job.company?.companyName || "",
            logo: job.company?.logo || null,
            companyInitial: (job.company?.companyName || "C").charAt(0).toUpperCase(),
            companyResponseRate: job.company?.responseRate || null,
            location:
              Array.isArray(job.locations) && job.locations.length > 0
                ? job.locations.join(", ")
                : job.location || job.company?.location || "",
            stipend: job.stipend || null,
            isPaid: job.isPaid,
            category: job.category || null,
            experienceLevel: job.experienceLevel || null,
            workMode: job.workMode || null,
            locations: Array.isArray(job.locations) ? job.locations : [],
            perks: Array.isArray(job.perks) ? job.perks : [],
            type: job.type || null,
            deadline: job.deadline || null,
            createdAt: job.createdAt,
            viewCount: Number(job.viewCount ?? job.views ?? 0),
            applicationsCount: job.applicationsCount || 0,
            applicantCount: Number(job.applicantCount ?? job.applicationsCount ?? 0),
            hiringPaused: job.hiringPaused || false,
          }))
          .slice(0, 3);

        setJobs(mapped);
      } catch {
        if (isMounted) setJobs([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchJobs();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    const fetchStudentMeta = async () => {
      if (user?.role !== "student") return;
      try {
        const [savedRes, appliedRes] = await Promise.all([
          api.get("/student/saved-jobs"),
          api.get("/applications/my-applications"),
        ]);

        if (!isMounted) return;
        if (savedRes.data?.success) {
          setSavedJobIds((savedRes.data.data || []).map((item) => item.jobId));
        }
        if (appliedRes.data?.success) {
          const ids = (appliedRes.data.data || [])
            .map((app) => app.jobId || app.Job?.id)
            .filter(Boolean);
          setAppliedJobIds(Array.from(new Set(ids)));
        }
      } catch (err) {
        // Silently handle profile incomplete - expected for new users
        if (err?.response?.data?.code !== 'PROFILE_INCOMPLETE') {
          console.error('Error fetching student metadata:', err);
        }
      }
    };

    fetchStudentMeta();
    return () => {
      isMounted = false;
    };
  }, [user]);

  const openJobDetails = (jobId) => {
    navigate(`/student/job/${jobId}`);
  };

  const openCompanyProfile = (companyId) => {
    if (!companyId) return;
    navigate(`/student/company/${companyId}`);
  };

  const handleApply = async (job) => {
    if (!user) {
      navigate("/login");
      return;
    }
    if (user.role !== "student") {
      toast.error("Please log in as a student to apply.");
      return;
    }
    if (appliedJobIds.includes(job.id)) {
      toast.info("You already applied for this job.");
      return;
    }

    try {
      setActionLoading((prev) => ({ ...prev, [job.id]: true }));
      await api.post(`/applications/${job.id}`, {});
      setAppliedJobIds((prev) => [...prev, job.id]);
      toast.success("✓ Application submitted successfully! Track your progress in My Applications.");
    } catch (error) {
      const message = error.response?.data?.message || "Failed to apply.";
      toast.error(message);
    } finally {
      setActionLoading((prev) => ({ ...prev, [job.id]: false }));
    }
  };

  const handleToggleSave = async (jobId) => {
    if (!user) {
      navigate("/login");
      return;
    }
    if (user.role !== "student") {
      toast.error("Please log in as a student to save jobs.");
      return;
    }

    const isSaved = savedJobIds.includes(jobId);
    try {
      setActionLoading((prev) => ({ ...prev, [`save-${jobId}`]: true }));
      if (isSaved) {
        await api.delete(`/student/saved-jobs/${jobId}`);
        setSavedJobIds((prev) => prev.filter((id) => id !== jobId));
        toast.success("Job removed from your saved list.");
      } else {
        await api.post(`/student/saved-jobs/${jobId}`, {});
        setSavedJobIds((prev) => [...prev, jobId]);
        toast.success("✓ Job saved successfully! Find it in your Saved Jobs.");
      }
    } catch {
      toast.error("Failed to update saved jobs.");
    } finally {
      setActionLoading((prev) => ({ ...prev, [`save-${jobId}`]: false }));
    }
  };

  const content = (() => {
    if (loading) {
      return (
        <div className="col-span-full rounded-lg border border-slate-200 bg-slate-50 p-8 text-center dark:border-slate-700 dark:bg-slate-900">
          <p className="text-sm text-slate-600 dark:text-slate-300">Loading latest ads...</p>
        </div>
      );
    }

    if (jobs.length === 0) {
      return (
        <div className="col-span-full rounded-lg border border-slate-200 bg-slate-50 p-8 text-center dark:border-slate-700 dark:bg-slate-900">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            No live ads found right now.
          </p>
        </div>
      );
    }

    return jobs.map((job) => {
      const daysLeft = getDaysLeft(job.deadline);
      return (
        <JobCard
          key={job.id}
          job={job}
          appliedJobIds={appliedJobIds}
          isSaved={savedJobIds.includes(job.id)}
          isApplying={!!actionLoading[job.id]}
          isSaving={!!actionLoading[`save-${job.id}`]}
          daysLeft={daysLeft}
          postedAgo={timeAgo(job.createdAt)}
          postedFullDate={formatFullDate(job.createdAt)}
          onOpenDetails={() => openJobDetails(job.id)}
          onOpenCompany={() => openCompanyProfile(job.companyId)}
          onOpenApply={() => handleApply(job)}
          onToggleSave={() => handleToggleSave(job.id)}
        />
      );
    });
  })();

  return (
    <section className="bg-white py-20 px-4 dark:bg-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-3xl font-extrabold text-gray-900 dark:text-white sm:text-4xl md:text-5xl">
            Start Exploring <span className="text-blue-600">Latest 3 Live Ads</span>
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-gray-600 dark:text-slate-300">
            These are the newest active internship ads from the database.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 md:gap-6">
          {content}
        </div>
      </div>
    </section>
  );
};

export default JobExplore;
