import requests
import json
import time

API_KEY = "Your_Api_Key"
SNAPSHOT_ID = "Your_Snapshot_Id"

def poll_snapshot():
    print(f"🚀 Polling BrightData Snapshot: {SNAPSHOT_ID}")
    
    headers = {
        "Authorization": f"Bearer {API_KEY}",
    }
    
    url = f"https://api.brightdata.com/datasets/v3/snapshot/{SNAPSHOT_ID}?format=json"
    
    try:
        response = requests.get(url, headers=headers, verify=False) # Skip SSL verify to avoid hangs
        
        if response.status_code != 200:
            print(f"❌ Error: {response.status_code} - {response.text}")
            return
            
        print("✅ Response received!")
        
        try:
            data = response.json()
            if isinstance(data, list) and len(data) > 0:
                print("\n📄 Record 1 Data Structure:")
                print(json.dumps(data[0], indent=2))
            elif isinstance(data, dict):
                print("\n📄 Response Data:")
                print(json.dumps(data, indent=2))
            else:
                print(f"\n⚠️ Unexpected data format: {type(data)}")
                print(data)
                
        except json.JSONDecodeError:
            print(f"\n❌ Could not parse JSON. Raw body preview: {response.text[:500]}...")
            
    except Exception as e:
        print(f"\n❌ Exception: {e}")

if __name__ == "__main__":
    import urllib3
    urllib3.disable_warnings() 
    poll_snapshot()
