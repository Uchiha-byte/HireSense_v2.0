import requests
import sys
import json
from datetime import datetime

# Configuration
BACKEND_URL = "http://localhost:8000"
FRONTEND_URL = "http://localhost:3000"
FRONTEND_API_URL = f"{FRONTEND_URL}/api"

# Status colors
GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
RESET = "\033[0m"

def print_status(name, status, details=""):
    color = GREEN if status == "OK" else (YELLOW if status == "WARN" else RED)
    print(f"{color}[{status}] {name}{RESET} {details}")

def check_endpoint(name, url, method="GET", expected_codes=[200], payload=None, description=""):
    try:
        if method == "GET":
            response = requests.get(url, timeout=5)
        elif method == "POST":
            response = requests.post(url, json=payload, timeout=5)
        else:
            return "ERROR", "Unsupported method"
        
        status_code = response.status_code
        
        if status_code in expected_codes:
            return "OK", f"({status_code})"
        
        # Special handling for protected endpoints
        if status_code in [401, 403]:
            return "WARN", f"({status_code}) - Auth required (Service accessible)"
        
        # Special handling for missing data/bad request (implies service is up)
        if status_code == 400:
            return "WARN", f"({status_code}) - Bad Request (Service accessible)"
            
        return "FAIL", f"({status_code}) - Expected {expected_codes}"
        
    except requests.exceptions.ConnectionError:
        return "FAIL", "Connection Refused (Service down?)"
    except Exception as e:
        return "ERROR", str(e)

def main():
    print(f"\n🚀 Starting API Health Check at {datetime.now().strftime('%H:%M:%S')}\n")
    
    # 1. Backend Service Check
    print("--- Backend (FastAPI) ---")
    
    # Health Check
    status, detail = check_endpoint("Health Check", f"{BACKEND_URL}/health", "GET", [200])
    print_status("GET /health", status, detail)
    
    # Root Check (Index)
    status, detail = check_endpoint("Root (Index)", f"{BACKEND_URL}/", "GET", [200])
    print_status("GET /", status, detail)
    
    # Interview Endpoints (POST requires body/state, so 400/404/422 is expected if up)
    status, detail = check_endpoint("Start Interview", f"{BACKEND_URL}/start_test", "POST", [200, 400, 404, 500])
    print_status("POST /start_test", status, detail)
    
    print("\n--- Frontend (Next.js) ---")
    
    # Root Check
    status, detail = check_endpoint("Frontend Root", f"{FRONTEND_URL}/", "GET", [200])
    print_status("GET /", status, detail)
    
    print("\n--- Frontend API Routes ---")
    
    # Waitlist (Public - should return JSON)
    status, detail = check_endpoint("Waitlist (Status)", f"{FRONTEND_API_URL}/waitlist?email=test@example.com", "GET", [200])
    print_status("GET /api/waitlist", status, detail)

    # Protected Endpoints - Generally expect 401/403/400/405 depending on auth middleware
    # If service is down, it would be Connection Refused.
    
    protected_endpoints = [
        ("GET /api/ashby/candidates", "/ashby/candidates", "GET"),
        ("POST /api/cv-process", "/cv-process", "POST"),
        ("POST /api/linkedin-fetch", "/linkedin-fetch", "POST"),
        ("POST /api/github-fetch", "/github-fetch", "POST"),
        ("POST /api/analysis", "/analysis", "POST"),
        ("POST /api/reference-call", "/reference-call", "POST"),
        ("GET /api/get-transcript", "/get-transcript?conversationId=test", "GET"),
    ]
    
    for name, path, method in protected_endpoints:
        # We expect 401 (Unauthorized) or 400 (Bad Request) if reachable but unauthenticated/invalid
        # 404 would mean the route doesn't exist (bad)
        # 500 might mean config error (bad)
        # 200 is unexpected for restricted/invalid requests but 'OK' if it happens (e.g. public dummy data)
        status, detail = check_endpoint(name, f"{FRONTEND_API_URL}{path}", method, [200, 400, 401, 403, 404, 405, 422])
        
        # Refine status for reporting
        if "Connection Refused" in detail:
            status = "FAIL"
        elif status == "OK": # It matched one of our 'reachable' codes
             if "404" in detail:
                 status = "FAIL" # Route not found
                 detail += " - Endpoint not found!"
             elif "405" in detail:
                 status = "WARN" # Method not allowed (but route exists)
             else:
                 status = "OK" # Service reachable
                 
        print_status(name, status, detail)
        
    print("\n---------------------------------------------------")
    print("Summary:")
    print(f"  {GREEN}[OK]{RESET}   : Endpoint reachable and returned expected status")
    print(f"  {YELLOW}[WARN]{RESET} : Endpoint reachable but returned error (Auth/Input required)")
    print(f"  {RED}[FAIL]{RESET} : Endpoint unreachable (Service down) or Not Found (404)")
    print("---------------------------------------------------\n")

if __name__ == "__main__":
    try:
        import requests
    except ImportError:
        print(f"{RED}Error: 'requests' module not found.{RESET}")
        print("Please install it running: pip install requests")
        sys.exit(1)
        
    main()
