import requests
import json
import sys

def test_api(username):
    base_url = "http://localhost:3001"
    print(f"🚀 Testing LeetCode API for user: {username}")
    
    endpoints = [
        f"/userProfile/{username}",
        f"/{username}/solved",
        f"/{username}/contest",
        f"/{username}/submission"
    ]
    
    for endpoint in endpoints:
        url = f"{base_url}{endpoint}"
        print(f"📡 Calling {url}...")
        try:
            response = requests.get(url, timeout=10)
            if response.status_code == 200:
                data = response.json()
                # Print a small snippet of the data
                print(f"✅ Success! Response (truncated): {json.dumps(data)[:200]}...")
            else:
                print(f"❌ Failed! Status Code: {response.status_code}, Response: {response.text}")
        except Exception as e:
            print(f"💥 Exception: {e}")
        print("-" * 50)

if __name__ == "__main__":
    test_user = "alfaarghya"
    if len(sys.argv) > 1:
        test_user = sys.argv[1]
    test_api(test_user)
