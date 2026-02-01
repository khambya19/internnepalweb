import React, { useEffect, useState } from 'react';
import { Flag, Clock, CheckCircle2, XCircle, AlertCircle, User, Mail } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { formatRelativeDate } from '../../../../lib/utils';

const ReportedJobs = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:6060/api/company/reports', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.success) {
          setReports(res.data.data);
        }
      } catch {
        toast.error('Failed to load reported jobs');
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock size={18} className="text-amber-500" />;
      case 'reviewed':
        return <CheckCircle2 size={18} className="text-green-500" />;
      case 'dismissed':
        return <XCircle size={18} className="text-red-500" />;
      default:
        return <AlertCircle size={18} className="text-gray-500" />;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300';
      case 'reviewed':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
      case 'dismissed':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  return (
    <div className="w-full space-y-4 min-w-0">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Flag size={24} className="text-red-500" />
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            Reported Jobs
          </h1>
        </div>
        <p className="text-sm text-gray-700 dark:text-gray-200">
          Track reports submitted for your job postings and see admin actions.
        </p>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400 text-sm">Loading reports...</p>
          </div>
        </div>
      ) : reports.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-xl p-12 text-center border border-slate-200 dark:border-gray-800 shadow-sm">
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={32} />
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No Reports</h3>
          <p className="text-gray-700 dark:text-gray-300">
            None of your job postings have been reported. Great job maintaining quality postings!
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-gray-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-gray-300 font-medium border-b border-slate-200 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-3 text-xs uppercase tracking-wider">Job Title</th>
                  <th className="px-6 py-3 text-xs uppercase tracking-wider">Reported By</th>
                  <th className="px-6 py-3 text-xs uppercase tracking-wider">Reason</th>
                  <th className="px-6 py-3 text-xs uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-xs uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-gray-800">
                {reports.map((report) => (
                  <tr key={report.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {report.Job?.title || 'Job Deleted'}
                        </div>
                        {report.Job?.type && (
                          <div className="text-xs text-gray-600 dark:text-gray-400">
                            {report.Job.type}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1 text-sm">
                        <div className="flex items-center gap-2 text-gray-900 dark:text-white">
                          <User size={14} />
                          <span>{report.User?.name || 'Anonymous'}</span>
                        </div>
                        {report.User?.email && (
                          <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                            <Mail size={14} />
                            <span>{report.User.email}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-700 dark:text-gray-300 max-w-xs">
                        <div className="font-medium capitalize mb-1">{report.reason}</div>
                        {report.description && (
                          <div className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                            {report.description}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {formatRelativeDate(report.createdAt)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(report.status)}
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${getStatusBadge(report.status)}`}>
                          {report.status}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Legend */}
      {reports.length > 0 && (
        <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 border border-slate-200 dark:border-gray-800">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Status Information:</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-amber-500" />
              <span className="text-gray-600 dark:text-gray-400"><strong>Pending:</strong> Under admin review</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-green-500" />
              <span className="text-gray-600 dark:text-gray-400"><strong>Reviewed:</strong> Admin has reviewed the report</span>
            </div>
            <div className="flex items-center gap-2">
              <XCircle size={16} className="text-red-500" />
              <span className="text-gray-600 dark:text-gray-400"><strong>Dismissed:</strong> Report was dismissed</span>
            </div>
          </div>
          <div className="mt-3 text-xs text-gray-600 dark:text-gray-400">
            <strong>Note:</strong> If a report is reviewed and your job posting violates our policies, it may be removed by the admin.
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportedJobs;
