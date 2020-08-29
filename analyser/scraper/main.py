import base64
import time

from flask import Flask, request, jsonify

from selenium import webdriver

headers = {
    'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.11 (KHTML, like Gecko) Chrome/23.0.1271.64 Safari/537.11',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Charset': 'ISO-8859-1,utf-8;q=0.7,*;q=0.3',
    'Accept-Encoding': 'none',
    'Accept-Language': 'en-US,en;q=0.8',
    'Connection': 'keep-alive'
}

app = Flask(__name__)
app.config["DEBUG"] = True

time.sleep(5) # Wait for selenium to boot up

chrome_options = webdriver.ChromeOptions()
chrome_options.add_argument("--headless")
driver = webdriver.Remote(
    command_executor='http://analyser_selenium_1:4444',
    options=chrome_options
)

@app.route('/api/v1/scraper', methods=['POST'])
def scraper():
    json = request.get_json()
    
    url = json.get("url")

    driver.get(url)
    webpage = driver.page_source

    webpage_base64 = base64.b64encode(webpage.encode('utf-8')).decode('utf-8')

    return {
        "status": "ok",
        "message": webpage_base64
    }

app.run(host='0.0.0.0', port=5000)