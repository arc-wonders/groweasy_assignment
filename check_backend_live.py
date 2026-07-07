from __future__ import annotations

import json
import sys
import urllib.error
import urllib.request


BACKEND_URL = "https://groweasy-assignment-2753.onrender.com"


def main() -> int:
    health_url = f"{BACKEND_URL.rstrip('/')}/health"

    try:
        with urllib.request.urlopen(health_url, timeout=20) as response:
            body = response.read().decode("utf-8")
            print(f"Status code: {response.status}")
            print(f"Response body: {body}")

            if response.status == 200:
                try:
                    data = json.loads(body)
                except json.JSONDecodeError:
                    print("Backend responded, but response was not JSON.")
                    return 1

                if data.get("status") == "ok":
                    print("Backend is live.")
                    return 0

            print("Backend responded, but health check did not pass.")
            return 1

    except urllib.error.HTTPError as error:
        print(f"HTTP error: {error.code}")
        print(error.read().decode("utf-8", errors="replace"))
        return 1
    except urllib.error.URLError as error:
        print(f"Connection error: {error.reason}")
        return 1
    except TimeoutError:
        print("Request timed out.")
        return 1


if __name__ == "__main__":
    sys.exit(main())
