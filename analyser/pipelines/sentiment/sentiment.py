from bs4 import BeautifulSoup
import nltk
from nltk.sentiment.vader import SentimentIntensityAnalyzer

nltk.download('vader_lexicon')

sid = SentimentIntensityAnalyzer()


class Sentiment():
    def run(html, params):
        soup = BeautifulSoup(html, 'lxml')
        text = soup.text

        scores = {
            "negative": 0,
            "neutral": 0,
            "positive": 0,
            "compound": 0
        }

        if "split_phrases" in params and params["split_phrases"] == True:
            elements = soup.find_all()
            for element in elements:
                element_text = element.get_text()
                if len(element_text) > 1:
                    score = sid.polarity_scores(element_text)

                    if score["compound"] > params["split_phrases_threshold"]:
                        scores["positive"] += 1
                    elif score["compound"] < -params["split_phrases_threshold"]:
                        scores["negative"] += 1
                    else:
                        scores["neutral"] += 1

                        scores["compound"] += score["compound"]
                # Normalize
                scores_sum = scores["positive"] + scores["negative"] + scores["neutral"]
                scores["positive"] = round(scores["positive"] / scores_sum, 2)
                scores["negative"] = round(scores["negative"] / scores_sum, 2)
                scores["neutral"] = round(scores["neutral"] / scores_sum, 2)
        else:
            score = sid.polarity_scores(text)
            scores["positive"] = score["pos"]
            scores["negative"] = score["neg"]
            scores["neutral"] = score["neu"]
            scores["compound"] = score["compound"]

        return scores