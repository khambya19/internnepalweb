const { ViewLog, Job, StudentProfile, CompanyProfile } = require('../models');

const VALID_TARGET_TYPES = new Set(['job', 'student_profile']);

exports.recordView = async (req, res) => {
  try {
    const viewerId = req.user?.id;
    const { targetType, targetId } = req.body || {};

    if (!viewerId) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    if (!VALID_TARGET_TYPES.has(targetType) || !targetId) {
      return res.status(400).json({
        success: false,
        message: 'targetType must be "job" or "student_profile", and targetId is required'
      });
    }

    if (targetType === 'job') {
      const job = await Job.findByPk(targetId, {
        include: [{ model: CompanyProfile, as: 'company', attributes: ['id', 'userId'] }]
      });
      if (!job) {
        return res.status(404).json({ success: false, message: 'Job not found' });
      }

      // Company viewing own job should not count.
      if (job.company?.userId === viewerId) {
        return res.status(200).json({ success: true, counted: false, reason: 'self_view' });
      }

      const [, created] = await ViewLog.findOrCreate({
        where: { viewerId, targetType: 'job', targetId }
      });

      if (!created) {
        return res.status(200).json({ success: true, counted: false });
      }

      await job.increment('viewCount', { by: 1 });
      return res.status(200).json({ success: true, counted: true });
    }

    const studentProfile = await StudentProfile.findByPk(targetId, {
      attributes: ['id', 'userId']
    });

    if (!studentProfile) {
      return res.status(404).json({ success: false, message: 'Student profile not found' });
    }

    // Student viewing own profile should not count.
    if (studentProfile.userId === viewerId) {
      return res.status(200).json({ success: true, counted: false, reason: 'self_view' });
    }

    const [, created] = await ViewLog.findOrCreate({
      where: { viewerId, targetType: 'student_profile', targetId }
    });

    if (!created) {
      return res.status(200).json({ success: true, counted: false });
    }

    await studentProfile.increment('viewCount', { by: 1 });
    return res.status(200).json({ success: true, counted: true });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};
