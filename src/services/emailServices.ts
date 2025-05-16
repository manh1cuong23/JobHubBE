import nodemailer from 'nodemailer';
import fs from 'fs';
import { env } from '~/constants/config';
import { SendEmail } from '~/constants/enum';
import path from 'path';
interface InterviewInfo {
  date: string;
  time: string;
  type: 'offline' | 'online';
  address: string;
  location?: string;
  note:string
  interviewerName: string;
}
interface PassInterviewInfo {
  startDate: string;
  workingForm: string;
  contactEmail: string;
  contactPhone: string;
}
interface InviteCandidateInfo {
  location: string;
  workingForm: string;
}
interface ScheduleChangeInfo {
  oldSchedule: string;
  newSchedule: string;
  reason: string;
}
export const sendVerifyEmail = async (toAddress: string, token: string, type: SendEmail) => {
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: env.emailApp,
      pass: env.emailAppPassword
    }
  });

  const template = fs.readFileSync(path.resolve('src/templates/templateVerifyEmail.html'), 'utf8');
  let body = '';
  let subject = '';
    console.log("env.clientUrl",env.clientUrl)
  if (type === SendEmail.VerifyEmail) {
    subject = env.subjectEmailVerifyEmail as string;
    body = template
      .replace('{{title}}', env.titleEmailVerifyEmail as string)
      .replace('{{content}}', env.contentEmailVerifyEmail as string)
      .replace('{{verifyLink}}', `${env.clientUrl}/verify-email?token=${token}`);
  } else if (type === SendEmail.ForgotPassword) {
    subject = env.subjectEmailForgotPassword as string;
    body = template
      .replace('{{title}}', env.titleEmailForgotPassword as string)
      .replace('{{content}}', env.contentEmailForgotPassword as string)
      .replace('{{verifyLink}}', `${env.clientUrl}/reset-password?token=${token}`);
  }

  try {
    const info = await transporter.sendMail({
      from: '"JobHub" <vocuong.jobhub@gmail.com>', // Sửa lại from cho hợp lệ
      to: toAddress,
      subject: subject,
      html: body
    });
    console.log('Email sent: ' + info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending email: ', error);
    throw error;
  }
};

export const sendMailSuitableCV = async (payload: {
  toAddress: string;
  candidateName: string;
  employerName: string;
  jobTitle: string;
}) => {
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: env.emailApp,
      pass: env.emailAppPassword
    }
  });

  const template = fs.readFileSync(path.resolve('src/templates/suitableCV.html'), 'utf8');
  const body = template
    .replace(/{{yourWebsiteName}}/g, 'JobHub')
    .replace('{{candidateName}}', payload.candidateName)
    .replace('{{employerName}}', payload.employerName)
    .replace('{{jobTitle}}', payload.jobTitle)
    .replace('{{websiteUrl}}', env.clientUrl);

  try {
    const info = await transporter.sendMail({
      from: '"JobHub" <vocuong.jobhub@gmail.com>',
      to: payload.toAddress,
      subject: 'Thông báo CV của bạn phù hợp với công việc',
      html: body
    });
    console.log('Email sent: ' + info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending email: ', error);
    throw error;
  }
};

export const sendMailApplyCV = async (payload: {
  toAddress: string;
  candidateName: string;
  employerName: string;
  jobTitle: string;
}) => {
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: env.emailApp,
      pass: env.emailAppPassword
    }
  });

  const template = fs.readFileSync(path.resolve('src/templates/applyCV.html'), 'utf8');
  const body = template
    .replace(/{{yourWebsiteName}}/g, 'JobHub')
    .replace('{{candidateName}}', payload.candidateName)
    .replace('{{employerName}}', payload.employerName)
    .replace('{{jobTitle}}', payload.jobTitle)
    .replace('{{websiteUrl}}', env.clientUrl);

  try {
    const info = await transporter.sendMail({
      from: '"JobHub" <vocuong.jobhub@gmail.com>',
      to: payload.toAddress,
      subject: 'Thông báo bạn đã ứng tuyển thành công',
      html: body
    });
    console.log('Email sent: ' + info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending email: ', error);
    throw error;
  }
};

export const sendMailUnsuitableCV = async (payload: {
  toAddress: string;
  candidateName: string;
  employerName: string;
  jobTitle: string;
}) => {
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: env.emailApp,
      pass: env.emailAppPassword
    }
  });

  const template = fs.readFileSync(path.resolve('src/templates/unsuitableCV.html'), 'utf8');
  const body = template
    .replace(/{{yourWebsiteName}}/g, 'JobHub')
    .replace('{{candidateName}}', payload.candidateName)
    .replace('{{employerName}}', payload.employerName)
    .replace('{{jobTitle}}', payload.jobTitle)
    .replace('{{websiteUrl}}', env.clientUrl)
    .replace('{{logoUrl}}', `${env.clientUrl}/images/logo.png`)
    .replace('{{jobListLink}}', `${env.clientUrl}/jobs`);

  try {
    const info = await transporter.sendMail({
      from: '"JobHub" <vocuong.jobhub@gmail.com>',
      to: payload.toAddress,
      subject: 'Thông báo kết quả xét duyệt hồ sơ',
      html: body
    });
    console.log('Email sent: ' + info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending email: ', error);
    throw error;
  }
};

