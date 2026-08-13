import Docker from "dockerode";

/**
 * Resolves how to reach the local Docker daemon. Linux/macOS Docker
 * Desktop/Engine expose a Unix socket; Windows Docker Desktop exposes a
 * named pipe instead. DOCKER_HOST / DOCKER_SOCKET_PATH env vars always
 * win when set — e.g. if you've enabled Docker Desktop's "Expose daemon
 * on tcp://localhost:2375" option and want to connect over TCP instead.
 */
function resolveDockerOptions(): Docker.DockerOptions {
  if (process.env.DOCKER_HOST) {
    // dockerode reads DOCKER_HOST from the environment itself when no
    // explicit options are passed.
    return {};
  }
  if (process.env.DOCKER_SOCKET_PATH) {
    return { socketPath: process.env.DOCKER_SOCKET_PATH };
  }
  if (process.platform === "win32") {
    return { socketPath: "//./pipe/docker_engine" };
  }
  return { socketPath: "/var/run/docker.sock" };
}

export const docker = new Docker(resolveDockerOptions());
