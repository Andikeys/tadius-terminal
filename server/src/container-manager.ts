import type Docker from "dockerode";

import { docker } from "./docker-client";

const BASE_IMAGE = process.env.TADIUS_BASE_IMAGE ?? "tadius-base:latest";
// Official Docker-in-Docker image, pulled from Docker Hub (not locally
// built, unlike BASE_IMAGE) — this is the sidecar that actually runs
// `dockerd` for a given user. Pinned to a major version rather than
// `:latest` so a Docker Hub release doesn't silently change behavior under
// every existing lab.
const DIND_IMAGE = process.env.TADIUS_DIND_IMAGE ?? "docker:27-dind";

const LABEL_USER = "tadius.userId";
const LABEL_LAB = "tadius.labId";
const LABEL_ROLE = "tadius.role"; // "shell" | "dind"

// Path INSIDE both containers where the dind sidecar's socket lives, shared
// via a named volume. Deliberately not `/var/run/docker.sock` directly —
// that path is used for other things by some base images, and using a
// dedicated subdirectory avoids any chance of collision. The shell
// container points DOCKER_HOST at this same path (see createShellContainer)
// so `docker`/`docker compose` just work with no per-command flag.
const DOCKER_SOCK_DIR = "/var/run/tadius-docker";
const DOCKER_SOCK_PATH = `${DOCKER_SOCK_DIR}/docker.sock`;

// One vCPU / 1 GB RAM for the learner's own shell — unchanged from before.
// The dind sidecar gets its own, separately-accounted ceiling below: it's
// the thing actually running whatever containers the learner builds/runs,
// so it needs materially more headroom than the shell process itself, and
// keeping it a SEPARATE cgroup means a learner's `docker run` workload
// can't starve the shell they're typing into.
const SHELL_HOST_CONFIG = {
  NanoCpus: 1_000_000_000,
  Memory: 1024 * 1024 * 1024,
  MemorySwap: 1024 * 1024 * 1024,
  NetworkMode: "bridge", // internet access enabled for apt/curl installs
  AutoRemove: false, // lifecycle is managed explicitly (ensure/reset below)
};

const DIND_HOST_CONFIG = {
  NanoCpus: 2_000_000_000,
  Memory: 2 * 1024 * 1024 * 1024,
  MemorySwap: 2 * 1024 * 1024 * 1024,
  NetworkMode: "bridge", // dockerd needs outbound internet to pull images
  AutoRemove: false,
  Privileged: true, // required for dind to function at all — see the
  // architecture note in the PR/chat history for why this is scoped to a
  // per-user sidecar (and never the host's real docker.sock) rather than
  // granted to the shell container or, worse, exposing the actual host
  // daemon: a learner escaping THIS container gets root inside their own
  // disposable sidecar, not the machine running Tadius's backend.
};

/**
 * MVP session store: in-memory, keyed by the client-asserted userId from
 * the (currently mocked, client-side-only) auth store. Restarting this
 * process forgets the mapping — recovered opportunistically below via
 * container labels. Two things to fix before this is safe to expose
 * publicly: (1) verify userId against a real signed session instead of
 * trusting a query param, (2) move this map to Redis/Postgres so more
 * than one backend instance can share it.
 */
const shellContainerIdByUser = new Map<string, string>();
const dindContainerIdByUser = new Map<string, string>();

function sanitize(userId: string) {
  return userId.replace(/[^a-zA-Z0-9_.-]/g, "_");
}

function shellContainerName(userId: string) {
  return `tadius-${sanitize(userId)}`;
}

function dindContainerName(userId: string) {
  return `tadius-dind-${sanitize(userId)}`;
}

function dockerSockVolumeName(userId: string) {
  return `tadius-docker-sock-${sanitize(userId)}`;
}

function dockerDataVolumeName(userId: string) {
  return `tadius-docker-data-${sanitize(userId)}`;
}

async function ensureVolume(name: string): Promise<void> {
  try {
    await docker.getVolume(name).inspect();
  } catch {
    await docker.createVolume({ Name: name });
  }
}

/** Pulls an image if it isn't already present locally. No-ops (cheap) once cached. */
async function ensureImage(image: string): Promise<void> {
  try {
    await docker.getImage(image).inspect();
    return;
  } catch {
    // not present locally — fall through to pull
  }
  await new Promise<void>((resolve, reject) => {
    docker.pull(image, (err: Error | null, stream: NodeJS.ReadableStream) => {
      if (err) return reject(err);
      docker.modem.followProgress(stream, (progressErr: Error | null) =>
        progressErr ? reject(progressErr) : resolve()
      );
    });
  });
}

