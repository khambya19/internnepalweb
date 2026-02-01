const { Application, Job, User, StudentProfile, CompanyProfile, Notification, InternRating } = require('../models');
const { createNotification } = require('./notificationController');
const { sendInterviewScheduledEmail, sendRejectionEmail } = require('../utils/sendEmail');

const toIsoNow = () => new Date().toISOString();

const buildHistoryEntry = (entry) => ({
  type: entry.type || 'status',
  status: entry.status || 'pending',
  label: entry.label || entry.status || 'Status updated',
  changedAt: entry.changedAt || toIsoNow(),
  interviewDate: entry.interviewDate || null,
  interviewTime: entry.interviewTime || null
});

const escapeRegex = (value) => String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const mergeHistoryFromNotifications = ({ applicationPlain, notifications }) => {
  const existing = Array.isArray(applicationPlain.statusHistory)
    ? applicationPlain.statusHistory.map(buildHistoryEntry)
    : [];

  const baseSubmitted = buildHistoryEntry({
    type: 'status',
    status: 'Applied',
    label: 'Application submitted',
    changedAt: applicationPlain.createdAt || toIsoNow()
  });

  const history = [...existing];
  if (!history.some((item) => item.label === baseSubmitted.label && item.changedAt === baseSubmitted.changedAt)) {
    history.push(baseSubmitted);
  }

  // Always derive minimum timeline from real Application row data in DB.
  const currentStatus = String(applicationPlain.status || '').trim();
  const createdAtIso = applicationPlain.createdAt ? new Date(applicationPlain.createdAt).toISOString() : null;
  const updatedAtIso = applicationPlain.updatedAt ? new Date(applicationPlain.updatedAt).toISOString() : null;
  const hasInterviewData = !!(
    applicationPlain.interviewDate ||
    applicationPlain.interviewTime ||
    applicationPlain.interviewMessage
  );
  const normalizedStatus = currentStatus.toLowerCase();
  const statusIsInitial = !currentStatus || normalizedStatus === 'pending' || normalizedStatus === 'applied';

  if (!statusIsInitial && updatedAtIso && createdAtIso !== updatedAtIso) {
    const currentStatusEntry = buildHistoryEntry({
      type: 'status',
      status: currentStatus,
      label: `Status updated to ${currentStatus}`,
      changedAt: updatedAtIso
    });
    const exists = history.some(
      (item) =>
        item.label === currentStatusEntry.label &&
        String(item.changedAt) === String(currentStatusEntry.changedAt)
    );
    if (!exists) history.push(currentStatusEntry);
  }

  if (hasInterviewData && updatedAtIso) {
    const interviewEntry = buildHistoryEntry({
      type: 'interview',
      status: currentStatus || 'Interview Scheduled',
      label: 'Interview details updated',
      changedAt: updatedAtIso,
      interviewDate: applicationPlain.interviewDate || null,
      interviewTime: applicationPlain.interviewTime || null
    });
    const exists = history.some(
      (item) =>
        item.type === 'interview' &&
        String(item.changedAt) === String(interviewEntry.changedAt)
    );
    if (!exists) history.push(interviewEntry);
  }

  const jobTitle = applicationPlain.Job?.title || '';
  if (!jobTitle) return history.sort((a, b) => new Date(b.changedAt || 0) - new Date(a.changedAt || 0));

  const quotedTitlePattern = new RegExp(`"${escapeRegex(jobTitle)}"`);

  notifications.forEach((notification) => {
    const message = String(notification.message || '');
    if (!quotedTitlePattern.test(message)) return;

    let entry = null;
    if (notification.type === 'interview_scheduled') {
      entry = buildHistoryEntry({
        type: 'interview',
        status: 'Interview Scheduled',
        label: 'Interview scheduled',
        changedAt: notification.createdAt || toIsoNow(),
        interviewDate: applicationPlain.interviewDate || null,
        interviewTime: applicationPlain.interviewTime || null
      });
    } else if (notification.type === 'application_status') {
      const match = message.match(/is now\s+(.+?)(?:\.)?$/i);
      const status = match?.[1]?.trim() || 'Updated';
      entry = buildHistoryEntry({
        type: 'status',
        status,
        label: `Status updated to ${status}`,
        changedAt: notification.createdAt || toIsoNow()
      });
    }

    if (!entry) return;
    const duplicate = history.some(
      (item) =>
        item.type === entry.type &&
        item.label === entry.label &&
        String(item.changedAt) === String(entry.changedAt)
    );
    if (!duplicate) history.push(entry);
  });

  return history.sort((a, b) => new Date(b.changedAt || 0) - new Date(a.changedAt || 0));
};

