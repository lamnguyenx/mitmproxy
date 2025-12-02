FROM condaforge/miniforge3:25.9.1-0

WORKDIR /

    RUN --mount=type=cache,target=/cache/conda \
        CONDA_PKGS_DIRS=/cache/conda \
        conda install -y -c conda-forge \
            uv nodejs curl

WORKDIR /app

    COPY pyproject.toml uv.lock ./

    COPY mitmproxy/ ./mitmproxy/

    RUN --mount=type=cache,target=/tmp/uv_cache \
        UV_CACHE_DIR=/tmp/uv_cache \
        uv sync --frozen && \
        uv pip install -e .

    COPY web/package.json web/package-lock.json ./web/

    RUN cd web && \
        npm install

CMD ["/bin/bash"]