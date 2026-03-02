import requests
import json
import os

# Configuration from .env
API_KEY = "Your_Api_Key"
DATASET_ID = "Your_Dataset_Id"
LINKEDIN_URL = "Your_Linkedin_Url"

def debug_brightdata():
    print(f"🚀 Debugging BrightData API for dataset {DATASET_ID}...")
    print(f"🔑 Using API Key: {API_KEY[:4]}...{API_KEY[-4:]}")
    
    url = f"https://api.brightdata.com/datasets/v3/trigger?dataset_id={DATASET_ID}&format=json&uncompressed_webhook=true"
    
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json"
    }
    
    payload = [{ "url": LINKEDIN_URL }]
    
    print(f"📡 Sending request to: {url}")
    print(f"📦 Payload: {json.dumps(payload)}")
    
    try:
        response = requests.post(url, headers=headers, json=payload, timeout=30)
        
        print(f"\n⬅️ Response Status: {response.status_code}")
        
        if response.status_code != 200:
            print(f"❌ Request failed: {response.text}")
            return

        data = response.json()
        snapshot_id = data.get("snapshot_id")
        print(f"📸 Snapshot ID: {snapshot_id}")
        
        if not snapshot_id:
            print("❌ No snapshot ID received")
            return

        print("\n⏳ Polling for results...")
        import time
        
        while True:
            status_url = f"https://api.brightdata.com/datasets/v3/snapshot/{snapshot_id}?format=json"
            status_res = requests.get(status_url, headers=headers)
            
            if status_res.status_code != 200:
                print(f"⚠️ Polling error: {status_res.status_code}")
                time.sleep(5)
                continue
                
            # Check if we got data (list or object) or status
            try:
                res_data = status_res.json()
            except:
                print(f"⚠️ Invalid JSON in poll response")
                time.sleep(5)
                continue
                
            # If it's a list with data, we are done
            if isinstance(res_data, list) and len(res_data) > 0:
                print("\n✅ Data received!")
                print(json.dumps(res_data[0], indent=2))
                break
                
            if isinstance(res_data, dict):
                status = res_data.get("status") or res_data.get("state")
                print(f"   Status: {status}...")
                
                if status == "ready" or "snapshot_id" not in res_data:
                    # distinct 'ready' logic depends on API, sometimes it returns data directly if ready
                    pass
            
            time.sleep(5)

    except Exception as e:
        print(f"\n❌ Exception occurred: {e}")

if __name__ == "__main__":
    debug_brightdata()
