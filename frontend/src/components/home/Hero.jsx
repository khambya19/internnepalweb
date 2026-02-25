import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Bot,
  Building2,
  Gem,
  MapPin,
  Play,
  Rocket,
  ShieldCheck,
  Sparkles,
  Users,
  Wallet,
} from "lucide-react";
import api from "../../services/api";

const sideCardConfigs = [
  {
    container:
      "absolute left-0 top-10 w-48 -rotate-12 rounded-2xl border-2 border-white/80 bg-violet-600/10 p-4 shadow-xl transition duration-300 hover:-translate-y-4 dark:border-slate-700 md:left-20 md:w-56",
    bubble: "bg-violet-600/20 text-violet-700 dark:text-violet-300",
    button: "bg-violet-600 hover:bg-violet-700",
    FallbackIcon: Rocket,
  },
  {
    container:
      "absolute left-10 top-4 z-10 w-48 -rotate-6 rounded-2xl border-2 border-white/80 bg-cyan-500/10 p-4 shadow-xl transition duration-300 hover:-translate-y-4 dark:border-slate-700 md:left-48 md:w-56",
    bubble: "bg-cyan-500/20 text-cyan-700 dark:text-cyan-300",
    button: "bg-cyan-500 hover:bg-cyan-600",
    FallbackIcon: Sparkles,
  },
  {
    container:
      "absolute right-10 top-4 z-10 w-48 rotate-6 rounded-2xl border-2 border-white/80 bg-violet-600/10 p-4 shadow-xl transition duration-300 hover:-translate-y-4 dark:border-slate-700 md:right-48 md:w-56",
    bubble: "bg-violet-600/20 text-violet-700 dark:text-violet-300",
    button: "bg-violet-600 hover:bg-violet-700",
    FallbackIcon: ShieldCheck,
  },
  {
    container:
      "absolute right-0 top-10 w-48 rotate-12 rounded-2xl border-2 border-white/80 bg-blue-600/10 p-4 shadow-xl transition duration-300 hover:-translate-y-4 dark:border-slate-700 md:right-20 md:w-56",
    bubble: "bg-blue-600/20 text-blue-700 dark:text-blue-300",
    button: "bg-blue-600 hover:bg-blue-700",
    FallbackIcon: Gem,
  },
];

const getLocationLabel = (job) =>
  job?.workMode ||
  (Array.isArray(job?.locations) && job.locations.length ? job.locations[0] : "") ||
  job?.location ||
  job?.company?.location ||
  job?.CompanyProfile?.location ||
  "On-site";

const getCompanyName = (job) =>
  job?.company?.companyName || job?.CompanyProfile?.companyName || "";

const getCompensationLabel = (job) => {
  const stipend = Number(job?.stipend || 0);
  if (stipend > 0) return `रू ${stipend.toLocaleString("en-IN")} /month`;

  const salaryNumeric = Number(job?.salary);
  if (Number.isFinite(salaryNumeric) && String(job?.salary || "").trim() !== "") {
    return `रू ${salaryNumeric.toLocaleString("en-IN")} /month`;
  }

  if (job?.salary) return String(job.salary);
  if (job?.isPaid === false) return "Unpaid";
  return "Compensation not specified";
};