export const sendMailInviteInterview = async (payload: {
  toAddress: string;
  candidateName: string;
  employerName: string;
  jobTitle: string;
  interview: InterviewInfo;
  contactEmail: string;
}) => {
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: env.emailApp,
      pass: env.emailAppPassword
    }
  });

  const template = fs.readFileSync(path.resolve('src/templates/inviteInterview.html'), 'utf8');
  console.log('interviewLink:', payload?.interview?.address);
  
const dateObj = new Date(payload.interview.date);

// Format thành dd/mm/yyyy
const date = dateObj.toLocaleDateString('vi-VN'); // ví dụ: 16/05/2025

// Format thành hh:mm
const time = dateObj.toLocaleTimeString('vi-VN', {
  hour: '2-digit',
  minute: '2-digit',
}); //
  const body = template
    .replace(/{{yourWebsiteName}}/g, 'JobHub')
    .replace('{{candidateName}}', payload.candidateName)
    .replace(/{{employerName}}/g, payload.employerName)
    .replace('{{jobTitle}}', payload.jobTitle)
    .replace('{{websiteUrl}}', env.clientUrl)
    .replace('{{logoUrl}}', `${env.clientUrl}/images/logo.png`)
    .replace('{{interviewDate}}', date)
    .replace('{{interviewTime2}}', time)
    .replace('{{interviewTime}}', payload.interview.time)
    .replace('{{interviewNote}}', payload.interview.note || '')
    .replace('{{interviewType}}', payload.interview.type === 'online' ? 'Phỏng vấn online' : 'Phỏng vấn trực tiếp')
    .replace(/{{interviewLink}}/g, payload.interview.address || '')
    .replace('{{interviewLocation}}', payload.interview.location || 'N/A')
    .replace('{{interviewerName}}', payload.interview.interviewerName)
    .replace(/{{contactEmail}}/g, payload.contactEmail)
    .replace('{{interviewConfirmationLink}}', `${env.clientUrl}/apply-jobs`);

  try {
    const info = await transporter.sendMail({
      from: '"JobHub" <vocuong.jobhub@gmail.com>',
      to: payload.toAddress,
      subject: 'Thư mời phỏng vấn',
      html: body
    });
    console.log('Email sent: ' + info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending email: ', error);
    throw error;
  }
};

export const sendMailPassInterview = async (payload: {
  toAddress: string;
  candidateName: string;
  employerName: string;
  jobTitle: string;
}) => {
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: env.emailApp,
      pass: env.emailAppPassword
    }
  });

  const template = fs.readFileSync(path.resolve('src/templates/passInterview.html'), 'utf8');
  const body = template
    .replace(/{{yourWebsiteName}}/g, 'JobHub')
    .replace('{{candidateName}}', payload.candidateName)
    .replace('{{employerName}}', payload.employerName)
    .replace('{{jobTitle}}', payload.jobTitle)
    .replace('{{websiteUrl}}', env.clientUrl)
    .replace('{{logoUrl}}', `${env.clientUrl}/images/logo.png`)
    .replace('{{confirmLink}}', `${env.clientUrl}/confirm-job/${payload.jobTitle}`);

  try {
    const info = await transporter.sendMail({
      from: '"JobHub" <vocuong.jobhub@gmail.com>',
      to: payload.toAddress,
      subject: 'Chúc mừng! Bạn đã vượt qua vòng phỏng vấn',
      html: body
    });
    console.log('Email sent: ' + info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending email: ', error);
    throw error;
  }
};

export const sendMailFailInterview = async (payload: {
  toAddress: string;
  candidateName: string;
  employerName: string;
  jobTitle: string;
}) => {
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: env.emailApp,
      pass: env.emailAppPassword
    }
  });

  const template = fs.readFileSync(path.resolve('src/templates/failInterview.html'), 'utf8');
  const body = template
    .replace(/{{yourWebsiteName}}/g, 'JobHub')
    .replace('{{candidateName}}', payload.candidateName)
    .replace('{{employerName}}', payload.employerName)
    .replace('{{jobTitle}}', payload.jobTitle)
    .replace('{{websiteUrl}}', env.clientUrl)
    .replace('{{logoUrl}}', `${env.clientUrl}/images/logo.png`);

  try {
    const info = await transporter.sendMail({
      from: '"JobHub" <vocuong.jobhub@gmail.com>',
      to: payload.toAddress,
      subject: 'Thông báo kết quả phỏng vấn',
      html: body
    });
    console.log('Email sent: ' + info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending email: ', error);
    throw error;
  }
};

