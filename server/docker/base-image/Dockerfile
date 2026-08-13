# Full-toolchain Tadius learner environment. Everything a real DevOps
# workstation ships with is baked in at BUILD time, not installed on demand
# per session — installing a dozen tools live on every container start would
# make every lab launch slow and dependent on apt mirrors / GitHub release
# CDNs being reachable at that exact moment. Baking it into the image means
# every container boots with the full toolchain ready, deterministically,
# every time. Cost/size trade-off: this image is meaningfully larger
# (~1.5-2GB+ vs the previous ~120MB minimal image) and slower to build/pull
# the first time — acceptable here because the image is built once and
# reused for every container `docker run` afterwards; it is NOT rebuilt
# per session. Re-pull time on a fresh host is the only place that cost
# recurs, so keep this image in a registry close to wherever containers are
# actually scheduled (same region as the backend, or a local registry) once
# this moves off a single Docker host.
FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive

# --- Base OS tooling ---------------------------------------------------
# Everything a stock Ubuntu workstation has out of the box, plus the
# prerequisites (gnupg, lsb-release, apt-transport-https,
# software-properties-common) needed to add the third-party apt repos
# below (Docker's, HashiCorp's, Ansible's).
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
       bash \
       curl \
       wget \
       git \
       ca-certificates \
       gnupg \
       lsb-release \
       apt-transport-https \
       software-properties-common \
       nano \
       vim \
       unzip \
       jq \
       less \
       sudo \
       python3 \
       python3-pip \
       python3-venv \
    && rm -rf /var/lib/apt/lists/*

# --- Docker CLI + Compose plugin ----------------------------------------
# CLI only — `docker-ce` (the daemon package) is deliberately NOT installed
# here. There is no dockerd running inside this container; Docker commands
# are served by a dedicated docker:dind sidecar container that this
# container's /var/run is shared with (see container-manager.ts). Installing
# the full docker-ce package would pull in a daemon that never starts and
# just adds dead weight and a confusing "why won't dockerd start" trap.
RUN install -m 0755 -d /etc/apt/keyrings \
    && curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc \
    && chmod a+r /etc/apt/keyrings/docker.asc \
    && echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
      $(. /etc/os-release && echo \"$VERSION_CODENAME\") stable" \
      > /etc/apt/sources.list.d/docker.list \
    && apt-get update \
    && apt-get install -y --no-install-recommends \
       docker-ce-cli \
       docker-buildx-plugin \
       docker-compose-plugin \
    && rm -rf /var/lib/apt/lists/*

# --- HashiCorp Terraform (official apt repo) ----------------------------
RUN curl -fsSL https://apt.releases.hashicorp.com/gpg -o /etc/apt/keyrings/hashicorp.asc \
    && chmod a+r /etc/apt/keyrings/hashicorp.asc \
    && echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/hashicorp.asc] https://apt.releases.hashicorp.com \
      $(lsb_release -cs) main" \
      > /etc/apt/sources.list.d/hashicorp.list \
    && apt-get update \
    && apt-get install -y --no-install-recommends terraform \
    && rm -rf /var/lib/apt/lists/*

# --- Ansible (official PPA, same method Ansible's own docs recommend) ----
RUN add-apt-repository --yes --update ppa:ansible/ansible \
    && apt-get install -y --no-install-recommends ansible \
    && rm -rf /var/lib/apt/lists/*

# --- kubectl (official static binary release) -----------------------------
RUN ARCH="$(dpkg --print-architecture)" \
    && KUBECTL_VERSION="$(curl -fsSL https://dl.k8s.io/release/stable.txt)" \
    && curl -fsSLO "https://dl.k8s.io/release/${KUBECTL_VERSION}/bin/linux/${ARCH}/kubectl" \
    && install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl \
    && rm -f kubectl

# --- Helm (official install script) ---------------------------------------
RUN curl -fsSL https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 -o get-helm-3 \
    && chmod 700 get-helm-3 \
    && ./get-helm-3 \
    && rm -f get-helm-3

# --- AWS CLI v2 (official installer, arch-aware) --------------------------
RUN ARCH="$(dpkg --print-architecture)" \
    && if [ "$ARCH" = "arm64" ]; then AWS_ARCH="aarch64"; else AWS_ARCH="x86_64"; fi \
    && curl -fsSL "https://awscli.amazonaws.com/awscli-exe-linux-${AWS_ARCH}.zip" -o awscliv2.zip \
    && unzip -q awscliv2.zip \
    && ./aws/install \
    && rm -rf awscliv2.zip aws

# --- Node.js LTS + npm (NodeSource, official method) -----------------------
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y --no-install-recommends nodejs \
    && rm -rf /var/lib/apt/lists/*

# Runs as root: this is a disposable, isolated, single-tenant-per-container
# learning sandbox (not a shared multi-user host). Root can already run
# every apt/curl-installer flow without sudo, but `sudo` is still installed
# — almost every Linux tutorial a learner follows teaches `sudo apt update`
# by reflex, and `sudo` genuinely running (root satisfies it without a
# password prompt) matches that muscle memory instead of erroring
# `command not found: sudo`. Revisit before ever reusing this image for a
# persistent or shared-host scenario.
WORKDIR /root

# Keeps the container alive between terminal sessions; the backend execs
# an interactive bash shell into it per WebSocket connection rather than
# making this the container's own interactive process.
CMD ["sleep", "infinity"]
