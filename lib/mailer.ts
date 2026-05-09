import nodemailer from "nodemailer"

// ---------------------------------------------------------------------------
// Transport — Resend SMTP (port 465, SSL)
// ---------------------------------------------------------------------------

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT ?? 465),
  secure: true, // required for port 465
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

// ---------------------------------------------------------------------------
// Core send — errors are caught and logged; never break the calling API route
// ---------------------------------------------------------------------------

async function sendMail({
  to,
  subject,
  html,
}: {
  to: string | string[]
  subject: string
  html: string
}) {
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to,
      subject,
      html,
    })
  } catch (err) {
    console.error("[mailer] Failed to send email:", err)
  }
}

// ---------------------------------------------------------------------------
// Minimal HTML template wrapper
// ---------------------------------------------------------------------------

function template(body: string): string {
  return `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;">
      ${body}
      <hr style="margin-top:32px;border:none;border-top:1px solid #e5e7eb;" />
      <p style="color:#9ca3af;font-size:12px;margin-top:12px;">
        Foster Connect — Internal Staff Notification
      </p>
    </div>
  `
}

// ---------------------------------------------------------------------------
// Trigger 1: Critical Medical Alert placed → all Rescue Leads
// ---------------------------------------------------------------------------

export async function sendMedicalAlertEmail({
  animalName,
  animalId,
  description,
  placedBy,
  to,
}: {
  animalName: string
  animalId: string
  description: string
  placedBy: string
  to: string[]
}) {
  if (!to.length) return
  const appUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000"
  await sendMail({
    to,
    subject: `[Foster Connect] CRITICAL Alert: ${animalName}`,
    html: template(`
      <h2 style="color:#dc2626;">⚠️ Critical Medical Alert</h2>
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="padding:6px 0;font-weight:600;">Animal</td><td>${animalName}</td></tr>
        <tr><td style="padding:6px 0;font-weight:600;">Alert</td><td>${description}</td></tr>
        <tr><td style="padding:6px 0;font-weight:600;">Placed by</td><td>${placedBy}</td></tr>
        <tr><td style="padding:6px 0;font-weight:600;">Time</td><td>${new Date().toLocaleString()}</td></tr>
      </table>
      <p style="margin-top:20px;">
        <a href="${appUrl}/animals/${animalId}" style="background:#dc2626;color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none;">
          View Animal Profile
        </a>
      </p>
    `),
  })
}

// ---------------------------------------------------------------------------
// Trigger 2: Meet & Greet scheduled → assigned Foster Parent
// ---------------------------------------------------------------------------

export async function sendMeetGreetEmail({
  animalName,
  applicantName,
  meetGreetAt,
  scheduledBy,
  to,
}: {
  animalName: string
  applicantName: string
  meetGreetAt: Date
  scheduledBy: string
  to: string
}) {
  const formatted = meetGreetAt.toLocaleString("en-US", {
    weekday: "long", year: "numeric", month: "long",
    day: "numeric", hour: "numeric", minute: "2-digit",
  })
  await sendMail({
    to,
    subject: `[Foster Connect] Meet & Greet Scheduled: ${animalName}`,
    html: template(`
      <h2>Meet & Greet Scheduled</h2>
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="padding:6px 0;font-weight:600;">Animal</td><td>${animalName}</td></tr>
        <tr><td style="padding:6px 0;font-weight:600;">Applicant</td><td>${applicantName}</td></tr>
        <tr><td style="padding:6px 0;font-weight:600;">Date & Time</td><td>${formatted}</td></tr>
        <tr><td style="padding:6px 0;font-weight:600;">Scheduled by</td><td>${scheduledBy}</td></tr>
      </table>
      <p style="margin-top:16px;color:#6b7280;">
        Please be available at the above time. Contact your Adoption Counselor with any questions.
      </p>
    `),
  })
}

// ---------------------------------------------------------------------------
// Trigger 3: Counselor recommendation submitted → all Rescue Leads
// ---------------------------------------------------------------------------

