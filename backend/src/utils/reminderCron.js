const cron = require('node-cron');
const { Op } = require('sequelize');
const { Application, User, Job, CompanyProfile } = require('../models');
const sendEmail = require('./sendEmail');

const getTomorrowRange = () => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() + 1);

  const end = new Date(start);
  end.setHours(23, 59, 59, 999);

  return { start, end };
};

const parseInterviewDetails = (message) => {
  const text = String(message || '');
  let mode = '';
  let link = '';

  text.split('\n').forEach((line) => {
    const trimmed = line.trim();
    const modeMatch = trimmed.match(/^mode\s*:\s*(.+)$/i);
    const meetingMatch = trimmed.match(/^meeting\s*link\s*:\s*(.+)$/i);
    const locationMatch = trimmed.match(/^location\s*(?:\(maps\))?\s*:\s*(.+)$/i);

    if (modeMatch) mode = modeMatch[1].trim();
    if (meetingMatch) link = meetingMatch[1].trim();
    if (locationMatch) link = locationMatch[1].trim();
  });

  return { mode, link };
};

const sendInterviewReminderEmails = async () => {
  try {
    const { start, end } = getTomorrowRange();

    const applications = await Application.findAll({
      where: {
        interviewDate: { [Op.between]: [start, end] },
        status: {
          [Op.in]: ['Interview Scheduled', 'interview_scheduled']
        }
      },
      include: [
        { model: User, attributes: ['id', 'name', 'email'] },
        {
          model: Job,
          attributes: ['id', 'title'],
          include: [{ model: CompanyProfile, attributes: ['companyName'] }]
        }
      ]
    });

    for (const application of applications) {
      const student = application.User;
      const job = application.Job;
      if (!student?.email || !job) continue;

      const companyName = job.CompanyProfile?.companyName || 'Company';
      const time = application.interviewTime || 'TBD';
      const interviewDate = application.interviewDate
        ? new Date(application.interviewDate).toLocaleDateString('en-NP', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long'
          })
        : 'Tomorrow';
      const details = parseInterviewDetails(application.interviewMessage);
      const mode = details.mode || 'Online/In-person';
      const locationOrLink = details.link || '';

      const isOnline = mode.toLowerCase().includes('online');
      const subject = `Interview Reminder: Tomorrow at ${time} with ${companyName}`;
      const html = `
        <p>Hi ${student.name || 'Student'},</p>
        <p>This is a reminder that you have an interview tomorrow!</p>
        <p><strong>Details:</strong></p>
        <ul>
          <li><strong>Company:</strong> ${companyName}</li>
          <li><strong>Position:</strong> ${job.title || 'N/A'}</li>
          <li><strong>Date:</strong> ${interviewDate}</li>
          <li><strong>Time:</strong> ${time}</li>
          <li><strong>Mode:</strong> ${mode}</li>
          ${locationOrLink ? `<li><strong>${isOnline ? 'Join link' : 'Location'}:</strong> ${locationOrLink}</li>` : ''}
        </ul>
        <p>Good luck! 🍀</p>
        <p>InternNepal Team</p>
      `;

      await sendEmail({
        to: student.email,
        subject,
        html
      });
    }

    console.info(`[Cron] Interview reminder job done. Sent for ${applications.length} application(s).`);
  } catch (error) {
    console.error('[Cron] Interview reminder job failed:', error.message);
  }
};

const startReminderCronJobs = () => {
  // Daily at 9:00 AM server local time
  cron.schedule('0 9 * * *', sendInterviewReminderEmails);
  console.info('[Cron] Interview reminder scheduler started (0 9 * * *).');
};

module.exports = {
  startReminderCronJobs,
  sendInterviewReminderEmails
};