async function findContainerByRole(userId: string, role: "shell" | "dind"): Promise<string | null> {
  const containers = await docker.listContainers({
    all: true,
    filters: { label: [`${LABEL_USER}=${userId}`, `${LABEL_ROLE}=${role}`] },
  });
  return containers[0]?.Id ?? null;
}

function isNameConflict(err: unknown): boolean {
  return typeof err === "object" && err !== null && (err as { statusCode?: number }).statusCode === 409;
}

/**
 * Creates a container by name, self-healing past "name already in use"
 * conflicts instead of failing forever. This isn't hypothetical: it's
 * exactly what happened the first time this file introduced the
 * shell/dind role-label split — a container created under the OLD label
 * schema is invisible to today's label-based discovery (findContainerByRole
 * filters on a label that container never got), but it still holds the
 * deterministic name a fresh createContainer call wants, so every single
 * request failed identically with an HTTP 409 until someone manually ran
 * `docker rm`. Any future schema/labeling change would hit the same wall.
 * Instead: on a 409, remove whatever currently holds that name and retry
 * once. If a second attempt still 409s, something more fundamental is
 * wrong (e.g. a genuine race with a concurrent request) and it's correct
 * to let that surface as a real error rather than loop forever.
 */
async function createNamedContainer(
  name: string,
  options: Docker.ContainerCreateOptions
): Promise<Docker.Container> {
  try {
    return await docker.createContainer(options);
  } catch (err) {
    if (!isNameConflict(err)) throw err;
    console.warn(
      `[container-manager] "${name}" name conflict on create — removing the stale container holding that name and retrying once.`
    );
    await docker.getContainer(name).remove({ force: true }).catch(() => undefined);
    return docker.createContainer(options);
  }
}

async function createDindContainer(userId: string): Promise<string> {
  await ensureImage(DIND_IMAGE);
  const sockVolume = dockerSockVolumeName(userId);
  const dataVolume = dockerDataVolumeName(userId);
  await ensureVolume(sockVolume);
  await ensureVolume(dataVolume);

  const name = dindContainerName(userId);
  const container = await createNamedContainer(name, {
    Image: DIND_IMAGE,
    name,
    Labels: { [LABEL_USER]: userId, [LABEL_ROLE]: "dind" },
    // No TLS cert generation and no TCP listener at all — the daemon is
    // reachable ONLY via the unix socket shared through the volume bind
    // below, which only this user's own shell container also mounts.
    // Nothing about this daemon is ever exposed on a network port.
    Env: ["DOCKER_TLS_CERTDIR="],
    Cmd: [`--host=unix://${DOCKER_SOCK_PATH}`],
    HostConfig: {
      ...DIND_HOST_CONFIG,
      Binds: [`${sockVolume}:${DOCKER_SOCK_DIR}`, `${dataVolume}:/var/lib/docker`],
    },
  });
  await container.start();
  return container.id;
}

/**
 * Blocks until the dind sidecar's socket file actually exists — dockerd
 * takes a few seconds to initialize on a cold start (longer on first-ever
 * boot for a given data volume, since it's also setting up its storage
 * driver). Without this, a learner's first `docker ps` immediately after
 * launch races dockerd's own startup and fails with a confusing
 * connection error despite the architecture being correct. Polled via an
 * exec *inside* the sidecar itself (the backend has no direct filesystem
 * view into another container) with a hard timeout so a genuinely broken
 * sidecar fails loudly instead of hanging the whole session forever.
 */
async function waitForDockerDaemon(
  dindContainerId: string,
  displayName = dindContainerId,
  timeoutMs = 30_000
): Promise<void> {
  const timeoutSeconds = Math.ceil(timeoutMs / 1000);
  const exec = await docker.getContainer(dindContainerId).exec({
    Cmd: [
      "sh",
      "-c",
      `i=0; while [ ! -S "${DOCKER_SOCK_PATH}" ]; do i=$((i+1)); if [ "$i" -ge ${timeoutSeconds} ]; then exit 1; fi; sleep 1; done; exit 0`,
    ],
    AttachStdout: true,
    AttachStderr: true,
  });
  const stream = await exec.start({});
  await new Promise<void>((resolve, reject) => {
    stream.on("end", resolve);
    stream.on("error", reject);
  });
  const { ExitCode } = await exec.inspect();
  if (ExitCode !== 0) {
    throw new Error(
      `Docker daemon inside the workspace did not become ready in time. The sidecar container may have failed to start — check \`docker logs ${displayName}\` on the host.`
    );
  }
}