export async function sendRecommendationEmail({
  animalName,
  applicantName,
  recommendation,
  counselorName,
  applicationId,
  to,
}: {
  animalName: string
  applicantName: string
  recommendation: string
  counselorName: string
  applicationId: string
  to: string[]
}) {
  if (!to.length) return
  const appUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000"
  await sendMail({
    to,
    subject: `[Foster Connect] Adoption Recommendation Ready: ${animalName}`,
    html: template(`
      <h2>Adoption Recommendation Submitted</h2>
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="padding:6px 0;font-weight:600;">Animal</td><td>${animalName}</td></tr>
        <tr><td style="padding:6px 0;font-weight:600;">Applicant</td><td>${applicantName}</td></tr>
        <tr><td style="padding:6px 0;font-weight:600;">Recommendation</td><td><strong>${recommendation}</strong></td></tr>
        <tr><td style="padding:6px 0;font-weight:600;">Counselor</td><td>${counselorName}</td></tr>
      </table>
      <p style="margin-top:20px;">
        <a href="${appUrl}/applications/${applicationId}" style="background:#2563eb;color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none;">
          Review Application
        </a>
      </p>
    `),
  })
}

// ---------------------------------------------------------------------------
// Trigger 4: Adoption decision issued → applicant
// ---------------------------------------------------------------------------

export async function sendAdoptionDecisionEmail({
  applicantName,
  animalName,
  approved,
  to,
}: {
  applicantName: string
  animalName: string
  approved: boolean
  to: string
}) {
  if (approved) {
    await sendMail({
      to,
      subject: `[Foster Connect] Congratulations — Your Adoption Application was Approved!`,
      html: template(`
        <h2 style="color:#16a34a;">🎉 Your Application was Approved!</h2>
        <p>Dear ${applicantName},</p>
        <p>
          We are thrilled to let you know that your adoption application for
          <strong>${animalName}</strong> has been <strong>approved</strong>.
        </p>
        <p>
          A member of our team will be in touch shortly with next steps to
          complete the adoption process. Thank you for choosing to adopt!
        </p>
      `),
    })
  } else {
    await sendMail({
      to,
      subject: `[Foster Connect] Update on Your Adoption Application`,
      html: template(`
        <h2>Update on Your Application</h2>
        <p>Dear ${applicantName},</p>
        <p>
          Thank you for your interest in adopting <strong>${animalName}</strong>.
          After careful review, we are unable to move forward with your application
          at this time.
        </p>
        <p>
          We appreciate the time you took to apply and encourage you to check
          our available animals again in the future. Thank you for supporting
          animal rescue.
        </p>
      `),
    })
  }
}

// ---------------------------------------------------------------------------
// Trigger 5: Animal assigned → Foster Parent (Story 28)
// ---------------------------------------------------------------------------

export async function sendFosterAssignmentEmail({
  to,
  fosterName,
  animalName,
  animalId,
  species,
  breed,
  ageYears,
}: {
  to: string
  fosterName: string
  animalName: string
  animalId: string
  species: string
  breed: string | null
  ageYears: number | null
}) {
  const appUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000"
  const ageLabel = ageYears != null
    ? `${ageYears} yr${ageYears !== 1 ? "s" : ""}`
    : "Unknown"
  const breedLabel = breed ?? "Unknown breed"

  await sendMail({
    to,
    subject: `[Foster Connect] New Animal Assigned: ${animalName}`,
    html: template(`
      <h2>You Have a New Animal to Foster</h2>
      <p>Hi ${fosterName},</p>
      <p>
        <strong>${animalName}</strong> has been assigned to your care.
        Please review their profile and prepare for their arrival.
      </p>
      <table style="width:100%;border-collapse:collapse;margin-top:16px;">
        <tr><td style="padding:6px 0;font-weight:600;width:120px;">Animal</td><td>${animalName}</td></tr>
        <tr><td style="padding:6px 0;font-weight:600;">Species</td><td>${species}</td></tr>
        <tr><td style="padding:6px 0;font-weight:600;">Breed</td><td>${breedLabel}</td></tr>
        <tr><td style="padding:6px 0;font-weight:600;">Age</td><td>${ageLabel}</td></tr>
      </table>
      <p style="margin-top:20px;">
        <a href="${appUrl}/animals/${animalId}" style="background:#2563eb;color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none;">
          View Animal Profile
        </a>
      </p>
    `),
  })
}

