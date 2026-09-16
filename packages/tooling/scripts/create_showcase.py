#!/usr/bin/env python3
"""Create (and publish) the Plate native-blocks showcase page via plone.restapi.

The page content is the reusable fixture at
``packages/tooling/playwright/fixtures/plate-showcase.json`` — the same file
acceptance tests can import. Keeping a single source of truth means the manual
showcase and the automated tests never drift apart.

Usage:
    python3 packages/tooling/scripts/create_showcase.py
"""
import base64
import json
import sys
import urllib.error
import urllib.request
from pathlib import Path

API = "http://localhost:8080/Plone"
AUTH = base64.b64encode(b"admin:admin").decode()
PAGE_ID = "plate-showcase"

FIXTURE = (
    Path(__file__).resolve().parent.parent
    / "playwright"
    / "fixtures"
    / "plate-showcase.json"
)


def req(method, url, data=None):
    headers = {"Accept": "application/json", "Authorization": "Basic " + AUTH}
    body_bytes = None
    if data is not None:
        headers["Content-Type"] = "application/json"
        body_bytes = json.dumps(data).encode()
    r = urllib.request.Request(url, data=body_bytes, headers=headers, method=method)
    try:
        with urllib.request.urlopen(r) as resp:
            return resp.status, resp.read().decode()
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()


def main():
    fixture = json.loads(FIXTURE.read_text())

    body = {
        "@type": "Document",
        "id": PAGE_ID,
        "title": "Plate Native Blocks — Showcase",
        "description": "A use case of every native Plate block/node available in Aurora.",
        **fixture,  # blocks + blocks_layout
    }

    # Delete first so re-runs are idempotent.
    req("DELETE", f"{API}/{PAGE_ID}")

    status, resp = req("POST", API, body)
    print("CREATE:", status)
    if status not in (200, 201):
        print(resp[:2000])
        sys.exit(1)

    st2, _ = req("POST", f"{API}/{PAGE_ID}/@workflow/publish")
    print("PUBLISH:", st2)
    print("URL: http://localhost:3000/%s" % PAGE_ID)


if __name__ == "__main__":
    main()
