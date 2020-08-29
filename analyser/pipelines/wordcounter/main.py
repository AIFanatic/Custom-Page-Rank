import base64
from flask import Flask, request, jsonify
from wordcounter import WordCounter

app = Flask(__name__)
app.config["DEBUG"] = True

@app.route('/api/v1/pipelines/wordcounter', methods=['POST'])
def analysis():
    json = request.get_json()

    params = json.get("params")
    base64_html = json.get("html")

    html = base64.b64decode(base64_html).decode('utf-8')

    response = WordCounter.run(html, params)

    return {
        "status": "ok",
        "message": response
    }

app.run(host='0.0.0.0', port=5000)