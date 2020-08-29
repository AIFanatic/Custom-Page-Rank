from flask import Flask, request, jsonify
from urllib.request import Request, urlopen
import json

app = Flask(__name__)
app.config["DEBUG"] = True

AVAILABLE_PIPELINES = ["wordcounter", "sentiment"]
SCRAPER_API_URL = "http://analyser_scraper_1:5000/api/v1/scraper"
PIPELINES_API_URL_BASE = "http://analyser_pipeline-<PIPELINE>_1:5000/api/v1/pipelines/"

headers = {
    'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.11 (KHTML, like Gecko) Chrome/23.0.1271.64 Safari/537.11',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Charset': 'ISO-8859-1,utf-8;q=0.7,*;q=0.3',
    'Accept-Encoding': 'none',
    'Accept-Language': 'en-US,en;q=0.8',
    'Connection': 'keep-alive',
    'Content-Type': 'application/json'
}

@app.route('/api/v1/analyser', methods=['POST'])
def analyse():
    json_data = request.get_json()
    url = json_data.get("url")
    pipelines = json_data.get("pipelines")

    response = {}

    scraper_params = json.dumps({"url": url}).encode('utf8')
    scraper_request = Request(SCRAPER_API_URL, data=scraper_params, headers=headers)
    scraper_response = urlopen(scraper_request).read()
    scraper_response_json = json.loads(scraper_response)
    scraper_html = scraper_response_json.get("message")

    if scraper_response_json.get("status") == "ok":
        pipelines_response = []
        for pipeline in pipelines:
            pipeline_name = pipeline["name"]
            if pipeline_name not in AVAILABLE_PIPELINES:
                continue
            
            pipeline_params = pipeline["params"]
            pipeline_api_url = PIPELINES_API_URL_BASE.replace("<PIPELINE>", pipeline_name) + pipeline_name
            pipeline_params = json.dumps({"html": scraper_html, "params": pipeline_params}).encode('utf8')
            pipeline_request = Request(pipeline_api_url, data=pipeline_params, headers=headers)
            pipeline_response = urlopen(pipeline_request).read()
            pipeline_response_json = json.loads(pipeline_response)


            if pipeline_response_json.get("status") == "ok":
                pipelines_response.append({
                    "name": pipeline_name,
                    "response": pipeline_response_json.get("message")
                })

        response = jsonify({
            "status": "ok",
            "message": {
                "url": url,
                "pipelines": pipelines_response,
            }
        })

    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Content-Type', 'application/json')

    return response

app.run(host='0.0.0.0', port=5000)