// Super Admin Dashboard Controller
const { User, Job, StudentProfile, Application, Notification } = require('../models');
const { Op } = require('sequelize');

exports.getDashboardStats = async (req, res) => {
  try {
    const [
      totalUsers,
      totalCompanies,
      totalStudents,
      totalJobs,
      activeJobs,
      totalApplications,
      pendingApplications,
      totalNotifications,
    ] = await Promise.all([
      User.count(),
      User.count({ where: { role: 'company' } }),
      User.count({ where: { role: 'student' } }),
      Job.count(),
      Job.count({
        where: {
          [Op.or]: [
            { status: { [Op.iLike]: 'active' } },
            { status: { [Op.iLike]: 'live' } },
          ],
        },
      }),
      Application.count(),
      Application.count({ where: { status: 'pending' } }),
      Notification.count(),
    ]);

    // Get recent activities (last 10 users, jobs, applications)
    const recentUsers = await User.findAll({
      limit: 10,
      order: [['createdAt', 'DESC']],
      attributes: ['id', 'name', 'email', 'role', 'createdAt']
    });

    const recentJobs = await Job.findAll({
      limit: 10,
      order: [['createdAt', 'DESC']],
      attributes: ['id', 'title', 'status', 'createdAt']
    });

    const recentApplications = await Application.findAll({
      limit: 10,
      order: [['createdAt', 'DESC']],
      attributes: ['id', 'status', 'createdAt']
    });

    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalUsers,
          totalCompanies,
          totalStudents,
          totalJobs,
          activeJobs,
          totalApplications,
          pendingApplications,
          totalNotifications
        },
        recentActivities: {
          recentUsers,
          recentJobs,
          recentApplications,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

exports.getSidebarCounts = async (req, res) => {
  try {
    const [students, companies, jobs, applications] = await Promise.all([
      User.count({ where: { role: 'student' } }),
      User.count({ where: { role: 'company' } }),
      Job.count(),
      Application.count(),
    ]);

    return res.status(200).json({
      success: true,
      data: { students, companies, jobs, applications },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

exports.getViewStats = async (req, res) => {
  try {
    const [jobViewRaw, profileViewRaw] = await Promise.all([
      Job.sum('viewCount'),
      StudentProfile.sum('viewCount')
    ]);

    return res.status(200).json({
      success: true,
      data: {
        totalJobViews: Number(jobViewRaw || 0),
        totalProfileViews: Number(profileViewRaw || 0)
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};
