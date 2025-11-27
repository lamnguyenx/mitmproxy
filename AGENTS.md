# Agent Instructions for mitmproxy

## Build/Lint/Test Commands

### Python Codebase
- **Full test suite**: `uv run tox`
- **Linting**: `uv run tox -e lint`
- **Type checking**: `uv run tox -e mypy`
- **Build wheel**: `uv build`
- **Single test file**: `uv run pytest path/to/test_file.py`
- **Single test with coverage**: `uv run pytest --cov mitmproxy.module --cov-report term-missing test_file.py`
- **Fix formatting**: `uv run tox -e fix`

### Web Codebase (in web/ directory)
- **Test**: `npm test`
- **Build**: `npm run build`
- **Format**: `npm run prettier`
- **Lint**: `npm run eslint`

## Code Style Guidelines

### Python
- **Linting**: ruff with rules E, F, I, TID251 (ignore F541, E501)
- **Type checking**: mypy with check_untyped_defs=true, ignore_missing_imports=true
- **Import ordering**: force-single-line, order-by-type=false
- **Import sections**: future, standard-library, third-party, local-folder, first-party
- **Known first-party**: test, mitmproxy, mitmproxy_rs
- **Banned APIs**: asyncio.create_task (use mitmproxy.utils.asyncio_utils.create_task)

### Web/TypeScript
- **Indentation**: 4 spaces
- **Line endings**: LF
- **Trim trailing whitespace**: true
- **Insert final newline**: true
- **Linting**: ESLint with React plugin
- **Formatting**: Prettier

### General
- **Test coverage**: Maintain 100% coverage, enforced for core modules
- **Error handling**: Use RuntimeWarning and pytest.PytestUnraisableExceptionWarning as errors
- **Async**: asyncio_mode=auto, asyncio_default_fixture_loop_scope=function</content>
<parameter name="filePath">/Users/lamnt45/git/mitmproxy/AGENTS.md