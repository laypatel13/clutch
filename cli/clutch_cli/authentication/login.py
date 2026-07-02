import hmac
import secrets
import webbrowser
from http.server import BaseHTTPRequestHandler, HTTPServer
from urllib.parse import parse_qs, urlparse

import httpx
from clutch_cli.config import API_BASE_URL, save_token
from clutch_cli.theme import console, ACCENT, ERROR, DIM, SUCCESS

CLI_CALLBACK_PORT = 9876
_captured_token: dict = {}


class _CallbackHandler(BaseHTTPRequestHandler):
    expected_nonce = ""

    def do_GET(self):
        parsed = urlparse(self.path)
        if parsed.path == "/callback":
            params = parse_qs(parsed.query)
            token = params.get("token", [None])[0]
            received_nonce = params.get("local_nonce", [None])[0]
            # Reject any request whose local_nonce doesn't match the one we
            # generated for this login attempt — without this check, any
            # other local process racing to hit this port first could feed
            # us an attacker-controlled token before the real callback.
            if not token or not received_nonce or not hmac.compare_digest(
                received_nonce, self.expected_nonce
            ):
                self._respond(400, _error_page("Invalid or missing callback nonce."))
                return
            _captured_token["value"] = token
            self._respond(200, _success_page())
        else:
            self._respond(404, b"Not found")

    def _respond(self, status: int, body: bytes) -> None:
        self.send_response(status)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, *args):
        pass


def _success_page() -> bytes:
    return """<!DOCTYPE html>
<html>
<head>
  <title>Clutch</title>
  <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>&#9881;&#65039;</text></svg>" />
</head>
<body style="font-family:-apple-system,sans-serif;text-align:center;padding:80px;background:#0a0a0a;color:#ffffff">
  <h1 style="font-weight:800;letter-spacing:1px">CLUTCH</h1>
  <p style="color:#ffffff;font-size:1.1rem;opacity:0.9">&#10003; Login successful &mdash; you can close this tab.</p>
</body>
</html>""".encode()


def _error_page(msg: str) -> bytes:
    return f"""<!DOCTYPE html>
<html>
<head>
  <title>Clutch</title>
  <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>&#9881;&#65039;</text></svg>" />
</head>
<body style="font-family:-apple-system,sans-serif;text-align:center;padding:80px;background:#0a0a0a;color:#ffffff">
  <h1 style="font-weight:800;letter-spacing:1px">CLUTCH</h1>
  <p style="opacity:0.8">Login failed: {msg}</p>
</body>
</html>""".encode()


def login():
    """Login to Clutch via GitHub OAuth (browser-based, fully automatic)."""
    console.print()
    console.rule(f"[{ACCENT}]⚡ CLUTCH — LOGIN[/{ACCENT}]")
    console.print(f"[{DIM}]Starting local callback listener...[/{DIM}]")

    _captured_token.clear()
    local_nonce = secrets.token_urlsafe(24)
    _CallbackHandler.expected_nonce = local_nonce
    server = HTTPServer(("localhost", CLI_CALLBACK_PORT), _CallbackHandler)

    login_url = f"{API_BASE_URL}/auth/github?cli=true&local_nonce={local_nonce}"
    console.print(f"[{DIM}]Opening GitHub in your browser...[/{DIM}]\n")
    webbrowser.open(login_url)

    console.print(f"[{ACCENT}]Waiting for GitHub authorization...[/{ACCENT}]")
    console.print(f"[{DIM}](If your browser didn't open, visit:)[/{DIM}]")
    console.print(f"[{DIM}]{login_url}[/{DIM}]\n")

    server.handle_request()
    server.server_close()

    token = _captured_token.get("value")
    if not token:
        console.print(f"[{ERROR}]Login failed — no token received.[/{ERROR}]")
        raise SystemExit(1)

    try:
        response = httpx.get(
            f"{API_BASE_URL}/users/me",
            headers={"Authorization": f"Bearer {token}"},
            timeout=10,
        )
        if response.status_code != 200:
            console.print(f"[{ERROR}]Token validation failed.[/{ERROR}]")
            raise SystemExit(1)

        user = response.json()
        save_token(token, user["username"])
        console.print(f"[{SUCCESS}]Logged in as @{user['username']}[/{SUCCESS}]")
        console.print(f"[{DIM}]Welcome to Clutch, {user.get('name') or user['username']}.[/{DIM}]")
        console.print()
        console.rule(style=DIM)
        console.print()

    except httpx.RequestError:
        console.print(f"[{ERROR}]Could not connect to Clutch API.[/{ERROR}]")
        raise SystemExit(1)