const Hero = () => {
  const navigate = useNavigate();
  const sectionRef = useRef(null);
  const [jobs, setJobs] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(true);

  useEffect(() => {
    const section = sectionRef.current;
    if (section) section.classList.add("fade-in-hero");
  }, []);

  useEffect(() => {
    let isMounted = true;

    const fetchHeroJobs = async () => {
      try {
        const res = await api.get("/jobs", { params: { sortBy: "newest" } });
        if (!isMounted || !res.data?.success) return;
        setJobs((res.data.data || []).slice(0, 5));
      } catch {
        if (isMounted) setJobs([]);
      } finally {
        if (isMounted) setLoadingJobs(false);
      }
    };

    fetchHeroJobs();
    return () => {
      isMounted = false;
    };
  }, []);

  const featuredJobs = useMemo(() => {
    if (jobs.length === 0) return [];
    if (jobs.length >= 5) return jobs.slice(0, 5);

    // Reuse available real jobs so hero cards stay populated.
    const repeated = [];
    for (let index = 0; index < 5; index += 1) {
      repeated.push(jobs[index % jobs.length]);
    }
    return repeated;
  }, [jobs]);
  const mainJob = featuredJobs[0] || null;
  const sideJobs = featuredJobs.slice(1, 5);

  return (
    <section
      ref={sectionRef}
      className="relative flex min-h-screen flex-col justify-center overflow-hidden bg-slate-50 pb-20 pt-32 opacity-0 dark:bg-slate-950"
    >
      <div className="absolute left-10 top-20 h-20 w-20 rounded-full bg-violet-600 opacity-30 blur-2xl" />
      <div className="absolute right-20 top-40 h-32 w-32 rounded-full bg-blue-600 opacity-30 blur-3xl" />
      <div className="absolute bottom-10 left-1/3 h-40 w-40 rounded-full bg-cyan-500 opacity-20 blur-3xl" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
        <h1 className="mb-8 text-4xl font-extrabold leading-tight text-slate-900 dark:text-white sm:text-5xl md:text-7xl">
          Smart Hiring{" "}
          <span className="inline-flex -translate-y-1 align-middle">
            <Bot className="h-8 w-8 text-blue-600 dark:text-blue-400 sm:h-10 sm:w-10" />
          </span>{" "}
          Solutions for
          <br />
          Your{" "}
          <span className="inline-flex -translate-y-1 align-middle">
            <Users className="h-8 w-8 text-cyan-600 dark:text-cyan-400 sm:h-10 sm:w-10" />
          </span>{" "}
          Growing Needs
        </h1>

        <p className="mx-auto mb-10 max-w-2xl text-xl text-slate-600 dark:text-slate-300">
          InternNepal blends intelligent{" "}
          <span className="font-bold text-cyan-600 dark:text-cyan-400">technology</span> with
          professional hiring workflows to help companies and students connect faster.
        </p>

        <div className="mb-20 flex w-full flex-col items-center justify-center gap-4 sm:flex-row">
          <button
            className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-8 py-4 text-base font-bold text-white shadow-lg transition hover:-translate-y-1 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 md:text-lg"
            onClick={() => navigate("/login")}
          >
            Get Started
            <ArrowRight size={18} />
          </button>
          <button className="inline-flex items-center gap-2 rounded-full bg-cyan-500 px-8 py-4 text-base font-bold text-white shadow-lg transition hover:-translate-y-1 hover:bg-cyan-600 focus:outline-none focus:ring-2 focus:ring-cyan-500 md:text-lg">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white">
              <Play size={12} fill="white" />
            </div>
            Watch Demo
          </button>
        </div>

        <div className="perspective-1000 relative mx-auto h-64 max-w-4xl md:h-80">
          {sideCardConfigs.map((config, index) => {
            const job = sideJobs[index] || null;
            const badgeText = job ? getLocationLabel(job) : loadingJobs ? "Loading..." : "No ad";
            const labelText = job
              ? getCompensationLabel(job)
              : loadingJobs
              ? "Loading salary..."
              : "No compensation";
            const Icon = config.FallbackIcon;

            return (
              <div key={`hero-side-card-${index}`} className={config.container}>
                <div className="mb-3 flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full ${config.bubble}`}
                  >
                    {getCompanyName(job) ? (
                      <span className="text-sm font-bold">
                        {getCompanyName(job).charAt(0).toUpperCase()}
                      </span>
                    ) : (
                      <Icon size={16} />
                    )}
                  </div>
                  <div className="min-w-0 text-left">
                    <p
                      className="truncate text-xs font-bold text-slate-900 dark:text-slate-100"
                      title={job?.title || ""}
                    >
                      {job?.title || (loadingJobs ? "Loading role..." : "No active ad")}
                    </p>
                    <p
                      className="truncate text-[11px] text-slate-600 dark:text-slate-300"
                      title={getCompanyName(job)}
                    >
                      {getCompanyName(job) || (loadingJobs ? "Please wait" : "Try again later")}
                    </p>
                  </div>
                </div>
                <div className="mb-2 flex items-center gap-1 truncate rounded bg-white/60 px-2 py-1 text-left text-[11px] text-slate-700 dark:bg-slate-800/60 dark:text-slate-300">
                  <MapPin size={12} className="shrink-0" />
                  <span>{badgeText}</span>
                </div>
                <div className="mb-2 flex items-center gap-1 truncate rounded bg-white/60 px-2 py-1 text-left text-[11px] text-slate-700 dark:bg-slate-800/60 dark:text-slate-300">
                  <Wallet size={12} className="shrink-0" />
                  <span>{labelText}</span>
                </div>
                <button
                  type="button"
                  disabled={!job}
                  onClick={() => navigate(`/student/job/${job.id}`)}
                  className={`mt-2 flex h-8 w-full items-center justify-center rounded-lg text-xs font-bold text-white transition ${config.button} disabled:cursor-not-allowed disabled:opacity-60`}
                >
                  {job ? "Apply" : "Unavailable"}
                </button>
              </div>
            );
          })}

          <div className="absolute -top-6 left-0 right-0 z-20 mx-auto w-56 rounded-3xl border-2 border-cyan-500 bg-white p-5 shadow-2xl transition duration-300 hover:scale-105 dark:bg-slate-900 md:w-64">
            <div className="mb-4 flex items-start justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-300">
                {getCompanyName(mainJob) ? (
                  <span className="text-xl font-bold">
                    {getCompanyName(mainJob).charAt(0).toUpperCase()}
                  </span>
                ) : (
                  <Building2 size={24} />
                )}
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-cyan-500/10 px-2 py-1 text-xs font-bold text-cyan-500">
                <MapPin size={12} />
                {mainJob ? getLocationLabel(mainJob) : loadingJobs ? "Loading..." : "No Ads"}
              </span>
            </div>

            <h3 className="text-left text-lg font-bold text-slate-900 dark:text-slate-100" title={mainJob?.title || ""}>
              {mainJob?.title || (loadingJobs ? "Loading featured ad..." : "No active ads yet")}
            </h3>
            <p
              className="mb-2 truncate text-left text-sm text-slate-500 dark:text-slate-400"
              title={getCompanyName(mainJob)}
            >
              {getCompanyName(mainJob) || (loadingJobs ? "Please wait" : "Post a job to appear here")}
            </p>
            <p className="mb-4 inline-flex items-center gap-1 text-left text-xs font-semibold text-blue-600">
              <Wallet size={12} />
              {mainJob ? getCompensationLabel(mainJob) : loadingJobs ? "Loading compensation..." : "No compensation data"}
            </p>
            <div className="mb-4 flex -space-x-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-slate-50 text-[10px] font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                >
                  {getCompanyName(mainJob)?.charAt(0)?.toUpperCase() || "IN"}
                </div>
              ))}
            </div>
            <button
              type="button"
              disabled={!mainJob}
              onClick={() => navigate(`/student/job/${mainJob.id}`)}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Apply Now
              <ArrowRight size={14} />
            </button>
          </div>
        </div>

        <div className="mt-10 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-xs font-semibold text-slate-600 shadow-sm dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-300">
          <Sparkles size={14} className="text-blue-600" />
          Live ad data updates from active company listings
        </div>
      </div>
    </section>
  );
};

export default Hero;
