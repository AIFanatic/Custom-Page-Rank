// DEFAULTS
const DEFAULT_PIPELINES = `[
    {
        "name": "wordcounter",
        "params": {
            "text_only": true,
            "words": ["president","trump", "Trump", "senator","democrat","conservative","republican","politic","left-wing","right-wing","government"]
        }
    },
    {
        "name": "sentiment",
        "params": {
            "split_phrases": true,
            "split_phrases_threshold": 0.05
        }
    }
]`
const DEFAULT_SCORER = `function scorer(url, pipelines) {
    var scores = {
		"wordcounter": 0,
		"sentiment": 0
	};

	for(const pipeline of pipelines) {
		if (pipeline["name"] == "wordcounter") {
			const words = pipeline["response"];
			const wordsSum = words.reduce((a, b) => +a + +b["count"], 0);

			if (wordsSum > 5) {
				scores["wordcounter"] = -1;
			}
		}
		else if (pipeline["name"] == "sentiment") {
			const sentiment = pipeline["response"]
			scores["sentiment"] = sentiment["compound"];
		}
	}

	// Weights
	scores["wordcounter"] *= 1;
	scores["sentiment"] *= 0.5;
	score = (scores["wordcounter"] + scores["sentiment"]) / 2;
	
	// Debug
    console.log("Analysed", url, scores["wordcounter"], scores["sentiment"], score)

    return score;
}`
const DEFAULT_DECORATOR = `function decorator(link, score) {
	if (score < 0) {
		link.style.color = "rgb(128,0,0)";
		link.style.backgroundColor = "rgba(128,0,0, 0.15)";
	}
	else {
		link.style.color = "rgb(0,128,0)";
		link.style.backgroundColor = "rgba(0,128,0, 0.15)";
	}
}`
const DEFAULT_CONFIG = `{"number_of_links_to_analyse": 5}`

function loadPipelines(callback) {
	chrome.storage.local.get(['pipelines'], function(result) {
		callback(result.pipelines ? result.pipelines : DEFAULT_PIPELINES);
	});
}

function loadScorer(callback) {
	chrome.storage.local.get(['scorer'], function(result) {
		callback(result.scorer ? result.scorer : DEFAULT_SCORER);
	});
}

function loadDecorator(callback) {
	chrome.storage.local.get(['decorator'], function(result) {
		callback(result.decorator ? result.decorator : DEFAULT_DECORATOR);
	});
}

function loadConfig(callback) {
	chrome.storage.local.get(['config'], function(result) {
		callback(result.config ? result.config : DEFAULT_CONFIG);
	});
}


function storePipelines(pipelinesStr) {
    chrome.storage.local.set({pipelines: pipelinesStr});
}

function storeScorer(scorerStr) {
    chrome.storage.local.set({scorer: scorerStr});
}

function storeDecorator(decoratorStr) {
    chrome.storage.local.set({decorator: decoratorStr});
}

function storeConfig(configStr) {
  chrome.storage.local.set({config: configStr});
}

function start() {
    loadPipelines(function(pipelines) {
        document.getElementById("pipelines-text").value = pipelines;
    })

    loadScorer(function(scorer) {
        document.getElementById("scorer-text").value = scorer;
    })

    loadDecorator(function(decorator) {
        document.getElementById("decorator-text").value = decorator;
    })

    loadConfig(function(config) {
      document.getElementById("config-text").value = config;
  })
}

start();

// Storage
document.getElementById("save-button").addEventListener("click", function(){
    storePipelines(document.getElementById("pipelines-text").value);
    storeScorer(document.getElementById("scorer-text").value);
    storeDecorator(document.getElementById("decorator-text").value);
    storeConfig(document.getElementById("config-text").value);

    window.close();
});

// TODO: jQuery just for this?
$('.tabgroup > div').hide();
$('.tabgroup > div:first-of-type').show();
$('.tabs a').click(function(e){
  e.preventDefault();
    var $this = $(this),
        tabgroup = '#'+$this.parents('.tabs').data('tabgroup'),
        others = $this.closest('li').siblings().children('a'),
        target = $this.attr('href');
    others.removeClass('active');
    $this.addClass('active');
    $(tabgroup).children('div').hide();
    $(target).show();
});