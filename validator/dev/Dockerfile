FROM ubuntu:24.04

ARG AGAVE_VERSION=v3.1.14
RUN apt-get update \
    && DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends ca-certificates curl bzip2 \
    && curl --proto '=https' --tlsv1.2 -sSfL "https://release.anza.xyz/${AGAVE_VERSION}/install" | sh \
    && apt-get purge -y curl \
    && apt-get autoremove -y \
    && rm -rf /var/lib/apt/lists/*

ENV PATH="/root/.local/share/solana/install/active_release/bin:${PATH}"
COPY validator/dev/entrypoint.sh /usr/local/bin/start-local-validator
RUN chmod 0755 /usr/local/bin/start-local-validator
EXPOSE 8899
VOLUME ["/ledger"]

HEALTHCHECK --interval=3s --timeout=3s --start-period=20s --retries=20 \
  CMD solana --url "http://$(hostname -i | awk '{print $1}'):8899" slot >/dev/null || exit 1

ENTRYPOINT ["/usr/local/bin/start-local-validator"]
