// A generic onclick callback function.
function analyseLinkClicked(info, tab) {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
        chrome.tabs.sendMessage(tabs[0].id, {action: "analyse_link", url: info["linkUrl"]}, function(response) {

        });  
    });
}
  
var id = chrome.contextMenus.create({"title": "Analyse link", "contexts":["link"], "onclick": analyseLinkClicked});

// This is to remove X-Frame-Options header, if present
chrome.webRequest.onHeadersReceived.addListener(
    function(info) {
      var headers = info.responseHeaders;
      var index = headers.findIndex(x=>x.name.toLowerCase() == "x-frame-options");
      if (index !=-1) {
        headers.splice(index, 1);
      }
      return {responseHeaders: headers};
    },
    {
        urls: ['*://*/*'], //
        types: ['sub_frame']
    },
    ['blocking', 'responseHeaders']
);