// ---------------------------------------------------------------------------
// Trigger 6: Application confirmation → adopter (Story 24)
// ---------------------------------------------------------------------------

export async function sendApplicationConfirmationEmail({
  to,
  applicantName,
  animalName,
  submittedAt,
}: {
  to: string
  applicantName: string
  animalName: string
  submittedAt: Date
}) {
  const formatted = submittedAt.toLocaleString("en-US", {
    weekday: "long", year: "numeric", month: "long",
    day: "numeric", hour: "numeric", minute: "2-digit",
  })
  await sendMail({
    to,
    subject: `Your adoption application for ${animalName} has been received`,
    html: template(`
      <h2>Application Received ✓</h2>
      <p>Dear ${applicantName},</p>
      <p>
        Thank you for your interest in adopting <strong>${animalName}</strong>.
        We have received your application and our adoption team will be in touch with you soon.
      </p>
      <table style="width:100%;border-collapse:collapse;margin-top:16px;">
        <tr><td style="padding:6px 0;font-weight:600;width:120px;">Animal</td><td>${animalName}</td></tr>
        <tr><td style="padding:6px 0;font-weight:600;">Submitted</td><td>${formatted}</td></tr>
      </table>
      <p style="margin-top:16px;color:#6b7280;">
        If you have any questions in the meantime, please reply to this email or contact us directly.
        We look forward to speaking with you!
      </p>
    `),
  })
}

// ---------------------------------------------------------------------------
// Trigger 6: Meet & Greet scheduled → adopter (Story 27)
// ---------------------------------------------------------------------------

export async function sendMeetGreetAdopterEmail({
  to,
  applicantName,
  animalName,
  meetGreetAt,
}: {
  to: string
  applicantName: string
  animalName: string
  meetGreetAt: Date
}) {
  const formatted = meetGreetAt.toLocaleString("en-US", {
    weekday: "long", year: "numeric", month: "long",
    day: "numeric", hour: "numeric", minute: "2-digit",
  })
  await sendMail({
    to,
    subject: `Meet & Greet Scheduled — ${animalName}`,
    html: template(`
      <h2>Your Meet & Greet is Scheduled!</h2>
      <p>Dear ${applicantName},</p>
      <p>
        Great news — a Meet &amp; Greet has been arranged for your adoption
        application for <strong>${animalName}</strong>.
      </p>
      <table style="width:100%;border-collapse:collapse;margin-top:16px;">
        <tr><td style="padding:6px 0;font-weight:600;width:120px;">Animal</td><td>${animalName}</td></tr>
        <tr><td style="padding:6px 0;font-weight:600;">Date &amp; Time</td><td><strong>${formatted}</strong></td></tr>
      </table>
      <p style="margin-top:16px;color:#6b7280;">
        Please contact us to confirm your attendance. We look forward to meeting you!
      </p>
    `),
  })
}

// ---------------------------------------------------------------------------
// Trigger 7: New public application received → all Adoption Counselors
// ---------------------------------------------------------------------------

export async function sendNewApplicationEmail({
  animalName,
  applicantName,
  applicationId,
  submittedAt,
  to,
}: {
  animalName: string
  applicantName: string
  applicationId: string
  submittedAt: Date
  to: string[]
}) {
  if (!to.length) return
  const appUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000"
  await sendMail({
    to,
    subject: `[Foster Connect] New Application: ${animalName}`,
    html: template(`
      <h2>New Adoption Application Received</h2>
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="padding:6px 0;font-weight:600;">Animal</td><td>${animalName}</td></tr>
        <tr><td style="padding:6px 0;font-weight:600;">Applicant</td><td>${applicantName}</td></tr>
        <tr><td style="padding:6px 0;font-weight:600;">Submitted</td><td>${submittedAt.toLocaleString()}</td></tr>
      </table>
      <p style="margin-top:20px;">
        <a href="${appUrl}/applications/${applicationId}" style="background:#2563eb;color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none;">
          Review Application
        </a>
      </p>
    `),
  })
}
