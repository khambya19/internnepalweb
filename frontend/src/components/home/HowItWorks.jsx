import React from "react";
import { BarChart3, FileSearch, Send, ShieldAlert } from "lucide-react";

const steps = [
  {
    icon: FileSearch,
    title: "Browse Live Ads",
    description:
      "Explore active internships posted by companies, with latest listings shown first.",
    color: "text-blue-600",
  },
  {
    icon: Send,
    title: "Apply in Seconds",
    description:
      "Open a role, review details, and submit your application directly through the platform.",
    color: "text-cyan-600",
  },
  {
    icon: BarChart3,
    title: "Track Progress",
    description:
      "Monitor your status changes from Applied to Interview and final decisions in one place.",
    color: "text-violet-600",
  },
  {
    icon: ShieldAlert,
    title: "Report Suspicious Posts",
    description:
      "If something looks wrong, report it and the admin team can review it quickly.",
    color: "text-rose-600",
  },
];

const HowItWorks = () => {
  return (
    <section className="bg-white px-4 py-20 dark:bg-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-14 text-center">
          <h2 className="mb-4 text-3xl font-extrabold text-slate-900 dark:text-white sm:text-4xl md:text-5xl">
            How InternNepal <span className="text-blue-600">Works</span>
          </h2>
          <p className="mx-auto max-w-2xl text-sm text-slate-600 dark:text-slate-300 sm:text-base">
            A simple workflow for students and companies, built around real-time job and application data.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div
                key={step.title}
                className="rounded-xl border border-slate-200 bg-slate-50 p-6 shadow-sm transition hover:border-slate-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-900"
              >
                <div className="mb-4 flex items-center justify-between">
                  <Icon className={`h-8 w-8 ${step.color}`} />
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                    {index + 1}
                  </span>
                </div>
                <h3 className="mb-2 text-lg font-bold text-slate-900 dark:text-white">{step.title}</h3>
                <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                  {step.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
