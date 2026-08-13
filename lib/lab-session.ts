/**
 * The seam the entire launch flow depends on. This used to simulate a
 * delay and hand back a fake connection; it now calls the real backend
 * (see server/) to provision an actual Docker container and returns the
 * WebSocket URL the terminal connects to. Nothing above this file (the
 * launch modal, PlaygroundCard, TerminalSurface) had to change shape for
 * that swap — that was the point of architecting it this way.
 */

const BACKEND_URL =
  process.env.NEXT_PUBLIC_TADIUS_BACKEND_URL ?? "http://localhost:4001";

export interface LabConnection {
  labId: string;
  userId: string;
  containerId: string;
  wsUrl: string;
  connectedAt: number;
}

function terminalWsUrl(labId: string, userId: string, username: string) {
  const base = BACKEND_URL.replace(/^http/, "ws");
  return `${base}/ws/terminal?labId=${encodeURIComponent(labId)}&userId=${encodeURIComponent(userId)}&username=${encodeURIComponent(username)}`;
}

export async function connectToLab(
  labId: string,
  userId: string,
  username: string
): Promise<LabConnection> {
  const res = await fetch(
    `${BACKEND_URL}/api/labs/${encodeURIComponent(labId)}/connect?userId=${encodeURIComponent(userId)}`,
    { method: "POST" }
  );
  if (!res.ok) {
    throw new Error(`Failed to provision environment (${res.status})`);
  }
  const data: { containerId: string } = await res.json();

  return {
    labId,
    userId,
    containerId: data.containerId,
    wsUrl: terminalWsUrl(labId, userId, username),
    connectedAt: Date.now(),
  };
}

/** Destroys the current container and provisions a brand-new one — backs the "Reset Environment" button. */
export async function resetLabEnvironment(
  labId: string,
  userId: string,
  username: string
): Promise<LabConnection> {
  const res = await fetch(
    `${BACKEND_URL}/api/labs/${encodeURIComponent(labId)}/reset?userId=${encodeURIComponent(userId)}`,
    { method: "POST" }
  );
  if (!res.ok) {
    throw new Error(`Failed to reset environment (${res.status})`);
  }
  const data: { containerId: string } = await res.json();

  return {
    labId,
    userId,
    containerId: data.containerId,
    wsUrl: terminalWsUrl(labId, userId, username),
    connectedAt: Date.now(),
  };
}

export function disconnectFromLab(connection: LabConnection) {
  // No explicit close call needed: the terminal hook closes its own
  // WebSocket on unmount, which ends the `docker exec` stream server-side.
  // The container itself is left running (not destroyed) so reopening the
  // same lab resumes the same environment — only Reset Environment or an
  // idle-timeout (not yet implemented) tears the container down.
  void connection;
}
