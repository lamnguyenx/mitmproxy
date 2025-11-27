FROM python:3.13-trixie AS wheelbuilder

    ARG HTTP_PROXY
    ENV HTTP_PROXY=${HTTP_PROXY}
    ENV http_proxy=${HTTP_PROXY}

    ARG HTTPS_PROXY
    ENV HTTPS_PROXY=${HTTPS_PROXY}
    ENV https_proxy=${HTTPS_PROXY}

    ARG NO_PROXY
    ENV NO_PROXY=${NO_PROXY}

    WORKDIR /
        # To build the wheel file:
        # 1 - Edit version in mitmproxy/version.py
        # 2 - Run: `uv run release/build.py wheel`
        COPY release/dist/mitmproxy-13.0.0.dev0+lamnguyenx-py3-none-any.whl /wheels/
        RUN --mount=type=cache,target=/root/.cache/pip \
            pip install wheel && pip wheel --wheel-dir /wheels /wheels/*.whl


FROM python:3.13-slim-trixie

    ARG HTTP_PROXY
    ENV HTTP_PROXY=${HTTP_PROXY}
    ENV http_proxy=${HTTP_PROXY}

    ARG HTTPS_PROXY
    ENV HTTPS_PROXY=${HTTPS_PROXY}
    ENV https_proxy=${HTTPS_PROXY}

    ARG NO_PROXY
    ENV NO_PROXY=${NO_PROXY}

    WORKDIR /
        RUN useradd -mU mitmproxy

        RUN --mount=type=cache,target=/var/cache/apt,sharing=locked \
            --mount=type=cache,target=/var/lib/apt/lists,sharing=locked \
            apt-get update \
            && apt-get install -y --no-install-recommends gosu nano

        RUN mkdir /home/mitmproxy/.mitmproxy \
            && chown mitmproxy:mitmproxy /home/mitmproxy/.mitmproxy

        COPY --from=wheelbuilder /wheels /wheels
        RUN --mount=type=cache,target=/root/.cache/pip \
            pip install --no-index --find-links=/wheels mitmproxy
        RUN rm -rf /wheels

        VOLUME /home/mitmproxy/.mitmproxy

        COPY release/docker/docker-entrypoint.sh /usr/local/bin/

ENTRYPOINT ["docker-entrypoint.sh"]

EXPOSE 8080 8081

ENV HTTP_PROXY=
ENV http_proxy=
ENV HTTPS_PROXY=
ENV https_proxy=
ENV NO_PROXY=

CMD ["mitmproxy"]
