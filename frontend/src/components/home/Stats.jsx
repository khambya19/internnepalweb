import React, { useEffect, useState } from "react";
import { Building2, FileText, ShieldCheck, BriefcaseBusiness } from "lucide-react";
import api from "../../services/api";

const Stats = () => {
  const [statsData, setStatsData] = useState({
    activeJobs: 0,
    totalCompanies: 0,
    totalApplications: 0,
    averageCompanyRating: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchLandingStats = async () => {
      try {
        const res = await api.get("/jobs/landing-stats");
        if (isMounted && res.data?.success) {
          setStatsData({
            activeJobs: Number(res.data.data?.activeJobs || 0),
            totalCompanies: Number(res.data.data?.totalCompanies || 0),
            totalApplications: Number(res.data.data?.totalApplications || 0),
            averageCompanyRating:
              typeof res.data.data?.averageCompanyRating === "number"
                ? res.data.data.averageCompanyRating
                : null,
          });
        }
      } catch {
        // keep safe defaults
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchLandingStats();
    return () => {
      isMounted = false;
    };
  }, []);

  const numberFormatter = new Intl.NumberFormat("en-IN");
  const stats = [
    {
      number: loading ? "..." : numberFormatter.format(statsData.activeJobs),
      label: "Active Internships",
      icon: BriefcaseBusiness,
      iconClass: "text-blue-600",
    },
    {
      number: loading ? "..." : numberFormatter.format(statsData.totalCompanies),
      label: "Hiring Companies",
      icon: Building2,
      iconClass: "text-cyan-600",
    },
    {
      number: loading ? "..." : numberFormatter.format(statsData.totalApplications),
      label: "Applications Submitted",
      icon: FileText,
      iconClass: "text-violet-600",
    },
    {
      number:
        loading
          ? "..."
          : statsData.averageCompanyRating !== null
          ? `${statsData.averageCompanyRating}/5`
          : "N/A",
      label: "Avg Company Rating",
      icon: ShieldCheck,
      iconClass: "text-emerald-600",
    },
  ];

  return (
    <section className="bg-slate-50 py-16 px-4 dark:bg-slate-950 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="rounded-xl border border-slate-200 bg-white p-5 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900"
            >
              <stat.icon className={`mx-auto mb-2 h-6 w-6 ${stat.iconClass}`} />
              <p className="mb-2 text-3xl font-extrabold text-blue-600 sm:text-4xl">{stat.number}</p>
              <p className="text-sm text-slate-600 dark:text-slate-300 sm:text-base">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Stats;
