ARG CASVAL_CORE_TAG='v23.1LTS-patch20250828'

# Build JS/CSS/HTML contents
FROM asia.gcr.io/axis-gcp-dev-46876560/casval:${CASVAL_CORE_TAG} as builder

RUN apt-get update && \
    apt-get install -y --no-install-recommends curl ca-certificates && \
    rm -rf /var/lib/apt/lists/*

ENV NODE_VERSION=24.13.0
ENV NODE_HOME=/opt/node
ENV PATH=${NODE_HOME}/bin:${PATH}
ENV NODE_OPTIONS=--max-old-space-size=4096
RUN curl -fsSLO https://nodejs.org/dist/v$NODE_VERSION/node-v$NODE_VERSION-linux-x64.tar.gz && \
    mkdir -p ${NODE_HOME} && \
    tar -xzf node-v$NODE_VERSION-linux-x64.tar.gz -C ${NODE_HOME} --strip-components=1 && \
    rm node-v$NODE_VERSION-linux-x64.tar.gz

COPY client /home/node/casval-app/client
WORKDIR /home/node/casval-app/client
RUN npm ci --no-audit --no-fund && npm run generate
RUN ls -lah
RUN ls -lah ../
RUN pwd

# Build casval plugin image
FROM asia.gcr.io/axis-gcp-dev-46876560/casval:${CASVAL_CORE_TAG}
COPY . /root/casval-app
COPY --from=builder /home/node/casval-app/client/.output/public /root/casval-app/client/dist

# Symbolic link for secret rendered config file
RUN ln -sf /var/configs/config.yml /root/casval-app

# install gettext
RUN apt update && \
    apt install -y gettext && \
    apt clean && \
    rm -rf /var/lib/apt/lists/*
