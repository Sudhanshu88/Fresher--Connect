import re
import glob

print("--- FRONTEND URLS ---")
js_files = glob.glob("frontend/public/services/**/*.js", recursive=True)
for js_file in js_files:
    with open(js_file, "r", encoding="utf-8") as f:
        content = f.read()
        urls = set(re.findall(r"[\'\"]((?:/api/|/auth/|/jobs|/applications|/healthz)[^\'\"]*)[\'\"]", content))
        if urls:
            for url in sorted(urls):
                print(f"FRONTEND:  {url.split('?')[0]}")

print("\n--- BACKEND ROUTES ---")
py_files = glob.glob("backend/routes/**/*.py", recursive=True)
for py_file in py_files:
    with open(py_file, "r", encoding="utf-8") as f:
        lines = f.readlines()
        routes = []
        for line in lines:
            m = re.search(r"\.(?:post|get|patch|delete|put|add_url_rule)\([\'\"]([^\'\"]+)[\'\"]", line)
            if m:
                routes.append(m.group(1))
        if routes:
            for route in sorted(set(routes)):
                print(f"BACKEND:  {route.replace('<int:', '{').replace('>', '}')}")
