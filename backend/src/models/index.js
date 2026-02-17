const { sequelize } = require('../config/database');
const User = require('./User');
const CompanyProfile = require('./CompanyProfile');
const StudentProfile = require('./StudentProfile');
const Job = require('./Job');
const Application = require('./Application');
const SavedCandidate = require('./SavedCandidate');
const SavedJob = require('./SavedJob');
const Notification = require('./Notification');
const ViewLog = require('./ViewLog');
const JobReport = require('./JobReport');
const InternRating = require('./InternRating');
const CompanyReview = require('./CompanyReview');

// Define relationships

// User - Profiles
User.hasOne(CompanyProfile, { foreignKey: 'userId', onDelete: 'CASCADE' });
CompanyProfile.belongsTo(User, { foreignKey: 'userId' });

User.hasOne(StudentProfile, { foreignKey: 'userId', onDelete: 'CASCADE' });
StudentProfile.belongsTo(User, { foreignKey: 'userId' });

// Company - Jobs
CompanyProfile.hasMany(Job, { foreignKey: 'companyId', onDelete: 'CASCADE' });
Job.belongsTo(CompanyProfile, { as: 'company', foreignKey: 'companyId' });

// Job - Applications
Job.hasMany(Application, { foreignKey: 'jobId', onDelete: 'CASCADE' });
Application.belongsTo(Job, { foreignKey: 'jobId' });

// User (Student) - Applications
User.hasMany(Application, { foreignKey: 'studentId', onDelete: 'CASCADE' });
Application.belongsTo(User, { as: 'student', foreignKey: 'studentId' });

// Company - SavedCandidates
CompanyProfile.hasMany(SavedCandidate, { foreignKey: 'companyId', onDelete: 'CASCADE' });
SavedCandidate.belongsTo(CompanyProfile, { foreignKey: 'companyId' });

// User (Student) - SavedCandidates
User.hasMany(SavedCandidate, { foreignKey: 'studentId', onDelete: 'CASCADE' });
SavedCandidate.belongsTo(User, { foreignKey: 'studentId' });

// User (Student) - SavedJobs
User.hasMany(SavedJob, { foreignKey: 'userId', onDelete: 'CASCADE' });
SavedJob.belongsTo(User, { foreignKey: 'userId' });

// Job - SavedJobs
Job.hasMany(SavedJob, { foreignKey: 'jobId', onDelete: 'CASCADE' });
SavedJob.belongsTo(Job, { foreignKey: 'jobId' });

User.hasMany(Notification, { foreignKey: 'userId', onDelete: 'CASCADE' });
Notification.belongsTo(User, { foreignKey: 'userId' });

// User - ViewLogs
User.hasMany(ViewLog, { foreignKey: 'viewerId', onDelete: 'CASCADE' });
ViewLog.belongsTo(User, { foreignKey: 'viewerId' });

// Application - InternRating (one rating per application)
Application.hasOne(InternRating, { foreignKey: 'applicationId', onDelete: 'CASCADE' });
InternRating.belongsTo(Application, { foreignKey: 'applicationId' });

// Company - InternRatings
CompanyProfile.hasMany(InternRating, { foreignKey: 'companyId', onDelete: 'CASCADE' });
InternRating.belongsTo(CompanyProfile, { foreignKey: 'companyId' });

// Student(User) - InternRatings received
User.hasMany(InternRating, { foreignKey: 'studentId', onDelete: 'CASCADE' });
InternRating.belongsTo(User, { foreignKey: 'studentId' });

// Company - CompanyReviews
CompanyProfile.hasMany(CompanyReview, { foreignKey: 'companyId', onDelete: 'CASCADE' });
CompanyReview.belongsTo(CompanyProfile, { foreignKey: 'companyId' });

// Student(User) - CompanyReviews
User.hasMany(CompanyReview, { foreignKey: 'studentId', onDelete: 'CASCADE' });
CompanyReview.belongsTo(User, { foreignKey: 'studentId' });

// Job - JobReport
Job.hasMany(JobReport, { foreignKey: 'jobId', onDelete: 'CASCADE' });
JobReport.belongsTo(Job, { foreignKey: 'jobId' });

// User - JobReport
User.hasMany(JobReport, { foreignKey: 'reporterId', onDelete: 'CASCADE' });
JobReport.belongsTo(User, { foreignKey: 'reporterId' });

module.exports = {
  sequelize,
  User,
  CompanyProfile,
  StudentProfile,
  Job,
  Application,
  SavedCandidate,
  SavedJob,
  Notification,
  ViewLog,
  JobReport,
  InternRating,
  CompanyReview,
};
