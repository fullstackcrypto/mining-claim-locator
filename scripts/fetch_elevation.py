#!/usr/bin/env python3
import requests
import json
import sys

def get_elevation(lat, lng):
    """Fetch elevation data from USGS API for a given point"""
    url = f"https://nationalmap.gov/epqs/pqs.php?x={lng}&y={lat}&units=Meters&output=json"
    response = requests.get(url)
    
    if response.status_code == 200:
        data = response.json()
        elevation = data.get('USGS_Elevation_Point_Query_Service', {}).get('Elevation_Query', {}).get('Elevation', None)
        if elevation:
            return float(elevation)
    
    return None

if __name__ == "__main__":
    # Can be called with lat lng parameters
    if len(sys.argv) == 3:
        lat = float(sys.argv[1])
        lng = float(sys.argv[2])
        elevation = get_elevation(lat, lng)
        print(json.dumps({"elevation": elevation}))
