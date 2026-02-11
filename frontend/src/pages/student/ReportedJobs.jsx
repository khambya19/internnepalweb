import React, { useEffect, useState, useContext } from 'react';
import StudentLayout from '../../components/layout/StudentLayout';
import { AuthContext } from '../../context/authContext';
import { Flag, Clock, CheckCircle2, XCircle, AlertCircle, Building2, MapPin, Trash2 } from 'lucide-react';
import api from '../../services/api';
import { toast } from 'sonner';
import { formatRelativeDate } from '../../lib/utils';

const ReportedJobs = () => {
  const { user } = useContext(AuthContext);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true);
        const res = await api.get('/reports/my-reports');
        if (res.data.success) {
          setReports(res.data.data);
        }
      } catch {
        toast.error('Failed to load your reported jobs');
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

  const handleUnreport = async (reportId) => {
    if (!window.confirm('Are you sure you want to unreport this job? This action cannot be undone.')) {
      return;
    }

    try {
      const res = await api.delete(`/reports/my-reports/${reportId}`);
      if (res.data.success) {
        toast.success('Report removed successfully');
        // Remove the report from the list
        setReports(reports.filter(r => r.id !== reportId));
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to remove report');
    }
  };

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
    <StudentLayout user={user}>
      <div className="w-full space-y-4 min-w-0">
        {/* Header */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Flag size={24} className="text-red-500" />
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Reported Jobs
            </h1>
          </div>
          <p className="text-sm text-slate-600 dark:text-gray-300">
            Track the status of jobs you've reported to our admin team.
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
              <Flag size={32} />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">No Reported Jobs</h3>
            <p className="text-slate-500 dark:text-gray-400">
              You haven't reported any jobs yet. If you see suspicious or inappropriate job postings, please report them.
            </p>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-gray-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-gray-300 font-medium border-b border-slate-200 dark:border-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-xs uppercase tracking-wider">Job Details</th>
                    <th className="px-6 py-3 text-xs uppercase tracking-wider">Reason</th>
                    <th className="px-6 py-3 text-xs uppercase tracking-wider">Reported</th>
                    <th className="px-6 py-3 text-xs uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-xs uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-gray-800">
                  {reports.map((report) => (
                    <tr key={report.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <div className="font-medium text-slate-900 dark:text-white">
                            {report.Job?.title || 'Job Deleted'}
                          </div>
                          {report.Job && (
                            <>
                              <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-gray-400">
                                <Building2 size={14} />
                                <span>{report.Job.company?.companyName || 'Unknown Company'}</span>
                              </div>
                              {report.Job.location && (
                                <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-gray-400">
                                  <MapPin size={14} />
                                  <span>{report.Job.location}</span>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-slate-700 dark:text-gray-300 max-w-xs">
                          <div className="font-medium capitalize mb-1">{report.reason}</div>
                          {report.description && (
                            <div className="text-xs text-slate-500 dark:text-gray-400 line-clamp-2">
                              {report.description}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 dark:text-gray-400">
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
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleUnreport(report.id)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded-md transition-colors"
                          title="Remove this report"
                        >
                          <Trash2 size={14} />
                          Unreport
                        </button>
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
            <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">Status Legend:</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-amber-500" />
                <span className="text-slate-600 dark:text-gray-400"><strong>Pending:</strong> Under review by admin</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-green-500" />
                <span className="text-slate-600 dark:text-gray-400"><strong>Reviewed:</strong> Admin has reviewed your report</span>
              </div>
              <div className="flex items-center gap-2">
                <XCircle size={16} className="text-red-500" />
                <span className="text-slate-600 dark:text-gray-400"><strong>Dismissed:</strong> Report dismissed by admin</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </StudentLayout>
  );
};

export default ReportedJobs;
