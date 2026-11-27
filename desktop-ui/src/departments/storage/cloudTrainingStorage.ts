/**
 * Cloud Training Storage — save feedback + conversation logs as JSONL to:
 *   1) Local download (always free)
 *   2) Google Drive (user's own 15 GB, OAuth "drive.file" scope via Google Identity Services)
 */
import { loadLocalFeedbackLogs } from "../feedback/feedbackStorage.ts";
import { getTurns } from "../conversation/conversationMemory.ts";
import { loadBrainSettings } from "../brain/brainSettings.ts";

const GIS_SRC = "https://accounts.google.com/gsi/client";
const FOLDER_NAME = "HeyFRIDAY-Training";
let accessToken = "";

export function buildTrainingJsonl(): string {
  const fb = loadLocalFeedbackLogs().map((f) => ({ type: "feedback", ...f }));
  const convo = getTurns().map((t) => ({ type: "turn", ...t }));
  return [...fb, ...convo].map((r) => JSON.stringify(r)).join("\n");
}

const fileName = () => `friday_training_${new Date().toISOString().replace(/[:.]/g, "-")}.jsonl`;

export function downloadTrainingJsonl(): void {
  const url = URL.createObjectURL(new Blob([buildTrainingJsonl()], { type: "application/x-ndjson" }));
  const a = Object.assign(document.createElement("a"), { href: url, download: fileName() });
  a.click();
  URL.revokeObjectURL(url);
}

function loadGis(): Promise<void> {
  if ((window as any).google?.accounts?.oauth2) return Promise.resolve();
  return new Promise((ok, fail) => {
    const s = Object.assign(document.createElement("script"), { src: GIS_SRC, onload: () => ok(), onerror: fail });
    document.head.appendChild(s);
  });
}

async function getToken(): Promise<string> {
  if (accessToken) return accessToken;
  const clientId = loadBrainSettings().driveClientId;
  if (!clientId) throw new Error("Add your Google OAuth Client ID first");
  await loadGis();
  return new Promise((ok, fail) => {
    const client = (window as any).google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: "https://www.googleapis.com/auth/drive.file",
      callback: (r: any) => (r.access_token ? ok((accessToken = r.access_token)) : fail(new Error(r.error))),
    });
    client.requestAccessToken();
  });
}

async function driveFetch(url: string, init: RequestInit = {}): Promise<any> {
  const token = await getToken();
  const res = await fetch(url, { ...init, headers: { ...init.headers, Authorization: `Bearer ${token}` } });
  if (res.status === 401) { accessToken = ""; throw new Error("Drive session expired — retry"); }
  if (!res.ok) throw new Error(`Drive ${res.status}`);
  return res.json();
}

async function ensureFolder(): Promise<string> {
  const q = encodeURIComponent(`name='${FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`);
  const found = await driveFetch(`https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id)`);
  if (found.files?.[0]) return found.files[0].id;
  const made = await driveFetch("https://www.googleapis.com/drive/v3/files", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: FOLDER_NAME, mimeType: "application/vnd.google-apps.folder" }),
  });
  return made.id;
}

/** Uploads one JSONL snapshot into "My Drive/HeyFRIDAY-Training". Returns the file link. */
export async function uploadTrainingToDrive(): Promise<string> {
  const folderId = await ensureFolder();
  const meta = { name: fileName(), parents: [folderId], mimeType: "application/x-ndjson" };
  const form = new FormData();
  form.append("metadata", new Blob([JSON.stringify(meta)], { type: "application/json" }));
  form.append("file", new Blob([buildTrainingJsonl()], { type: "application/x-ndjson" }));
  const file = await driveFetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink",
    { method: "POST", body: form }
  );
  return file.webViewLink ?? file.id;
}
