"use server";

import { confirmUpload, removeUpload, requestUpload, respondToCheckpoint, saveAnswers, submitIntake } from "@/lib/portal/data";

/**
 * Server Actions are public POST endpoints, so they carry no trust of their
 * own: each takes the token from the caller and hands it straight to the data
 * layer, which resolves it, checks the project is still editable and
 * validates everything else. Nothing here should ever skip that.
 */
export async function saveIntakeAction(token: string, answers: unknown) {
  return saveAnswers(token, answers);
}

export async function submitIntakeAction(token: string, answers: unknown) {
  return submitIntake(token, answers);
}

export async function requestUploadAction(token: string, meta: { kind: unknown; mime: unknown; size: unknown }) {
  return requestUpload(token, meta);
}

export async function confirmUploadAction(token: string, body: { path: unknown; name: unknown }) {
  return confirmUpload(token, body);
}

export async function removeUploadAction(token: string, fileId: unknown) {
  return removeUpload(token, fileId);
}

export async function respondCheckpointAction(
  token: string,
  body: { id: unknown; action: unknown; items?: unknown; name?: unknown }
) {
  return respondToCheckpoint(token, body);
}
