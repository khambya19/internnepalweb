import React from "react";
import {
  BadgeCheck,
  Bookmark,
  BriefcaseBusiness,
  Building2,
  ClipboardList,
  Flag,
  Search,
} from "lucide-react";

const features = [
  {
    icon: Search,
    iconClass: "text-blue-600",
    title: "Focused Search",
    description: "Filter opportunities by role, skills, location, and work mode.",
  },
  {
    icon: ClipboardList,
    iconClass: "text-cyan-600",
    title: "Application Tracking",
    description: "Follow your status clearly from application to final decision.",
  },
  {
    icon: Bookmark,
    iconClass: "text-violet-600",
    title: "Saved Opportunities",
    description: "Bookmark relevant roles and revisit them when you are ready.",
  },
  {
    icon: Building2,
    iconClass: "text-emerald-600",
    title: "Company Workspaces",
    description: "Employers can manage listings, candidates, and hiring updates.",
  },
  {
    icon: BriefcaseBusiness,
    iconClass: "text-amber-500",
    title: "Internship-first Design",
    description: "Built around student internships and early-career hiring flow.",
  },
  {
    icon: Flag,
    iconClass: "text-rose-600",
    title: "Report & Review",
    description: "Users can report problematic posts for admin moderation.",
  },
  {
    icon: BadgeCheck,
    iconClass: "text-indigo-600",
    title: "Role-based Access",
    description: "Student, company, and admin experiences are separated by permissions.",
  },
];

const Features = () => {
  return (
    <section className="bg-blue-50 px-4 py-20 dark:bg-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-3xl font-extrabold text-gray-900 dark:text-white sm:text-4xl md:text-5xl">
            Platform <span className="text-blue-600">Highlights</span>
          </h2>
          <p className="mx-auto max-w-3xl text-sm text-slate-600 dark:text-slate-300 sm:text-base">
            Core capabilities available across InternNepal today.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="rounded-xl border border-slate-200 bg-white p-8 shadow-lg transition hover:-translate-y-1 hover:shadow-xl dark:border-slate-700 dark:bg-slate-900"
              >
                <div className="mb-4">
                  <Icon className={`h-8 w-8 ${feature.iconClass}`} />
                </div>
                <h3 className="mb-3 text-xl font-bold text-gray-900 dark:text-white">
                  {feature.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-slate-300">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Features;
