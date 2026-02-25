import React from "react";
import {
  Building2,
  CheckCircle2,
  ShieldCheck,
  UserRound,
  UsersRound,
  Workflow,
} from "lucide-react";

const blocks = [
  {
    icon: UserRound,
    iconClass: "text-blue-600",
    title: "Student Journey",
    points: [
      "Create a complete profile with skills and projects.",
      "Apply to roles that match your learning goals.",
      "Track your application status from one dashboard.",
    ],
  },
  {
    icon: Building2,
    iconClass: "text-cyan-600",
    title: "Company Workflow",
    points: [
      "Post internships with clear role expectations.",
      "Review incoming applicants in one organized pipeline.",
      "Shortlist and manage hiring decisions efficiently.",
    ],
  },
  {
    icon: ShieldCheck,
    iconClass: "text-violet-600",
    title: "Platform Standards",
    points: [
      "Role-based access for students, companies, and admins.",
      "Report handling for suspicious or incorrect listings.",
      "Structured processes designed for reliable hiring.",
    ],
  },
];

const Testimonials = () => {
  return (
    <section className="bg-slate-50 px-4 py-20 dark:bg-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-14 text-center">
          <h2 className="mb-4 text-3xl font-extrabold text-slate-900 dark:text-white sm:text-4xl md:text-5xl">
            Student & Company <span className="text-blue-600">Playbook</span>
          </h2>
          <p className="mx-auto max-w-2xl text-sm text-slate-600 dark:text-slate-300 sm:text-base">
            A clear structure for how candidates and employers move through InternNepal.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {blocks.map((block) => {
            const Icon = block.icon;
            return (
              <div
                key={block.title}
                className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900"
              >
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-800">
                  <Icon className={`h-6 w-6 ${block.iconClass}`} />
                </div>
                <h3 className="mb-4 text-lg font-bold text-slate-900 dark:text-white">{block.title}</h3>
                <ul className="space-y-3">
                  {block.points.map((point) => (
                    <li
                      key={point}
                      className="inline-flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300"
                    >
                      <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-emerald-600" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
          <UsersRound size={14} className="text-blue-600" />
          <Workflow size={14} className="text-cyan-600" />
          Structured hiring flow with clear accountability
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
