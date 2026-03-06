import nodemailer from 'nodemailer';
import { config } from '../config/env';

// Create reusable transporter object using SMTP transport
const transporter = nodemailer.createTransport({
  host: config.email.host,
  port: config.email.port,
  secure: config.email.secure, // true for 465, false for other ports
  auth: config.email.auth.user ? {
    user: config.email.auth.user,
    pass: config.email.auth.pass,
  } : undefined,
});

export interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

export interface DigestEmailActivity {
  actorName: string;
  type: string;
  createdAt: Date;
  resourceLink?: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface ProjectDigestData {
  projectId: string;
  projectName: string;
  projectSlug: string;
  projectImage?: string | null;
  activities: DigestEmailActivity[];
}

/**
 * Send an email using the configured transporter
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  // Skip sending if email is not configured
  if (!config.email.enabled) {
    console.log('[Email] Email sending is disabled. Would have sent:', options.subject);
    return false;
  }

  try {
    await transporter.sendMail({
      from: config.email.from,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });
    console.log(`[Email] Sent email to ${options.to}: ${options.subject}`);
    return true;
  } catch (error) {
    console.error('[Email] Failed to send email:', error);
    return false;
  }
}

/**
 * Send a notification email
 */
export async function sendNotificationEmail(
  to: string,
  title: string,
  message: string,
  resourceLink?: string
): Promise<boolean> {
  const baseUrl = config.email.appUrl;
  const fullLink = resourceLink ? `${baseUrl}${resourceLink}` : undefined;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; border-top: none; }
        .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 16px; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0; font-size: 24px;">BandMate</h1>
        </div>
        <div class="content">
          <h2 style="margin-top: 0;">${title}</h2>
          <p>${message}</p>
          ${fullLink ? `<a href="${fullLink}" class="button">View in BandMate</a>` : ''}
        </div>
        <div class="footer">
          <p>This is an automated notification from BandMate.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `${title}\n\n${message}${fullLink ? `\n\nView in BandMate: ${fullLink}` : ''}`;

