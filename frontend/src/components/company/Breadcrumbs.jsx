import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home } from 'lucide-react';

const Breadcrumbs = () => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  // Filter out 'company' and 'dashboard' from pathnames
  const filteredPathnames = pathnames.filter(
    (name) => name !== 'company' && name !== 'dashboard'
  );

  const breadcrumbNameMap = {
    '': 'Dashboard',
    'my-listings': 'My Postings',
    'post-internship': 'Post New Internship',
    'applications': 'Applications',
    'shortlisted': 'Shortlisted',
    'browse-candidates': 'Browse Candidates',
    'analytics': 'Analytics',
    'profile': 'Company Profile',
    'settings': 'Settings',
  };

  // If we're on the root dashboard, don't show breadcrumbs
  if (filteredPathnames.length === 0) {
    return null;
  }

  return (
    <nav className="mb-6 flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
      <Link
        to="/company/dashboard"
        className="flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400"
      >
        <Home size={16} />
        <span>Dashboard</span>
      </Link>

      {filteredPathnames.map((name, index) => {
        const routeTo = `/company/dashboard/${filteredPathnames
          .slice(0, index + 1)
          .join('/')}`;
        const isLast = index === filteredPathnames.length - 1;
        const breadcrumbName = breadcrumbNameMap[name] || name;

        return (
          <React.Fragment key={name}>
            {isLast ? (
              <span className="font-medium text-gray-900 dark:text-white">/ {breadcrumbName}</span>
            ) : (
              <Link to={routeTo} className="hover:text-blue-700 dark:hover:text-blue-400 text-gray-700 dark:text-gray-200">
                / {breadcrumbName}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};

export default Breadcrumbs;
