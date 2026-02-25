const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleAuth');

// Import controllers
const { getDashboardStats, getViewStats, getSidebarCounts } = require('../controllers/superAdminController');
const {
  getAllUsers,
  getUserById,
  updateUser,
  changeUserRole,
  deleteUser,
  resetUserPassword
} = require('../controllers/superAdminUserController');
const {
  getAllCompanies,
  getCompanyById,
  updateCompany,
  deleteCompany
} = require('../controllers/superAdminCompanyController');
const {
  getAllStudents,
  getStudentById,
  updateStudent,
  deleteStudent
} = require('../controllers/superAdminStudentController');
const {
  getAllJobs,
  getJobById,
  updateJob,
  deleteJob,
  changeJobStatus
} = require('../controllers/superAdminJobController');
const {
  getAllApplications,
  getApplicationById,
  updateApplicationStatus,
  deleteApplication
} = require('../controllers/superAdminApplicationController');
const {
  getAllReports,
  updateReportStatus,
  deleteReportedJob,
  restoreReportedJob
} = require('../controllers/reportController');

// Apply middleware to all routes
router.use(protect, authorize('superadmin'));

// Dashboard
router.get('/dashboard', getDashboardStats);
router.get('/views/stats', getViewStats);
router.get('/sidebar-counts', getSidebarCounts);

// User Management
router.get('/users', getAllUsers);
router.get('/users/:id', getUserById);
router.put('/users/:id', updateUser);
router.patch('/users/:id/role', changeUserRole);
router.patch('/users/:id/password', resetUserPassword);
router.delete('/users/:id', deleteUser);

// Company Management
router.get('/companies', getAllCompanies);
router.get('/companies/:id', getCompanyById);
router.put('/companies/:id', updateCompany);
router.delete('/companies/:id', deleteCompany);

// Student Management
router.get('/students', getAllStudents);
router.get('/students/:id', getStudentById);
router.put('/students/:id', updateStudent);
router.delete('/students/:id', deleteStudent);

// Job Management
router.get('/jobs', getAllJobs);
router.get('/jobs/:id', getJobById);
router.put('/jobs/:id', updateJob);
router.patch('/jobs/:id/status', changeJobStatus);
router.delete('/jobs/:id', deleteJob);

// Application Management
router.get('/applications', getAllApplications);
router.get('/applications/:id', getApplicationById);
router.patch('/applications/:id/status', updateApplicationStatus);
router.delete('/applications/:id', deleteApplication);

// Report Management
router.get('/reports', getAllReports);
router.put('/reports/:id/status', updateReportStatus);
router.delete('/reports/:id/job', deleteReportedJob);
router.post('/reports/:id/job/restore', restoreReportedJob);

module.exports = router;
