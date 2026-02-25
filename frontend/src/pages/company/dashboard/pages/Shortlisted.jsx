import React, { useState, useMemo, useEffect } from 'react';
import {
  CheckCircle,
  Circle,
  Clock,
  UserCheck,
  XCircle,
  Download,
  Eye,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import { Badge } from '../../../../components/ui/Badge';
import { toast } from 'sonner';
import axios from 'axios';
import { ConfirmModal } from '../../../../components/ui/ConfirmModal';

const Shortlisted = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmReject, setConfirmReject] = useState(null); // { applicationId }

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:6060/api/applications/company/all', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.success) {
          const apps = res.data.data.map(app => ({
            id: app.id,
            studentName: app.User?.name || 'Unknown',
            studentEmail: app.User?.email || '',
            college: app.User?.StudentProfile?.university || 'N/A',
            postingTitle: app.Job?.title || 'Unknown Role',
            matchScore: 0,
            status: app.status,
            resume: app.User?.StudentProfile?.resumeUrl || '',
          }));
          setData(apps);
        }
      } catch {
        toast.error('Failed to load applications. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchApplications();
  }, []);

  // Filter only shortlisted and further stages
  const shortlistedData = useMemo(() => {
    return data.filter(
      (app) =>
        app.status === 'Shortlisted' ||
        app.status === 'Interview Scheduled' ||
        app.status === 'Offered' ||
        app.status === 'Hired'
    );
  }, [data]);

  const stages = [
    { key: 'Applied', label: 'Applied', icon: Circle },
    { key: 'Shortlisted', label: 'Shortlisted', icon: UserCheck },
    { key: 'Interview Scheduled', label: 'Interview', icon: Clock },
    { key: 'Offered', label: 'Offered', icon: CheckCircle },
    { key: 'Hired', label: 'Hired', icon: CheckCircle },
  ];

  const getStageIndex = (status) => {
    const index = stages.findIndex((s) => s.key === status);
    return index >= 0 ? index : 0;
  };

  const handleDecision = async (applicationId, decision) => {
    if (decision === 'reject') {
      setConfirmReject({ applicationId });
      return;
    }
    await doDecision(applicationId, 'hire');
  };

  const doDecision = async (applicationId, decision) => {
    const newStatus = decision === 'hire' ? 'Hired' : 'Rejected';
    try {
      const token = localStorage.getItem('token');
      const res = await axios.put(`http://localhost:6060/api/applications/${applicationId}`, { status: newStatus }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setData(data.map((app) => (app.id === applicationId ? { ...app, status: newStatus } : app)));
        toast.success(decision === 'hire' ? '✓ Candidate marked as hired! Congratulations on your new team member.' : '✓ Application has been rejected. The candidate has been notified.');
      }
    } catch {
      toast.error('Failed to update candidate status. Please try again.');
    }
  };

  const handleConfirmReject = async () => {
    if (!confirmReject) return;
    const applicationId = confirmReject.applicationId;
    setConfirmReject(null);
    await doDecision(applicationId, 'reject');
  };

  return (
    <div className="space-y-6">
      <ConfirmModal
        open={!!confirmReject}
        onClose={() => setConfirmReject(null)}
        onConfirm={handleConfirmReject}
        title="Reject candidate?"
        message="Are you sure you want to reject this candidate? They will be notified."
        confirmLabel="Reject"
        cancelLabel="Cancel"
        variant="danger"
      />
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
          Shortlisted Candidates
        </h1>
        <p className="mt-1 text-gray-600 dark:text-gray-400">
          Track progress of your top candidates through the hiring pipeline
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Shortlisted
            </p>
            <p className="mt-2 text-3xl font-bold text-blue-600">
              {shortlistedData.filter((a) => a.status === 'Shortlisted').length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Interviews
            </p>
            <p className="mt-2 text-3xl font-bold text-purple-600">
              {shortlistedData.filter((a) => a.status === 'Interview Scheduled').length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Offered</p>
            <p className="mt-2 text-3xl font-bold text-orange-600">
              {shortlistedData.filter((a) => a.status === 'Offered').length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Hired</p>
            <p className="mt-2 text-3xl font-bold text-green-600">
              {shortlistedData.filter((a) => a.status === 'Hired').length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Candidates List */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <span className="text-gray-500">Loading candidates...</span>
          </div>
        ) : shortlistedData.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <UserCheck size={48} className="mb-4 text-gray-400" />
              <h3 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
                No shortlisted candidates yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Start reviewing applications to shortlist candidates
              </p>
            </CardContent>
          </Card>
        ) : (
          shortlistedData.map((candidate) => {
            const currentStageIndex = getStageIndex(candidate.status);

            return (
              <Card key={candidate.id}>
                <CardContent className="p-6">
                  <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                    {/* Candidate Info */}
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-blue-700 text-lg font-bold text-white">
                        {candidate.studentName
                          .split(' ')
                          .map((n) => n[0])
                          .join('')}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                          {candidate.studentName}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {candidate.postingTitle}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <Badge variant="outline" className="text-xs">
                            {candidate.college}
                          </Badge>
                          <Badge variant="default" className="text-xs">
                            Match: {candidate.matchScore}%
                          </Badge>
                          {candidate.status === 'Interview Scheduled' && (
                            <Badge variant="default" className="text-xs bg-purple-600">
                              Interview on {new Date(candidate.interviewDate).toLocaleDateString()}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(candidate.resume, '_blank')}
                      >
                        <Download size={16} />
                      </Button>
                      {(candidate.status === 'Offered' || candidate.status === 'Interview Scheduled') && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleDecision(candidate.id, 'hire')}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            Mark as Hired
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDecision(candidate.id, 'reject')}
                            className="text-red-600 hover:bg-red-50"
                          >
                            Reject
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Progress Tracker */}
                  <div className="mt-6">
                    <div className="flex items-center justify-between">
                      {stages.map((stage, index) => {
                        const isActive = index <= currentStageIndex;
                        const isCurrent = index === currentStageIndex;
                        const StageIcon = stage.icon;

                        return (
                          <div key={stage.key} className="flex flex-1 items-center">
                            {/* Stage */}
                            <div className="flex flex-col items-center">
                              <div
                                className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors ${
                                  isActive
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-200 text-gray-400 dark:bg-gray-800'
                                }`}
                              >
                                <StageIcon size={20} />
                              </div>
                              <p
                                className={`mt-2 text-xs font-medium ${
                                  isCurrent
                                    ? 'text-blue-600'
                                    : isActive
                                    ? 'text-gray-900 dark:text-white'
                                    : 'text-gray-400'
                                }`}
                              >
                                {stage.label}
                              </p>
                            </div>

                            {/* Connector Line */}
                            {index < stages.length - 1 && (
                              <div
                                className={`mx-2 h-1 flex-1 rounded transition-colors ${
                                  index < currentStageIndex
                                    ? 'bg-blue-600'
                                    : 'bg-gray-200 dark:bg-gray-800'
                                }`}
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Shortlisted;
