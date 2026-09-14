"""Run the upstream regression with only protocol-level dependency stubs."""
from __future__ import annotations

import runpy
import sys
import types
from pathlib import Path

httpx = types.ModuleType("httpx")


class Response:
    def __init__(self, status_code: int, *, text: str = "") -> None:
        self.status_code = status_code
        self.text = text


class DigestAuth:
    def __init__(self, username: str, password: str) -> None:
        self.username = username
        self.password = password


class AsyncClient:
    pass


class TimeoutException(Exception):
    pass


class ConnectError(Exception):
    pass


httpx.Response = Response
httpx.DigestAuth = DigestAuth
httpx.AsyncClient = AsyncClient
httpx.TimeoutException = TimeoutException
httpx.ConnectError = ConnectError
sys.modules["httpx"] = httpx

fastapi = types.ModuleType("fastapi")


class HTTPException(Exception):
    def __init__(self, status_code: int, detail: str = "") -> None:
        super().__init__(detail)
        self.status_code = status_code
        self.detail = detail


fastapi.HTTPException = HTTPException
sys.modules["fastapi"] = fastapi

test_file = Path.cwd() / "server/tests/test_onvif_wsse_fallback.py"
sys.argv = [str(test_file)]
runpy.run_path(str(test_file), run_name="__main__")
