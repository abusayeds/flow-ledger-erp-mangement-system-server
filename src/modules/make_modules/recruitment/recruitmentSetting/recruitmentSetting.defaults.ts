/**
 * Starter content for the list-shaped Recruitment System Setup panels.
 *
 * Seeded on first read (same pattern as the offer letter template) so a company
 * opening the screen sees usable content instead of an empty list. Kept
 * deliberately generic — no company name, email or phone — because this is
 * written into a real tenant's settings and is meant to be edited, not shipped
 * as-is.
 *
 * Every string is sized for the editor's character counters:
 * tip text <= 100, FAQ question <= 100, FAQ answer <= 300,
 * step title <= 50, step icon <= 30, step description <= 100.
 */

export const DEFAULT_APPLICATION_TIPS = {
  items: [
    { id: "1", text: "Tailor your resume to the role and highlight the most relevant experience" },
    { id: "2", text: "Write a short cover letter explaining why this role interests you" },
    { id: "3", text: "Research our culture and values before you apply" },
    { id: "4", text: "Make sure your professional profiles are current and complete" },
    { id: "5", text: "Prepare specific examples of your achievements and problem solving" },
  ],
};

export const DEFAULT_TRACKING_FAQ = {
  items: [
    {
      id: "1",
      question: "How can I track my application status?",
      answer:
        "Use the tracking ID from your confirmation email to check your status on our careers page at any time.",
    },
    {
      id: "2",
      question: "How long does the recruitment process take?",
      answer:
        "Most roles take about two to three weeks from application to final decision, though this varies with the position and the number of interview rounds.",
    },
    {
      id: "3",
      question: "What should I do if I lost my tracking ID?",
      answer:
        "Contact our hiring team using the full name and email address you applied with, and we will resend it.",
    },
    {
      id: "4",
      question: "Can I apply for more than one position?",
      answer:
        "Yes. You may apply for any roles that match your skills, and each application is tracked separately with its own ID.",
    },
    {
      id: "5",
      question: "Will I hear back if my application is unsuccessful?",
      answer:
        "Yes. We email every candidate about the outcome of their application, whether or not we move forward.",
    },
  ],
};

export const DEFAULT_WHAT_HAPPENS_NEXT = {
  items: [
    {
      id: "1",
      title: "Application Review",
      icon: "Search",
      description: "Our hiring team reviews your application and experience, usually within five days.",
    },
    {
      id: "2",
      title: "Initial Screening",
      icon: "Phone",
      description: "Shortlisted candidates are invited to a short introductory call.",
    },
    {
      id: "3",
      title: "Interview",
      icon: "Users",
      description: "A deeper conversation with the team you would be joining, including any role-specific tasks.",
    },
    {
      id: "4",
      title: "Final Decision",
      icon: "CheckCircle",
      description: "We let you know the outcome and, if successful, share your offer and next steps.",
    },
  ],
};
