/** Project lifecycle, matching the CHECK in supabase/portal.sql. */
export const PROJECT_STATUSES = ["intake", "submitted", "active", "launched", "archived"] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const STATUS_LABEL: Record<ProjectStatus, string> = {
  intake: "Waiting for questionnaire",
  submitted: "Questionnaire sent",
  active: "In progress",
  launched: "Launched",
  archived: "Archived (link off)",
};
