"use server";

import { saveAnswers, submitIntake } from "@/lib/portal/data";

/**
 * Server Actions are public POST endpoints, so they carry no trust of their
 * own: both take the token from the caller and hand it straight to the data
 * layer, which resolves it, checks the project is still editable and
 * sanitises every answer. Nothing here should ever skip that.
 */
export async function saveIntakeAction(token: string, answers: unknown) {
  return saveAnswers(token, answers);
}

export async function submitIntakeAction(token: string, answers: unknown) {
  return submitIntake(token, answers);
}