exports.applyForJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    const { coverLetter } = req.body || {};

    const job = await Job.findByPk(jobId, {
      attributes: ['id', 'title', 'status', 'isRemovedByAdmin', 'hiringPaused', 'companyId']
    });
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    const normalizedJobStatus = String(job.status || '').trim().toLowerCase();
    const isJobOpen = ['active', 'live'].includes(normalizedJobStatus);
    if (!isJobOpen || job.isRemovedByAdmin) {
      return res.status(400).json({
        success: false,
        message: 'This job is closed and no longer accepting applications.'
      });
    }

    // Check if hiring is paused
    if (job.hiringPaused) {
      return res.status(400).json({ 
        success: false, 
        message: 'Applications are temporarily paused for this position. Please check back later.' 
      });
    }

    const applicationExists = await Application.findOne({
      where: { jobId, studentId: req.user.id }
    });

    if (applicationExists) {
      return res.status(400).json({ success: false, message: 'You have already applied for this job' });
    }

    const application = await Application.create({
      jobId,
      studentId: req.user.id,
      status: 'pending',
      coverLetter: coverLetter || null,
      statusHistory: [
        buildHistoryEntry({
          type: 'status',
          status: 'pending',
          label: 'Application submitted',
          changedAt: toIsoNow()
        })
      ]
    });

    let companyUserId = null;
    if (job.companyId) {
      const company = await CompanyProfile.findByPk(job.companyId, {
        attributes: ['userId']
      });
      companyUserId = company?.userId || null;
    }
    if (companyUserId) {
      await createNotification({
        userId: companyUserId,
        type: 'application',
        title: 'New application',
        message: `${req.user.name || 'A student'} applied for "${job.title}".`,
        link: `/company/dashboard/applications`,
      });
    }

    res.status(201).json({ success: true, data: application });
  } catch (error) {
    const isDuplicate = error.name === 'SequelizeUniqueConstraintError' ||
      (error.message && error.message.includes('applications_job_student_unique'));
    if (isDuplicate) {
      return res.status(400).json({ success: false, message: 'You have already applied for this job' });
    }
    console.error('applyForJob error:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

exports.getJobApplications = async (req, res) => {
  try {
    const { jobId } = req.params;

    const job = await Job.findByPk(jobId);
    
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }
    
    // Authorization: Ensure the company fetching applications is the job owner
    const companyProfile = await CompanyProfile.findOne({ where: { userId: req.user.id } });
    if (!companyProfile || job.companyId !== companyProfile.id) {
        return res.status(403).json({ success: false, message: 'Not authorized to view these applications' });
    }

    const applications = await Application.findAll({
      where: { jobId },
      include: [
        {
          model: User,
          as: 'student',
          attributes: ['name', 'email', 'phone'],
          include: [{ model: StudentProfile }]
        }
      ]
    });

    const normalized = applications.map((application) => {
      const plain = application.toJSON();
      return {
        ...plain,
        User: plain.User || plain.student || null,
      };
    });

    res.status(200).json({ success: true, count: normalized.length, data: normalized });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

exports.getAllCompanyApplications = async (req, res) => {
  try {
    const companyProfile = await CompanyProfile.findOne({ where: { userId: req.user.id } });
    if (!companyProfile) {
        return res.status(403).json({ success: false, message: 'Not authorized or profile missing' });
    }

    const applications = await Application.findAll({
      include: [
        {
          model: Job,
          where: { companyId: companyProfile.id }, // only jobs belonging to this company
          attributes: ['title', 'id']
        },
        {
          model: User,
          as: 'student',
          attributes: ['name', 'email', 'phone'],
          include: [{ model: StudentProfile }]
        },
        {
          model: InternRating,
          attributes: ['id', 'rating', 'review', 'skills', 'createdAt']
        },
      ],
      order: [['createdAt', 'DESC']]
    });

    const normalized = applications.map((application) => {
      const plain = application.toJSON();
      return {
        ...plain,
        Job: plain.Job || plain.job || null,
        User: plain.User || plain.student || null,
      };
    });

    res.status(200).json({ success: true, count: normalized.length, data: normalized });
  } catch (error) {
    console.error('Get all company applications error:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

exports.updateApplicationStatus = async (req, res) => {
    try {
      const { id } = req.params;
      const { status, interviewDate, interviewTime, interviewMessage, rejectionReason } = req.body;
      
      let application = await Application.findByPk(id, {
          include: [{ model: Job }]
      });

      if (!application) {
          return res.status(404).json({ success: false, message: 'Application not found' });
      }

      const companyProfile = await CompanyProfile.findOne({ where: { userId: req.user.id } });
      if (!companyProfile || application.Job.companyId !== companyProfile.id) {
          return res.status(403).json({ success: false, message: 'Not authorized to update this application' });
      }

      const previousStatus = application.status;
      const statusHistory = Array.isArray(application.statusHistory) ? [...application.statusHistory] : [];

      if (status) {
        application.status = status;
        const isRejected = String(status).toLowerCase() === 'rejected';
        if (isRejected) {
          application.rejectionReason =
            typeof rejectionReason === 'string' && rejectionReason.trim()
              ? rejectionReason.trim()
              : null;
        } else {
          application.rejectionReason = null;
        }

        if (status !== previousStatus) {
          statusHistory.push(
            buildHistoryEntry({
              type: 'status',
              status,
              label: `Status updated to ${status}`,
              changedAt: toIsoNow()
            })
          );
        }
      }

      const interviewUpdateRequested =
        interviewDate !== undefined ||
        interviewTime !== undefined ||
        interviewMessage !== undefined;

      if (interviewDate !== undefined) application.interviewDate = interviewDate || null;
      if (interviewTime !== undefined) application.interviewTime = interviewTime || null;
      if (interviewMessage !== undefined) application.interviewMessage = interviewMessage || null;

      if (interviewUpdateRequested) {
        statusHistory.push(
          buildHistoryEntry({
            type: 'interview',
            status: application.status || 'Interview Scheduled',
            label: 'Interview details updated',
            changedAt: toIsoNow(),
            interviewDate: application.interviewDate || null,
            interviewTime: application.interviewTime || null
          })
        );
      }

      application.statusHistory = statusHistory;

      await application.save();
      await application.reload({
        include: [
          { model: Job, include: [{ model: CompanyProfile, as: 'company', attributes: ['companyName'] }] },
          { model: User, as: 'student', attributes: ['id', 'email', 'name'] }
        ]
      });

      const job = application.Job;
      const jobTitle = job?.title || 'the role';
      const companyName = job?.company?.companyName || 'Company';
      const isInterviewScheduled = status === 'Interview Scheduled' || application.interviewDate;

      if (application.studentId) {
        if (isInterviewScheduled) {
          const student = application.student || await User.findByPk(application.studentId, { attributes: ['email', 'name'] });
          if (student?.email) {
            sendInterviewScheduledEmail({
              to: student.email,
              studentName: student.name,
              jobTitle,
              companyName,
              interviewDate: application.interviewDate,
              interviewTime: application.interviewTime,
              interviewMessage: application.interviewMessage,
            }).catch((err) => console.error('Interview email failed:', err.message));
          }
          await createNotification({
            userId: application.studentId,
            type: 'interview_scheduled',
            title: 'Interview scheduled',
            message: `${companyName} scheduled your interview for "${jobTitle}".${application.interviewDate ? ` Date: ${new Date(application.interviewDate).toLocaleDateString()}.` : ''}`,
            link: '/student/applications',
          });
        } else if (status) {
          await createNotification({
            userId: application.studentId,
            type: 'application_status',
            title: 'Application status updated',
            message: `Your application for "${jobTitle}" is now ${application.status}.`,
            link: '/student/applications',
          });
        }
      }

      res.status(200).json({ success: true, data: application });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

exports.getMyApplications = async (req, res) => {
    try {
      const applications = await Application.findAll({
        where: { studentId: req.user.id },
        include: [
          {
            model: Job,
            include: [{ model: CompanyProfile, as: 'company', attributes: ['companyName', 'logo', 'location'] }]
          }
        ],
        order: [['updatedAt', 'DESC']]
      });

      const notifications = await Notification.findAll({
        where: { userId: req.user.id },
        order: [['createdAt', 'DESC']],
      });

      const data = applications.map((application) => {
        const plain = application.toJSON();
        return {
          ...plain,
          statusHistory: mergeHistoryFromNotifications({
            applicationPlain: plain,
            notifications
          })
        };
      });

      res.status(200).json({ success: true, count: data.length, data });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

exports.updateApplicationNotes = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body || {};

    if (notes !== undefined && notes !== null && typeof notes !== 'string') {
      return res.status(400).json({ success: false, message: 'Notes must be a string or null' });
    }

    const application = await Application.findByPk(id, {
      include: [{ model: Job, attributes: ['id', 'companyId'] }]
    });

    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    const companyProfile = await CompanyProfile.findOne({ where: { userId: req.user.id } });
    if (!companyProfile || application.Job.companyId !== companyProfile.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to update notes for this application' });
    }

    const normalizedNotes = typeof notes === 'string' ? notes.trim() : null;
    application.companyNotes = normalizedNotes || null;
    await application.save();

    return res.status(200).json({ success: true, data: application });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

exports.withdrawApplication = async (req, res) => {
  try {
    const { id } = req.params;

    // Find the application
    const application = await Application.findByPk(id, {
      include: [
        { 
          model: Job, 
          attributes: ['id', 'title', 'companyId'],
          include: [{ model: CompanyProfile, as: 'company', attributes: ['userId', 'companyName'] }]
        }
      ]
    });

    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    // Check if the application belongs to the logged-in student
    if (application.studentId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'You can only withdraw your own applications' });
    }

    // Check if application status is pending (students can only withdraw pending applications)
    const status = String(application.status || '').toLowerCase().trim();
    if (status !== 'pending' && status !== 'applied' && status !== 'under review') {
      return res.status(400).json({ 
        success: false, 
        message: 'You can only withdraw pending applications. This application has already been processed.' 
      });
    }

    // Delete the application
    await application.destroy();

    // Optional: Notify the company that the application was withdrawn
    const companyUserId = application.Job?.company?.userId;
    if (companyUserId) {
      await createNotification({
        userId: companyUserId,
        type: 'application_withdrawn',
        title: 'Application withdrawn',
        message: `${req.user.name || 'A student'} withdrew their application for "${application.Job.title}".`,
        link: `/company/dashboard/applications`,
      });
    }

    res.status(200).json({ 
      success: true, 
      message: 'Application withdrawn successfully' 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Server Error', 
      error: error.message 
    });
  }
};

/**
 * Bulk reject multiple applications
 * POST /api/applications/bulk-reject
 * Body: { applicationIds: [1, 2, 3], rejectionReason: "optional reason" }
 */
exports.bulkReject = async (req, res) => {
  try {
    const { applicationIds, rejectionReason } = req.body;

    // Validate input
    if (!Array.isArray(applicationIds) || applicationIds.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'applicationIds array is required and must not be empty' 
      });
    }

    // Get company profile
    const companyProfile = await CompanyProfile.findOne({ 
      where: { userId: req.user.id },
      attributes: ['id', 'companyName']
    });
    
    if (!companyProfile) {
      return res.status(403).json({ 
        success: false, 
        message: 'Company profile not found' 
      });
    }

    // Fetch all applications with their jobs and student info
    const applications = await Application.findAll({
      where: { id: applicationIds },
      include: [
        { 
          model: Job, 
          attributes: ['id', 'title', 'companyId'],
          where: { companyId: companyProfile.id } // Security: only get apps for this company's jobs
        },
        { 
          model: User, 
          as: 'student',
          attributes: ['id', 'email', 'name'] 
        }
      ]
    });

    // Security check: ensure all applications belong to this company
    if (applications.length !== applicationIds.length) {
      return res.status(403).json({ 
        success: false, 
        message: 'One or more applications do not belong to your company' 
      });
    }

    const reason = typeof rejectionReason === 'string' && rejectionReason.trim() 
      ? rejectionReason.trim() 
      : null;

    // Update all applications
    const updatePromises = applications.map(async (application) => {
      const statusHistory = Array.isArray(application.statusHistory) 
        ? [...application.statusHistory] 
        : [];

      statusHistory.push(
        buildHistoryEntry({
          type: 'status',
          status: 'Rejected',
          label: 'Status updated to Rejected',
          changedAt: toIsoNow()
        })
      );

      application.status = 'Rejected';
      application.rejectionReason = reason;
      application.statusHistory = statusHistory;
      await application.save();

      return application;
    });

    await Promise.all(updatePromises);

    // Send rejection emails and notifications
    const emailPromises = applications.map(async (application) => {
      const student = application.student || application.User;
      const jobTitle = application.Job?.title || 'the role';
      const companyName = companyProfile.companyName || 'Company';

      // Send email
      if (student?.email) {
        sendRejectionEmail({
          to: student.email,
          studentName: student.name,
          jobTitle,
          companyName,
          rejectionReason: reason,
        }).catch((err) => console.error('Rejection email failed:', err.message));
      }

      // Create notification
      if (application.studentId) {
        await createNotification({
          userId: application.studentId,
          type: 'application_status',
          title: 'Application status updated',
          message: `Your application for "${jobTitle}" has been reviewed. Status: Rejected.`,
          link: '/student/applications',
        });
      }
    });

    await Promise.all(emailPromises);

    res.status(200).json({ 
      success: true, 
      updated: applications.length,
      message: `${applications.length} application${applications.length !== 1 ? 's' : ''} rejected successfully`
    });
  } catch (error) {
    console.error('Bulk reject error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server Error', 
      error: error.message 
    });
  }
};

/**
 * Toggle star/pin status for an application
 * PATCH /api/applications/:id/star
 */
exports.toggleStar = async (req, res) => {
  try {
    const { id } = req.params;

    // Find application with job info
    const application = await Application.findByPk(id, {
      include: [{ model: Job, attributes: ['id', 'companyId'] }]
    });

    if (!application) {
      return res.status(404).json({ 
        success: false, 
        message: 'Application not found' 
      });
    }

    // Get company profile
    const companyProfile = await CompanyProfile.findOne({ 
      where: { userId: req.user.id },
      attributes: ['id']
    });
    
    if (!companyProfile) {
      return res.status(403).json({ 
        success: false, 
        message: 'Company profile not found' 
      });
    }

    // Security: Verify application belongs to this company's job
    if (application.Job.companyId !== companyProfile.id) {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to star this application' 
      });
    }

    // Toggle star status
    application.isStarred = !application.isStarred;
    await application.save();

    res.status(200).json({ 
      success: true, 
      isStarred: application.isStarred,
      message: application.isStarred ? 'Applicant starred' : 'Star removed'
    });
  } catch (error) {
    console.error('Toggle star error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server Error', 
      error: error.message 
    });
  }
};