/** Ensures this user's dind sidecar is running and its socket is ready to use. Returns the sidecar's container id. */
async function ensureDindContainer(userId: string): Promise<string> {
  const cached = dindContainerIdByUser.get(userId);
  if (cached) {
    const info = await docker.getContainer(cached).inspect().catch(() => null);
    if (info?.State.Running) return cached;
    if (info) {
      // Container exists but stopped — restart it and wait for dockerd to
      // come back up rather than treating it as gone.
      await docker.getContainer(cached).start();
      await waitForDockerDaemon(cached, dindContainerName(userId));
      return cached;
    }
    dindContainerIdByUser.delete(userId); // container was removed out from under us
  }

  const existingId = await findContainerByRole(userId, "dind");
  if (existingId) {
    const info = await docker.getContainer(existingId).inspect();
    if (!info.State.Running) await docker.getContainer(existingId).start();
    dindContainerIdByUser.set(userId, existingId);
    await waitForDockerDaemon(existingId, dindContainerName(userId));
    return existingId;
  }

  const id = await createDindContainer(userId);
  dindContainerIdByUser.set(userId, id);
  await waitForDockerDaemon(id, dindContainerName(userId));
  return id;
}

async function createShellContainer(userId: string, labId: string): Promise<string> {
  const sockVolume = dockerSockVolumeName(userId);
  const name = shellContainerName(userId);
  const container = await createNamedContainer(name, {
    Image: BASE_IMAGE,
    name,
    Cmd: ["sleep", "infinity"],
    Tty: false,
    Env: [`DOCKER_HOST=unix://${DOCKER_SOCK_PATH}`],
    Labels: { [LABEL_USER]: userId, [LABEL_LAB]: labId, [LABEL_ROLE]: "shell" },
    HostConfig: {
      ...SHELL_HOST_CONFIG,
      // Read-write: the CLI in this container only ever talks to the
      // socket, it never needs to write into the directory itself, but
      // the mount as a whole must be writable for the socket file dockerd
      // creates on the other side to be visible/connectable here at all.
      Binds: [`${sockVolume}:${DOCKER_SOCK_DIR}`],
    },
  });
  await container.start();
  return container.id;
}

/**
 * Ensures a running shell container AND its dind sidecar both exist for
 * this user, and returns the shell container's id (what the WebSocket
 * bridge execs `bash` into). The sidecar is brought up first — the shell
 * container's DOCKER_HOST points at a socket that only exists once the
 * sidecar's dockerd has created it, so starting them in the other order
 * would just move the "is Docker ready yet" race into every single
 * terminal session instead of handling it once here.
 */
export async function ensureContainer(userId: string, labId: string): Promise<string> {
  await ensureDindContainer(userId);

  const cached = shellContainerIdByUser.get(userId);
  if (cached) {
    const info = await docker
      .getContainer(cached)
      .inspect()
      .catch(() => null);
    if (info?.State.Running) return cached;
    if (info) {
      await docker
        .getContainer(cached)
        .remove({ force: true })
        .catch(() => undefined);
    }
    shellContainerIdByUser.delete(userId);
  }

  const existingId = await findContainerByRole(userId, "shell");
  if (existingId) {
    const info = await docker.getContainer(existingId).inspect();
    if (!info.State.Running) await docker.getContainer(existingId).start();
    shellContainerIdByUser.set(userId, existingId);
    return existingId;
  }

  const id = await createShellContainer(userId, labId);
  shellContainerIdByUser.set(userId, id);
  return id;
}

/**
 * Destroys everything for this user — both containers and both volumes —
 * and provisions a brand-new environment from scratch. Backs the "Reset
 * Environment" button. Removing the data volume specifically means any
 * images/containers the learner built or pulled inside their sandbox are
 * genuinely gone, matching the button's "erase & reset" framing rather
 * than leaving stale Docker state behind that a fresh shell container
 * would then silently inherit.
 */
export async function resetContainer(userId: string, labId: string): Promise<string> {
  const shellId = shellContainerIdByUser.get(userId) ?? (await findContainerByRole(userId, "shell"));
  if (shellId) {
    await docker.getContainer(shellId).remove({ force: true }).catch(() => undefined);
    shellContainerIdByUser.delete(userId);
  }

  const dindId = dindContainerIdByUser.get(userId) ?? (await findContainerByRole(userId, "dind"));
  if (dindId) {
    await docker.getContainer(dindId).remove({ force: true }).catch(() => undefined);
    dindContainerIdByUser.delete(userId);
  }

  await docker.getVolume(dockerSockVolumeName(userId)).remove().catch(() => undefined);
  await docker.getVolume(dockerDataVolumeName(userId)).remove().catch(() => undefined);

  // Sidecar first, same reasoning as ensureContainer: the shell's
  // DOCKER_HOST points at a socket that only exists once dockerd has
  // created it, so bring that up (and wait for it) before the shell.
  await ensureDindContainer(userId);
  const id = await createShellContainer(userId, labId);
  shellContainerIdByUser.set(userId, id);
  return id;
}
