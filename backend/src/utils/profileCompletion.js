const { CompanyProfile, StudentProfile } = require('../models');

const hasText = (value) => {
  if (value === null || value === undefined) return false;
  if (typeof value === 'number') return Number.isFinite(value);
  return String(value).trim().length > 0;
};

const evaluateChecklist = (checklist) => {
  const requiredFields = Object.keys(checklist);
  const missingFields = requiredFields.filter((field) => !checklist[field]);

  return {
    completed: missingFields.length === 0,
    requiredFields,
    missingFields
  };
};

const buildStudentCompletion = ({ user, studentProfile }) => {
  const checklist = {
    name: hasText(user?.name),
    phone: hasText(user?.phone),
    university: hasText(studentProfile?.university),
    major: hasText(studentProfile?.major),
    graduationYear: hasText(studentProfile?.graduationYear),
    resumeUrl: hasText(studentProfile?.resumeUrl)
  };

  return {
    role: 'student',
    ...evaluateChecklist(checklist)
  };
};

const buildCompanyCompletion = ({ companyProfile }) => {
  const checklist = {
    companyName: hasText(companyProfile?.companyName),
    industry: hasText(companyProfile?.industry),
    tagline: hasText(companyProfile?.tagline),
    about: hasText(companyProfile?.about),
    companySize: hasText(companyProfile?.companySize),
    foundedYear: hasText(companyProfile?.foundedYear),
    location: hasText(companyProfile?.location),
    phone: hasText(companyProfile?.phone)
  };

  return {
    role: 'company',
    ...evaluateChecklist(checklist)
  };
};

const getProfileCompletionForUser = async (user, profiles = {}) => {
  const role = String(user?.role || '').toLowerCase();
  let { studentProfile, companyProfile } = profiles;

  if (role === 'student') {
    if (!studentProfile) {
      studentProfile = await StudentProfile.findOne({
        where: { userId: user.id },
        attributes: ['id', 'university', 'major', 'graduationYear', 'resumeUrl']
      });
    }
    return buildStudentCompletion({ user, studentProfile });
  }

  if (role === 'company') {
    if (!companyProfile) {
      companyProfile = await CompanyProfile.findOne({
        where: { userId: user.id },
        attributes: [
          'id',
          'companyName',
          'industry',
          'tagline',
          'about',
          'companySize',
          'foundedYear',
          'location',
          'phone'
        ]
      });
    }
    return buildCompanyCompletion({ companyProfile });
  }

  return {
    role,
    completed: true,
    requiredFields: [],
    missingFields: []
  };
};

module.exports = {
  getProfileCompletionForUser
};
