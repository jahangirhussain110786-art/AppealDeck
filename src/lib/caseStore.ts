"use client";

import type { Vault } from "@/core/vault/vault";
import type { CaseFile } from "@/core/interviewEngine";
import type { CaseState, ReplyCategory } from "@/core/caseState";

export const CASE_ID = "appealdeck-case-1";

export const CASE_FILE_NAME = "case_file";
export const CASE_LOG_NAME = "case_log";

export interface CaseLog {
  state: CaseState;
  attemptCount: number;
  submittedAt?: string;
  lastReply?: { category: ReplyCategory; at: string };
  whyHintDismissed?: boolean;
}

async function findRecordId(vault: Vault, name: string): Promise<string | null> {
  const list = await vault.list({ caseId: CASE_ID });
  const found = list.find((r) => r.name === name);
  return found?.id ?? null;
}

export async function saveCaseFile(vault: Vault, caseFile: CaseFile): Promise<void> {
  const existing = await findRecordId(vault, CASE_FILE_NAME);
  if (existing) {
    await vault.delete(existing);
  }
  await vault.addString({
    name: CASE_FILE_NAME,
    mimeType: "application/json",
    data: JSON.stringify(caseFile),
    caseId: CASE_ID,
    kind: "case",
  });
}

export async function loadCaseFile(vault: Vault): Promise<CaseFile | null> {
  const id = await findRecordId(vault, CASE_FILE_NAME);
  if (!id) return null;
  const { text } = await vault.getString(id);
  return JSON.parse(text) as CaseFile;
}

export async function saveCaseLog(vault: Vault, log: CaseLog): Promise<void> {
  const existing = await findRecordId(vault, CASE_LOG_NAME);
  if (existing) {
    await vault.delete(existing);
  }
  await vault.addString({
    name: CASE_LOG_NAME,
    mimeType: "application/json",
    data: JSON.stringify(log),
    caseId: CASE_ID,
    kind: "case",
  });
}

export async function loadCaseLog(vault: Vault): Promise<CaseLog | null> {
  const id = await findRecordId(vault, CASE_LOG_NAME);
  if (!id) return null;
  const { text } = await vault.getString(id);
  return JSON.parse(text) as CaseLog;
}

export async function deleteCaseFile(vault: Vault): Promise<void> {
  const id = await findRecordId(vault, CASE_FILE_NAME);
  if (id) await vault.delete(id);
}

export async function deleteCaseLog(vault: Vault): Promise<void> {
  const id = await findRecordId(vault, CASE_LOG_NAME);
  if (id) await vault.delete(id);
}
