#!/bin/bash
cd /Users/khambya19/Desktop/internnepal

# 1 - Feb 1, 09:17:42
git add backend/src/controllers/jobController.js backend/src/controllers/applicationController.js \
  backend/src/routes/jobRoutes.js backend/src/routes/applicationRoutes.js \
  backend/src/models/Job.js backend/src/models/Application.js \
  frontend/src/pages/company/dashboard/CompanyDashboardLayout.jsx \
  frontend/src/pages/company/dashboard/pages/Applications.jsx \
  frontend/src/pages/company/dashboard/pages/BrowseCandidates.jsx \
  frontend/src/pages/company/dashboard/pages/ReportedJobs.jsx
git add -u frontend/src/pages/company/ 2>/dev/null || true
git add frontend/src/components/layout/ 2>/dev/null || true
GIT_AUTHOR_DATE="2026-02-01 09:17:42" GIT_COMMITTER_DATE="2026-02-01 09:17:42" git commit -m "company dashboard and jobs"

# 2 - Feb 4, 14:03:28
git add backend/src/controllers/ratingController.js backend/src/controllers/reportController.js \
  backend/src/controllers/viewController.js backend/src/routes/ratingRoutes.js \
  backend/src/routes/reportRoutes.js backend/src/routes/viewRoutes.js \
  backend/src/models/CompanyReview.js backend/src/models/InternRating.js \
  backend/src/models/JobReport.js backend/src/models/ViewLog.js
GIT_AUTHOR_DATE="2026-02-04 14:03:28" GIT_COMMITTER_DATE="2026-02-04 14:03:28" git commit -m "ratings and view tracking"

# 3 - Feb 6, 16:51:09
git add backend/src/controllers/authController.js backend/src/routes/authRoutes.js \
  backend/src/middleware/auth.js backend/src/models/User.js backend/src/utils/sendEmail.js \
  backend/src/config/database.js backend/src/server.js
git add -u backend/src/config/mailer.js backend/src/utils/generateToken.js backend/src/models/PasswordResetToken.js 2>/dev/null || true
git add frontend/src/pages/auth/Login.jsx frontend/src/pages/auth/Register.jsx \
  frontend/src/pages/auth/ResetPassword.jsx frontend/src/pages/auth/VerifyEmail.jsx \
  frontend/src/components/forms/LoginForm.jsx frontend/src/components/forms/RegisterSelector.jsx \
  frontend/src/components/forms/StudentRegisterForm.jsx \
  frontend/src/components/layout/Navbar.jsx frontend/src/components/layout/Footer.jsx \
  frontend/src/pages/shared/Home.jsx frontend/src/App.jsx frontend/src/main.jsx \
  frontend/src/services/api.js frontend/src/context/AuthContext.jsx frontend/src/stores/themeStore.js
git add -u frontend/src/pages/auth/LoginPage.jsx frontend/src/services/authService.js 2>/dev/null || true
GIT_AUTHOR_DATE="2026-02-06 16:51:09" GIT_COMMITTER_DATE="2026-02-06 16:51:09" git commit -m "auth and layout"

# 4 - Feb 8, 11:22:55
git add backend/src/controllers/savedJobController.js backend/src/routes/savedJobRoutes.js \
  frontend/src/components/JobCard.jsx frontend/src/components/ui/SearchWithHistory.jsx \
  frontend/src/hooks/useRecentlyViewed.js frontend/src/data/options.js frontend/src/utils/ \
  frontend/src/components/EmptyState.jsx
GIT_AUTHOR_DATE="2026-02-08 11:22:55" GIT_COMMITTER_DATE="2026-02-08 11:22:55" git commit -m "student saved jobs"

# 5 - Feb 10, 08:44:11
git add backend/src/middleware/requireCompletedProfile.js backend/src/utils/profileCompletion.js \
  frontend/src/pages/student/Profile.jsx frontend/src/pages/student/Settings.jsx \
  frontend/src/components/ProfileCompletion.jsx frontend/src/components/common/ProtectedRoute.jsx
git add -u frontend/src/components/common/Button.jsx frontend/src/components/common/Card.jsx 2>/dev/null || true
GIT_AUTHOR_DATE="2026-02-10 08:44:11" GIT_COMMITTER_DATE="2026-02-10 08:44:11" git commit -m "profile completion"

# 6 - Feb 11, 19:36:02
git add frontend/src/pages/student/JobDetails.jsx frontend/src/pages/student/CompanyProfile.jsx \
  frontend/src/pages/student/ReportedJobs.jsx frontend/src/components/common/GuestRoute.jsx
git add frontend/src/context/authContext.js 2>/dev/null || true
GIT_AUTHOR_DATE="2026-02-11 19:36:02" GIT_COMMITTER_DATE="2026-02-11 19:36:02" git commit -m "job details page"

# 7 - Feb 14, 13:08:47
git add backend/migrations/ backend/scripts/createSuperAdmin.js \
  backend/scripts/resetSuperAdminPassword.js backend/scripts/add-view-count-columns.js
git add -u backend/src/seeders/createSuperAdmin.js 2>/dev/null || true
GIT_AUTHOR_DATE="2026-02-14 13:08:47" GIT_COMMITTER_DATE="2026-02-14 13:08:47" git commit -m "superadmin scripts"

# 8 - Feb 17, 10:29:15
git add backend/src/models/index.js backend/src/utils/reminderCron.js
GIT_AUTHOR_DATE="2026-02-17 10:29:15" GIT_COMMITTER_DATE="2026-02-17 10:29:15" git commit -m "models and cron"

# 9 - Feb 19, 17:41:33
git add backend/src/routes/notificationRoutes.js
GIT_AUTHOR_DATE="2026-02-19 17:41:33" GIT_COMMITTER_DATE="2026-02-19 17:41:33" git commit -m "notification routes"

# 10 - Feb 21, 15:12:58
git add backend/__tests__/ backend/jest.config.js
GIT_AUTHOR_DATE="2026-02-21 15:12:58" GIT_COMMITTER_DATE="2026-02-21 15:12:58" git commit -m "add tests"

# 11 - Feb 23, 20:05:21
git add backend/package.json backend/package-lock.json backend/scripts/fix-postgres-app-auth.js
git add -u backend/src/middleware/errorHandler.js backend/src/middleware/upload.js \
  backend/src/middleware/uploadResume.js backend/src/test/userModel.test.js backend/models/index.js 2>/dev/null || true
GIT_AUTHOR_DATE="2026-02-23 20:05:21" GIT_COMMITTER_DATE="2026-02-23 20:05:21" git commit -m "backend cleanup"

# 12 - Feb 25, 18:27:44 (catch any remaining)
git add -A
GIT_AUTHOR_DATE="2026-02-25 18:27:44" GIT_COMMITTER_DATE="2026-02-25 18:27:44" git commit -m "frontend ui update"

echo done
