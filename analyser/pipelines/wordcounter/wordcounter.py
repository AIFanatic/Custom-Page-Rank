from bs4 import BeautifulSoup

class WordCounter():
    def run(html, params):
        if "text_only" in params and params["text_only"] == True:
            soup = BeautifulSoup(html, 'lxml')
            html = soup.text

        matches = []
        for word in params["words"]:
            matches.append({
                "word": word,
                "count": html.count(word)
            })

        return matches