export const sendMailInviteCandidate = async (payload: {
  toAddress: string;
  candidateName: string;
  employerName: string;
  jobTitle: string;
  jobId: string;
}) => {
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: env.emailApp,
      pass: env.emailAppPassword
    }
  });

  const template = fs.readFileSync(path.resolve('src/templates/inviteCandidate.html'), 'utf8');
  const body = template
    .replace(/{{yourWebsiteName}}/g, 'JobHub')
    .replace('{{candidateName}}', payload.candidateName)
    .replace('{{employerName}}', payload.employerName)
    .replace('{{jobTitle}}', payload.jobTitle)
    .replace('{{websiteUrl}}', env.clientUrl)
    .replace('{{logoUrl}}', `${env.clientUrl}/images/logo.png`)

    .replace('{{jobLink}}', `${env.clientUrl}/invite-jobs`);
  console.log("pay;load",payload)
  try {
    const info = await transporter.sendMail({
      from: '"JobHub" <vocuong.jobhub@gmail.com>',
      to: payload.toAddress,
      subject: 'Lời mời ứng tuyển từ ' + payload.employerName,
      html: body
    });
    console.log('Email sent: ' + info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending email: ', error);
    throw error;
  }
};

export const sendMailCandidateAcceptInvite = async (payload: {
  toAddress: string;
  candidateName: string;
  employerName: string;
  jobTitle: string;
  acceptedDate: string;
  employerId: string;
}) => {
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: env.emailApp,
      pass: env.emailAppPassword
    }
  });

  const template = fs.readFileSync(path.resolve('src/templates/candidateAcceptInvite.html'), 'utf8');
  const body = template
    .replace(/{{yourWebsiteName}}/g, 'JobHub')
    .replace(/{{candidateName}}/g, payload.candidateName)
    .replace('{{employerName}}', payload.employerName)
    .replace('{{jobTitle}}', payload.jobTitle)
    .replace('{{websiteUrl}}', env.clientUrl)
    .replace('{{logoUrl}}', `${env.clientUrl}/images/logo.png`)
    .replace('{{acceptedDate}}', payload.acceptedDate)
    .replace('{{employerDashboardUrl}}', `${env.clientUrl}/employer/${payload.employerId}/candidates`);

  try {
    const info = await transporter.sendMail({
      from: '"JobHub" <vocuong.jobhub@gmail.com>',
      to: payload.toAddress,
      subject: 'Ứng viên ' + payload.candidateName + ' đã chấp nhận lời mời',
      html: body
    });
    console.log('Email sent: ' + info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending email: ', error);
    throw error;
  }
};

export const sendMailCandidateChangeSchedule = async (payload: {
  toAddress: string;
  candidateName: string;
  employerName: string;
  jobTitle: string;
  scheduleChange: any;
  jobId: string;
}) => {
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: env.emailApp,
      pass: env.emailAppPassword
    }
  });

  const template = fs.readFileSync(path.resolve('src/templates/candidateChangeSchedule.html'), 'utf8');
const dateObj = new Date(payload.scheduleChange.date);

// Format thành dd/mm/yyyy
const date = dateObj.toLocaleDateString('vi-VN'); // ví dụ: 16/05/2025

// Format thành hh:mm
const time = dateObj.toLocaleTimeString('vi-VN', {
  hour: '2-digit',
  minute: '2-digit',
}); //25

  const body = template
    .replace(/{{yourWebsiteName}}/g, 'JobHub')
    .replace('{{candidateName}}', payload.candidateName)
    .replace('{{employerName}}', payload.employerName)
    .replace('{{jobTitle}}', payload.jobTitle)
    .replace('{{websiteUrl}}', env.clientUrl)
    .replace('{{logoUrl}}', `${env.clientUrl}/images/logo.png`)
    .replace('{{date}}', date)
    .replace('{{time}}', time)
    .replace(/{{address}}/g, payload.scheduleChange.address)
    .replace('{{reason}}', payload.scheduleChange.note)
    .replace('{{interviewDashboardUrl}}', `${env.clientUrl}/recruiter/management/job`);

  try {
    const info = await transporter.sendMail({
      from: '"JobHub" <vocuong.jobhub@gmail.com>',
      to: payload.toAddress,
      subject: 'Ứng viên ' + payload.candidateName + ' đề nghị thay đổi lịch phỏng vấn',
      html: body
    });
    console.log('Email sent: ' + info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending email: ', error);
    throw error;
  }
};