  return sendEmail({
    to,
    subject: `[BandMate] ${title}`,
    text,
    html,
  });
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatActivityDescription(type: string, metadata?: Record<string, unknown> | null): string {
  const m = metadata || {};
  const cutName = m.cutName as string | undefined;
  const vibeName = m.vibeName as string | undefined;
  const fileName = m.fileName as string | undefined;
  const memberName = m.memberName as string | undefined;
  const fromVibeName = m.fromVibeName as string | undefined;
  const toVibeName = m.toVibeName as string | undefined;

  // Helper to build "on <cut> in <vibe>" suffix
  const onCut = cutName ? ` on "${cutName}"` : '';
  const inVibe = vibeName ? ` in ${vibeName}` : '';

  switch (type) {
    case 'file_uploaded':
      return `uploaded ${fileName ? `"${fileName}"` : 'a file'}${onCut}${inVibe}`;
    case 'file_shared':
      return `shared ${fileName ? `"${fileName}"` : 'a file'}${onCut}${inVibe}`;
    case 'file_deleted':
      return `deleted ${fileName ? `"${fileName}"` : 'a file'}${onCut}${inVibe}`;
    case 'cut_created':
      return `created cut "${cutName || 'Untitled'}"${inVibe}`;
    case 'cut_updated':
      return `updated cut "${cutName || 'Untitled'}"${inVibe}`;
    case 'cut_deleted':
      return `deleted cut "${cutName || 'Untitled'}"${inVibe}`;
    case 'cut_moved':
      return `moved cut "${cutName || 'Untitled'}" from ${fromVibeName || 'a vibe'} to ${toVibeName || 'another vibe'}`;
    case 'comment_added':
      return `commented${onCut}${inVibe}`;
    case 'vibe_created':
      return `created vibe "${vibeName || 'Untitled'}"`;
    case 'vibe_updated':
      return `updated vibe "${vibeName || 'Untitled'}"`;
    case 'vibe_deleted':
      return `deleted vibe "${vibeName || 'Untitled'}"`;
    case 'lyrics_updated':
      return `updated lyrics${onCut}${inVibe}`;
    case 'member_invited':
    case 'member_added':
      return `added ${memberName || 'a new member'} to the project`;
    case 'member_removed':
      return `removed ${memberName || 'a member'} from the project`;
    case 'project_created':
      return 'created this project';
    case 'project_updated':
      return 'updated the project';
    default:
      return type.replace(/_/g, ' ');
  }
}

/**
 * Render a single activity item for email display
 */
function renderActivityItem(activity: DigestEmailActivity, baseUrl: string): string {
  const actionLabel = formatActivityDescription(activity.type, activity.metadata);
  const safeActor = escapeHtml(activity.actorName);
  const safeAction = escapeHtml(actionLabel);
  const timeLabel = activity.createdAt.toLocaleString();
  const link = activity.resourceLink ? `${baseUrl}${activity.resourceLink}` : null;

  return `
    <tr>
      <td style="padding: 10px 16px; border-bottom: 1px solid #1e293b;">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
          <tr>
            <td style="font-size: 14px; color: #e2e8f0; padding-bottom: 2px;">
              <span style="font-weight: 600; color: #f8fafc;">${safeActor}</span> ${safeAction}
            </td>
            ${link ? `<td style="text-align: right; white-space: nowrap; vertical-align: top;"><a href="${link}" style="color: #22c55e; text-decoration: none; font-size: 13px; font-weight: 500;">View &#8594;</a></td>` : ''}
          </tr>
          <tr>
            <td colspan="2" style="font-size: 12px; color: #94a3b8; padding-top: 2px;">${escapeHtml(timeLabel)}</td>
          </tr>
        </table>
      </td>
    </tr>
  `;
}

/**
 * Render a project card for digest email
 */
function renderProjectCard(projectData: ProjectDigestData, baseUrl: string): string {
  const safeProjectName = escapeHtml(projectData.projectName);
  const imageUrl = projectData.projectImage
    ? `${baseUrl}/${projectData.projectImage}`
    : null;

  const activities = projectData.activities
    .map((activity) => renderActivityItem(activity, baseUrl))
    .join('');

  const projectUrl = `${baseUrl}/projects/${projectData.projectSlug}`;

  // Project image section: show image if available, otherwise show styled initial
  const imageSection = imageUrl
    ? `
      <td style="padding: 0; background: #0f172a;">
        <img src="${imageUrl}" alt="${safeProjectName}" width="600" style="width: 100%; max-width: 600px; height: 180px; object-fit: cover; display: block;" />
      </td>
    `
    : `
      <td style="padding: 0; height: 80px; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); text-align: center; vertical-align: middle;">
        <span style="font-size: 36px; font-weight: 800; color: #22c55e; letter-spacing: 2px;">${safeProjectName.charAt(0).toUpperCase()}</span>
      </td>
    `;

  return `
    <!--[if mso]><table width="100%" cellpadding="0" cellspacing="0"><tr><td><![endif]-->
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom: 16px; border-radius: 12px; overflow: hidden; border: 1px solid #334155; background: #1e293b;">
      <!-- Project Image / Fallback -->
      <tr>
        ${imageSection}
      </tr>
      <!-- Project Name + Activity Count -->
      <tr>
        <td style="padding: 16px 16px 8px 16px;">
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
            <tr>
              <td style="font-size: 20px; font-weight: 700; color: #f8fafc;">${safeProjectName}</td>
              <td style="text-align: right; font-size: 12px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; white-space: nowrap;">
                ${projectData.activities.length} ${projectData.activities.length === 1 ? 'update' : 'updates'}
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <!-- Activity List -->
      <tr>
        <td style="padding: 0 0 4px 0;">
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
            ${activities}
          </table>
        </td>
      </tr>
      <!-- View Project Button -->
      <tr>
        <td style="padding: 8px 16px 16px 16px;">
          <table cellpadding="0" cellspacing="0" role="presentation">
            <tr>
              <td style="border-radius: 8px; background: #22c55e;">
                <a href="${projectUrl}" style="display: inline-block; padding: 8px 20px; color: #ffffff; font-size: 13px; font-weight: 600; text-decoration: none;">View Project &#8594;</a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
    <!--[if mso]></td></tr></table><![endif]-->
  `;
}

/**
 * Send a user digest email with activities from multiple projects
 */
export async function sendUserDigestEmail(
  to: string,
  recipientName: string,
  projectDigests: ProjectDigestData[]
): Promise<boolean> {
  if (projectDigests.length === 0) {
    return true;
  }

  const baseUrl = config.email.appUrl;
  const appUrl = baseUrl;
  const totalActivities = projectDigests.reduce((sum, p) => sum + p.activities.length, 0);
  const subject = `[BandMate] Your activity digest – ${totalActivities} ${totalActivities === 1 ? 'update' : 'updates'}`;

  const projectCards = projectDigests.map((project) => renderProjectCard(project, baseUrl)).join('');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${escapeHtml(subject)}</title>
      <!--[if mso]>
      <noscript>
        <xml>
          <o:OfficeDocumentSettings>
            <o:PixelsPerInch>96</o:PixelsPerInch>
          </o:OfficeDocumentSettings>
        </xml>
      </noscript>
      <![endif]-->
    </head>
    <body style="margin: 0; padding: 0; background-color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #e2e8f0; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%;">
      <!-- Outer wrapper -->
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color: #0f172a;">
        <tr>
          <td align="center" style="padding: 24px 16px;">
            <!-- Inner container -->
            <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width: 600px;">
              <!-- Header -->
              <tr>
                <td style="padding: 32px 24px; text-align: center; border-bottom: 1px solid #334155;">
                  <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                    <tr>
                      <td style="text-align: center;">
                        <span style="font-size: 28px; font-weight: 800; color: #f8fafc; letter-spacing: -0.5px;">BandMate</span>
                      </td>
                    </tr>
                    <tr>
                      <td style="text-align: center; padding-top: 4px;">
                        <span style="font-size: 13px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 500;">Activity Digest</span>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Greeting -->
              <tr>
                <td style="padding: 28px 24px 8px 24px;">
                  <p style="margin: 0 0 4px 0; font-size: 20px; font-weight: 700; color: #f8fafc;">Hi ${escapeHtml(recipientName)},</p>
                  <p style="margin: 0; font-size: 15px; color: #94a3b8;">Your <span style="font-weight: 700; color: #22c55e;">BandMates</span> have been busy. Here is what you may have missed.</p>
                </td>
              </tr>

              <!-- Divider -->
              <tr>
                <td style="padding: 16px 24px 0 24px;">
                  <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                    <tr><td style="border-bottom: 1px solid #334155; font-size: 0; line-height: 0;">&nbsp;</td></tr>
                  </table>
                </td>
              </tr>

              <!-- Project Cards -->
              <tr>
                <td style="padding: 20px 24px;">
                  ${projectCards}
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="padding: 24px 24px 16px 24px; text-align: center; border-top: 1px solid #334155;">
                  <p style="margin: 0 0 8px 0; font-size: 12px; color: #64748b;">This is an automated digest from <a href="${appUrl}" style="color: #22c55e; text-decoration: none;">BandMate</a>.</p>
                  <p style="margin: 0; font-size: 12px; color: #64748b;">You can manage your notification preferences on each project page.</p>
                </td>
              </tr>

              <!-- Support & Links -->
              <tr>
                <td style="padding: 0 24px 32px 24px; text-align: center;">
                  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-top: 16px; border-radius: 8px; background: #1e293b; border: 1px solid #334155;">
                    <tr>
                      <td style="padding: 16px 20px; text-align: center;">
                        <p style="margin: 0 0 8px 0; font-size: 13px; color: #94a3b8;">Enjoying <span style="font-weight: 700; color: #f8fafc;">BandMate</span>? Help support the project!</p>
                        <table cellpadding="0" cellspacing="0" role="presentation" style="margin: 0 auto;">
                          <tr>
                            <td style="padding: 0 6px;">
                              <a href="https://ko-fi.com/mrgrimothy" style="display: inline-block; padding: 6px 16px; font-size: 12px; font-weight: 600; color: #f8fafc; background: #22c55e; border-radius: 6px; text-decoration: none;">Support on Ko-fi</a>
                            </td>
                            <td style="padding: 0 6px;">
                              <a href="https://grimothy.github.io/BandMate_site/" style="display: inline-block; padding: 6px 16px; font-size: 12px; font-weight: 600; color: #94a3b8; background: #334155; border-radius: 6px; text-decoration: none;">Documentation</a>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  const textItems = projectDigests
    .map((project) => {
      const activities = project.activities
        .map((activity) => {
          const actionLabel = formatActivityDescription(activity.type, activity.metadata);
          const link = activity.resourceLink ? `${baseUrl}${activity.resourceLink}` : '';
          return `  • ${activity.actorName} ${actionLabel} (${activity.createdAt.toISOString()})${link ? `\n    ${link}` : ''}`;
        })
        .join('\n');

      return `${project.projectName}\n${activities}`;
    })
    .join('\n\n');

  const text = `Hi ${recipientName},\n\nYour BandMates have been busy!\n\n${textItems}\n\nVisit ${appUrl} to see more.\n`;

  return sendEmail({
    to,
    subject,
    text,
    html,
  });
}

/**
 * Send a single project digest email (backward compatibility)
 */
export async function sendProjectDigestEmail(
  to: string,
  recipientName: string,
  projectName: string,
  activities: DigestEmailActivity[],
  projectSlug?: string,
  projectImage?: string | null
): Promise<boolean> {
  if (activities.length === 0) {
    return true;
  }

  const projectData: ProjectDigestData = {
    projectId: '',
    projectName,
    projectSlug: projectSlug || projectName.toLowerCase().replace(/\s+/g, '-'),
    projectImage,
    activities,
  };

  return sendUserDigestEmail(to, recipientName, [projectData]);
}
