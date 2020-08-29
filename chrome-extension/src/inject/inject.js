// CONFIG
const API_URL = "http://localhost:5000"

// TODO: Should be shared across whole extension
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

function getLinksWithHref(links) {
	var linksWithHref = []
	for (const link of links) {
		const href = link.getAttribute("href");

		if (href) {
			linksWithHref.push(link);
		}
	}
	return linksWithHref;
}

function removeDuplicateHrefs(links) {
	var newArray = [];
	var lookupObject  = {};

	for(var i in links) {
		const href = links[i].getAttribute("href"); 
	   lookupObject[href] = links[i];
	}

	for(i in lookupObject) {
		newArray.push(lookupObject[i]);
	}
	return newArray;
}

function getHrefsFromLinks(links) {
	var hrefs = []
	for(const link of links) {
		const href = link.getAttribute("href");

		if (href) {
			hrefs.push(href);
		}
	}

	return hrefs;
}

// TODO: Needs work
function cleanLinks(links) {
	var cleanedLinks = [];
	for(const link of links) {
		const href = link.href;

		// Not a link to the current page?
		if (!href.includes(document.location.origin)) {
			cleanedLinks.push(link);
		}
	}
	return cleanedLinks;
}

function remoteAnalyseLinks(links, pipelines) {
	const hrefs = getHrefsFromLinks(links);
	const params = {
		"urls": hrefs,
		"pipelines": pipelines
	}

	return fetch(API_URL + "/api/v1/analyser", {
		method: 'post',
		body: JSON.stringify(params),
		headers: {
			'Content-Type': 'application/json;charset=utf-8'
		},
	});
}

function remoteAnalyseUrl(url, pipelines) {
	const params = {
		"url": url,
		"pipelines": pipelines
	}

	return fetch(API_URL + "/api/v1/analyser", {
		method: 'post',
		body: JSON.stringify(params),
		headers: {
			'Content-Type': 'application/json;charset=utf-8'
		},
	});
}

async function fetchAsync(url, pipelines) {
	const params = {
		"url": url,
		"pipelines": pipelines
	}
	const response = await fetch(API_URL + "/api/v1/analyser", {
		method: 'post',
		body: JSON.stringify(params),
		headers: {
			'Content-Type': 'application/json;charset=utf-8'
		},
	});
	return await response.json();
}

function getPipelines(callback) {
	return new Promise(function(resolve, reject) {
		chrome.storage.local.get(['pipelines'], function(result) {
			resolve(result.pipelines ? JSON.parse(result.pipelines) : JSON.parse(DEFAULT_PIPELINES));
		});
	});
}

function getScorer(callback) {
	return new Promise(function(resolve, reject) {
		chrome.storage.local.get(['scorer'], function(result) {
			const scorer = new Function("return " + (result.scorer ? result.scorer : DEFAULT_SCORER))();
			resolve(scorer);
		});
	});
}

function getDecorator(callback) {
	return new Promise(function(resolve, reject) {
		chrome.storage.local.get(['decorator'], function(result) {
			const decorator = new Function("return " + (result.decorator ? result.decorator : DEFAULT_DECORATOR))();
			resolve(decorator);
		});
	});
}

function getConfig(callback) {
	return new Promise(function(resolve, reject) {
		chrome.storage.local.get(['config'], function(result) {
			resolve(result.config ? JSON.parse(result.config) : JSON.parse(DEFAULT_CONFIG));
		});
	});
}

function processAPIResponse(scorer, decorator, link, url, pipelinesResponse) {
	const score = scorer(url, pipelinesResponse);
	const decorate = decorator(link, score);

	link.classList.remove("analysing-link");
}

async function runWithLinks(links) {
	const config = await getConfig();
	const pipelines = await getPipelines();
	const scorer = await getScorer();
	const decorator = await getDecorator();

	links = links.slice(0, config["number_of_links_to_analyse"]);

	for(const link of links) {
		const url = link.href;
		link.classList.add("analysing-link");

		const response = await fetchAsync(url, pipelines);
		console.log("Response", response)
		if (response["status"] == "ok") {
			pipelinesResponse = response["message"]["pipelines"];
			processAPIResponse(scorer, decorator, link, url, pipelinesResponse);
		}
		
		// .then(function (response) {
		// 	if (response.ok) {
		// 		return response.json();
		// 	}
		// 	return Promise.reject(response);
		// }).then(function (data) {
		// 	if (data["status"] == "ok") {
		// 		pipelinesResponse = data["message"]["pipelines"];
		// 		processAPIResponse(scorer, decorator, link, url, pipelinesResponse);
		// 	}
		// }).catch(function (error) {
		// 	console.warn(error);
		// }).finally(function () {
		// });
	}

	// getConfig(function(config) {
	// 	getPipelines(function(pipelines) {
	// 		getScorer(function(scorer) {
	// 			getDecorator(function(decorator) {
	// 				// Run
	// 				links = links.slice(0, config["number_of_links_to_analyse"]);

	// 				for(const link of links) {
	// 					const url = link.href;
	// 					link.classList.add("analysing-link");

	// 					remoteAnalyseUrl(url, pipelines)
	// 					.then(function (response) {
	// 						if (response.ok) {
	// 							return response.json();
	// 						}
	// 						return Promise.reject(response);
	// 					}).then(function (data) {
	// 						if (data["status"] == "ok") {
	// 							pipelinesResponse = data["message"]["pipelines"];
	// 							processAPIResponse(scorer, decorator, link, url, pipelinesResponse);
	// 						}
	// 					}).catch(function (error) {
	// 						console.warn(error);
	// 					}).finally(function () {
	// 					});
	// 				}
	// 			})
	// 		})
	// 	})
	// })
}

var queue = {};

function processPipelines(id, pipelinesResponse) {
	getConfig(function(config) {
		getScorer(function(scorer) {
			getDecorator(function(decorator) {
				const link = queue[id]["link"]
				const url = queue[id]["url"]
				processAPIResponse(scorer, decorator, link, url, pipelinesResponse);
			})
		})
	})
}

chrome.extension.sendMessage({}, function(response) {
	var readyStateCheckInterval = setInterval(function() {
		if (document.readyState === "complete") {
			clearInterval(readyStateCheckInterval);

			// ----------------------------------------------------------
			// This part of the script triggers when page is done loading
			console.log("Helloa. This message was sent from scripts/inject.js");
			// ----------------------------------------------------------

			const links = document.querySelectorAll('a');
			const links_with_href = getLinksWithHref(links);
			const non_duplicate_links = removeDuplicateHrefs(links_with_href);
			var cleanedLinks = cleanLinks(non_duplicate_links);

			runWithLinks(cleanedLinks);
		}
	}, 10);
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
	if (message["action"] == "analyse_link") {
		const link = document.activeElement;

		// Debug
		console.log("Analysing", link.href);

		runWithLinks([link]);
	}
    return true
});