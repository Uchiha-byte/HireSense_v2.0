import os
import requests
import json
import sys

# Status colors
GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
RESET = "\033[0m"

def load_env_file(filepath):
    """Manually parse .env file to avoid dependencies"""
    if not os.path.exists(filepath):
        print(f"{YELLOW}Warning: {filepath} not found{RESET}")
        return {}
    
    env_vars = {}
    with open(filepath, 'r') as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith('#'):
                continue
            if '=' in line:
                key, value = line.split('=', 1)
                # Remove quotes if present
                value = value.strip().strip("'").strip('"')
                env_vars[key.strip()] = value
    return env_vars

def print_result(service, status, message=""):
    color = GREEN if status == "VALID" else (RED if status == "INVALID" else YELLOW)
    print(f"{service: <20} {color}[{status}]{RESET} {message}")

def verify_openai(key):
    if not key or "your_" in key: return "MISSING", "Key not configured"
    try:
        response = requests.get(
            "https://api.openai.com/v1/models",
            headers={"Authorization": f"Bearer {key}"},
            timeout=10
        )
        if response.status_code == 200: return "VALID", "Connected successfully"
        if response.status_code == 401: return "INVALID", "Authentication failed"
        return "ERROR", f"Status {response.status_code}"
    except Exception as e: return "ERROR", str(e)

def verify_groq(key):
    if not key or "your_" in key: return "MISSING", "Key not configured"
    try:
        response = requests.get(
            "https://api.groq.com/openai/v1/models",
            headers={"Authorization": f"Bearer {key}"},
            timeout=10
        )
        if response.status_code == 200: return "VALID", "Connected successfully"
        if response.status_code == 401: return "INVALID", "Authentication failed"
        return "ERROR", f"Status {response.status_code}"
    except Exception as e: return "ERROR", str(e)

def verify_elevenlabs(key):
    if not key or "your_" in key: return "MISSING", "Key not configured"
    try:
        response = requests.get(
            "https://api.elevenlabs.io/v1/user",
            headers={"xi-api-key": key},
            timeout=10
        )
        if response.status_code == 200: return "VALID", "Connected successfully"
        if response.status_code == 401: return "INVALID", "Authentication failed"
        return "ERROR", f"Status {response.status_code}"
    except Exception as e: return "ERROR", str(e)

def verify_ashby(key):
    if not key or "your_" in key: return "MISSING", "Key not configured"
    try:
        # Basic authenticated endpoint for Ashby
        response = requests.post(
            "https://api.ashbyhq.com/candidate.list",
            auth=(key, ""),
            json={"limit": 1},
            timeout=10
        )
        if response.status_code == 200: return "VALID", "Connected successfully"
        if response.status_code == 401: return "INVALID", "Authentication failed"
        # 404 might happen if endpoint changed, but 401 is definitive
        return "ERROR", f"Status {response.status_code}"
    except Exception as e: return "ERROR", str(e)

def verify_supabase(url, key):
    if not url or "your_" in url or not key or "your_" in key: 
        return "MISSING", "URL or Key not configured"
    try:
        # Just check health/connectivity
        # Usually Supabase has a rest/v1/ endpoint
        headers = {
            "apikey": key,
            "Authorization": f"Bearer {key}"
        }
        # Try to list users table or just root
        response = requests.get(
            f"{url}/rest/v1/",
            headers=headers,
            timeout=10
        )
        # We expect a JSON response (even if empty) or 200
        # If the URL is wrong, we get connection error
        # If Key is wrong, we might get 401 or 403
        if response.status_code in [200, 404]: # 404 on root is fine if service is up
            return "VALID", "Service reachable"
        # Actually a better check for Supabase is asking for a non-existent table
        response = requests.get(
            f"{url}/rest/v1/nonexistent_checks_connection",
            headers=headers,
            timeout=10
        )
        if response.status_code == 401: return "INVALID", "Authentication failed"
        if response.status_code == 404: return "VALID", "Connected (Table not found as expected)"
        if response.status_code == 200: return "VALID", "Connected"
        return "ERROR", f"Status {response.status_code}"
    except Exception as e: return "ERROR", str(e)

def main():
    print("\n🔑  Verifying External API Keys...\n")

    # Load Backend Env
    backend_env = load_env_file("backend/.env")
    # Load Frontend Env (for Supabase public keys etc)
    frontend_env = load_env_file("frontend/.env.local")
    
    # Merge logic: Start with backend, update with frontend (frontend usually has next_public), 
    # but don't let placeholders overwrite valid values
    all_env = backend_env.copy()
    for k, v in frontend_env.items():
        if k not in all_env or "your_" in all_env[k]:
            all_env[k] = v
    
    # Also check if backend has "your_" and frontend doesn't -> take frontend
    # (The loop above does this if k not in all_env, but if k is in all_env, we need to check value)
    for k, v in backend_env.items():
        if "your_" in v and k in frontend_env and "your_" not in frontend_env[k]:
            all_env[k] = frontend_env[k]
    
    # 1. OpenAI
    print_result("OpenAI API", *verify_openai(all_env.get("OPENAI_API_KEY")))
    
    # 2. Groq
    print_result("Groq API", *verify_groq(all_env.get("GROQ_API_KEY")))
    
    # 3. ElevenLabs
    print_result("ElevenLabs API", *verify_elevenlabs(all_env.get("ELEVENLABS_API_KEY")))
    
    # 4. Ashby
    print_result("Ashby API", *verify_ashby(all_env.get("ASHBY_API_KEY")))
    
    # 5. Supabase
    sb_url = all_env.get("NEXT_PUBLIC_SUPABASE_URL") or all_env.get("SUPABASE_URL")
    sb_key = all_env.get("SUPABASE_SERVICE_ROLE_KEY") or all_env.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")
    print_result("Supabase", *verify_supabase(sb_url, sb_key))

    print("\nNote: 'MISSING' means the key is empty or set to the default placeholder 'your_xxx'.")

if __name__ == "__main__":
    if 'requests' not in sys.modules:
        try:
            import requests
        except ImportError:
            print("Error: 'requests' module not found. Run: pip install requests")
            sys.exit(1)
    main()
