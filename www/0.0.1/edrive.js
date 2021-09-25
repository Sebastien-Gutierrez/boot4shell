$(function () {
	var ed = 'ed' in window ? window.ed : {};
	var domain = "https://vault.elephantdrive.com";
	var basicEDWebsite = "http://www.elephantdrive.com";
	var authNASScreen = '#authNASScreen';
	var deviceName = null;
	var isLoggedInMode = false;
	
	$.ajaxSetup({cache: false});

	var fillAjax = function (url, ajax) {
		ajax.url = "rest/" + url;
		ajax.contentType = 'application/json';
		if ('fillAjax' in ed) {
			ed.fillAjax(ajax);
		}
		return ajax;
	};

	var loadingMode = function (message) {
		$('#signupScreen').hide();
		$('#statusScreen').hide();
		$('#loginScreen').hide();
		$(authNASScreen).hide();
		$('#loadingMessage').text(message);
		$('#loadingScreen').show();
	};

	var signupMode = function () {
		$('#signupScreen').show();
		$('#loadingScreen').hide();
		$('#statusScreen').hide();
		$('#loginScreen').hide();
		$('#signupAlert').hide();
		$('#inputEmailS').val('');
		$('#inputPasswordS').val('');
		$('#inputPasswordConfirm').val('');
	};

	var statusMode = function () {
		$('#signupScreen').hide();
		$('#loadingScreen').hide();
		$('#statusScreen').show();
		$('#loginScreen').hide();
	};

	var errorHandler = function (httpObj) {
		$('#loadingScreen').hide();
		if (httpObj.status === 401) {
			$('#signupScreen').hide();
			$('#statusScreen').hide();
			$('#loginScreen').hide();
			$('#loginToYourNAS').prop("href", ed.getNasAuthUrl());
			$(authNASScreen).show();
			$("#nasLogoutBlock").hide();
		} else {
			console.error(httpObj);
		}
	};

	var loginMode = function () {
		$('#loadingScreen').hide();
		$('#statusScreen').hide();
		$('#signupScreen').hide();
		$('#loginScreen').show();
	};

	var infoErrorCheckerScheduled = false;
	
	var checkInfoError = function (response, forceSchedule) {
		forceSchedule = typeof (forceSchedule) !== "undefined" ? forceSchedule : true;
		if(isLoggedInMode) {
			if (response.isAuthenticated === false) {
				$('#statusAlert').html('Login failed: ' + response.authStatus);
				$('#statusAlert').show();
			} else {
				$('#statusAlert').hide();
			}
		}
		if (response.appStatus === 'error') {
			$('#applicationAlert').html(response.errorMessage + '<br><br>Please resolve error before continue');
			$('#applicationAlert').show();
			$('#loginBtn').prop('disabled', true);
			$('#signupBtn').prop('disabled', true);
			$('#inputEmail').prop('disabled', true);
			$('#inputPassword').prop('disabled', true);
			$('#inputEmailS').prop('disabled', true);
			$('#inputPasswordS').prop('disabled', true);
			$('#inputPasswordConfirm').prop('disabled', true);
		} else {
			$('#applicationAlert').hide();
			$('#loginBtn').prop('disabled', false);
			$('#signupBtn').prop('disabled', false);
			$('#inputEmail').prop('disabled', false);
			$('#inputPassword').prop('disabled', false);
			$('#inputEmailS').prop('disabled', false);
			$('#inputPasswordS').prop('disabled', false);
			$('#inputPasswordConfirm').prop('disabled', false);
		}
		if(infoErrorCheckerScheduled !== true || forceSchedule === true) {
			$.ajax(fillAjax('info', {})).done(function (response) {
				deviceName = response.devicename;
				setTimeout(function(){checkInfoError(response, true);}, 1000);
			});
			infoErrorCheckerScheduled = true;
		}
	};
	
	var startMode = function () {
		$('#loginAlert').hide();
		$('#inputEmail').val('');
		$('#inputPassword').val('');
		$.ajax(fillAjax('info', {})).done(function (response) {
			if (ed.useAuthNASRichScreen) {
				$("#nasLogoutBlock").show();
				$('.nas-user-name').text(ed.getNasUser());
			}
			loginMode();
			if (response.user.length !== 0) {
				isLoggedInMode = true;
				statusMode();
			}
			checkInfoError(response);
			$('#version').html(response.version !== null ? response.version : '&nbsp;');
			$('.nas-apps-config-form-app-version').show();
			$('#username').text(response.user);
			deviceName = response.devicename;
		}).fail(errorHandler);
		$('#nasLoginAlert').hide();
		$('#nasInputPassword').val('');
	};

	var waitForEvent = function (eventType, onSuccess, onError, timeout, startTime) {
		startTime = typeof (startTime) === "undefined" ? new Date() : startTime;
		timeout = typeof (timeout) === "undefined" ? Infinity : timeout;
		setTimeout(function () {
			if (((new Date()) - startTime) > timeout) {
				onError("timeout");
			} else {
				$.ajax(fillAjax('events', {
					method: 'GET'
				})).done(function (response) {
					for (var k in response) {
						if (response[k].sourceType === eventType) {
							$.ajax(fillAjax('event/' + k, {
								method: 'DELETE'
							}));
							if (response[k].type === 'success')
								onSuccess();
							else if (response[k].type === 'error')
								onError(response[k].errorMessage);
							return;
						}
					}
					waitForEvent(eventType, onSuccess, onError, timeout, startTime);
				}).fail(function (httpObj) {
					if (httpObj.status === 0) {
						waitForEvent(eventType, onSuccess, onError, timeout, startTime);
					} else {
						errorHandler(httpObj);
					}
				});
			}
		}, 500);
	};

	$('#loginBtn').click(function (e) {
		e.preventDefault();
		$('#inputEmail').val($('#inputEmail').val().trim());
		if ($('#inputEmail').val().length === 0 || $('#inputPassword').val().trim().length === 0) {
			return;
		}
		$('#loginAlert').hide();
		loadingMode($('#loginLoadingMessage').text());

		var doneHandler = function () {
			function onSuccess() {
				//Show logged in screen
				$('#username').text($('#inputEmail').val());
				statusMode();
				$('#statusAlert').show();
			}
			function onError(message) {
				if (message === "timeout") {
					$.ajax(fillAjax('info', {})).done(function (response) {
						if (response.isAuthenticated === false) {
							waitForEvent("login", onSuccess, onError, 30000);
						} else {
							onSuccess();
						}
					}).fail(errorHandler);
				} else {
					if (message === "AUTH_CODE_USER_NOT_FOUND" || message === "AUTH_CODE_INVALID_PASSWORD") {
						message = "User not found or incorrect password";
					}
					$('#loginAlert').html(message);
					$('#loginAlert').show();
					loginMode();
				}
			}
			waitForEvent("login", onSuccess, onError, 30000);
		};

		$.ajax(fillAjax('user', {
			method: 'POST',
			data: JSON.stringify({user: $('#inputEmail').val(), pass: $('#inputPassword').val()})
		})).done(doneHandler).statusCode({202: doneHandler}).fail(errorHandler);
	});


	$("#inputEmail, #inputPassword").keypress(function (e) {
		if (e.which === 13) {
			$("#loginBtn").trigger("click");
		}
	});

	$('#logoutBtn').click(function (e) {
		e.preventDefault();

		loadingMode($('#logoutLoadingMessage').text());
		var doneHandler = function () {
			$('#inputEmail').val('');
			$('#inputPassword').val('');
			setTimeout(function () {
				location.reload();
			}, 5000);
		};
		$.ajax(fillAjax('user', {
			method: 'DELETE'
		})).done(doneHandler).statusCode({202: doneHandler}).fail(errorHandler);
	});

	$('#manageBackups').click(function (e) {
		e.preventDefault();
		$.ajax(fillAjax('autologin', {
			async: false
		})).done(function (response) {
			var params = response.autologinToken;
			params["tab"] = "naswizard";
			params["dname"] = deviceName;
			window.open(domain + "/account/autologin.aspx?" + $.param(params), "_blank");
		}).fail(errorHandler);
	});

	var currentLocation = function () {
		var url = location.href;
		// http://xxx/elephantdrive/  ->  http://xxx/elephantdrive/
		if (url.slice(-1) === "/") {
			return url;
			// http://xxx/elephantdrive/index.html ->  http://xxx/elephantdrive/
		} else if (url.lastIndexOf("/") < url.lastIndexOf(".")) {
			return url.substring(0, url.lastIndexOf("/") + 1);
			// http://xxx/elephantdrive  ->  http://xxx/elephantdrive/
		} else {
			return url + "/";
		}
	};

	$('#logFileBtn').click(function (e) {
		e.preventDefault();
		window.open(currentLocation().split("#")[0] + 'log', "_blank");
	});

	$('#errlogFileBtn').click(function (e) {
		e.preventDefault();
		window.open(currentLocation().split("#")[0] + 'errlog', "_blank");
	});

	$('#forgotPassBtn').click(function (e) {
		e.preventDefault();
		window.open(domain + "/account/forgot_password.aspx?UName=" + encodeURIComponent($('#inputEmail').val().trim()), "_blank");
	});

	$('#goToSignupBtn').click(function (e) {
		e.preventDefault();
		signupMode();
	});

	$('#signupBackToLoginBtn').click(function (e) {
		e.preventDefault();
		startMode();
	});

	var doneHandler = function () {
		waitForEvent("register", function () {
			//Show logged in screen
			$('#username').text($('#inputEmailS').val());
			statusMode();
			$('#statusAlert').show();
		}, function (message) {
			$('#loadingScreen').hide();
			$('#signupScreen').show();
			$('#signupAlert').html(message);
			$('#signupAlert').show();
		});
	};

	$('#signupBtn').click(function (e) {
		e.preventDefault();

		if ($('#inputPasswordS').val() !== $('#inputPasswordConfirm').val()) {
			$('#signupAlert').text($('#passwordDoNotMatchMessage').text());
			$('#signupAlert').show();
			return;
		}

		$('#inputEmailS').val($('#inputEmailS').val().trim());
		loadingMode($('#signupLoadingMessage').text());

		$.ajax(fillAjax('user', {
			method: 'PUT',
			data: JSON.stringify({user: $('#inputEmailS').val(), pass: $('#inputPasswordS').val(), c: ed.partnerId})
		})).done(doneHandler).statusCode({202: doneHandler}).fail(errorHandler);
	}); //signupBtn.click

	$("#inputEmailS, #inputPasswordS, #inputPasswordConfirm").keypress(function (e) {
		if (e.which === 13) {
			$("#signupBtn").trigger("click");
		}
	});

	var nasLoginSuccess = function () {
		$('.nas-user-name').text(ed.getNasUser());
	};

	var nasLoginFailure = function (message) {
		//Show notification: Username/password is wrong
		if (typeof message !== 'undefined') {
			$('#nasLoginAlert').html(message);
		} else {
			$('#nasLoginAlert').text($('#wrongLoginOrPasswordMessage').text());
		}
		$(authNASScreen).show();
		$('#nasInputPassword').val('');
		$('#nasLoginAlert').show();
		$('#loadingScreen').hide();
	};

	$('#nasLoginBtn').click(function (e) {
		e.preventDefault();
		$('#nasInputUser').val($('#nasInputUser').val().trim());
		if ($('#nasInputUser').val().length === 0 || $('#nasInputPassword').val().trim().length === 0) {
			return;
		}
		$('#nasLoginAlert').hide();
		loadingMode($('#loginLoadingMessage').text());
		ed.nasLoginCall(nasLoginSuccess, nasLoginFailure);
	});


	$("#nasInputUser, #nasInputPassword").keypress(function (e) {
		if (e.which === 13) {
			$("#nasLoginBtn").trigger("click");
			return false;
		}
	});

	$('#nasLogoutBtn').click(function (e) {
		e.preventDefault();
		ed.nasLogoutCall();
		$("#nasLogoutBlock").hide();
		window.location.reload();
	});

	var main = function () {
		$('title').text(ed.applicationName);
		$('.nas-os-name').text(ed.nasOSName);
		if ('nasVisitEDWebsiteLogin' in ed) {
			$('.nas-visit-ed-website-login').prop("href", ed.nasVisitEDWebsiteLogin);
		} else {
			$('.nas-visit-ed-website-login').prop("href", basicEDWebsite);
		}
		if ('nasVisitEDWebsiteSignup' in ed) {
			$('.nas-visit-ed-website-signup').prop("href", ed.nasVisitEDWebsiteSignup);
		} else {
			$('.nas-visit-ed-website-signup').prop("href", basicEDWebsite);
		}
		if ('nasVisitEDWebsiteLoggedin' in ed) {
			$('.nas-visit-ed-website-loggedin').prop("href", ed.nasVisitEDWebsiteLoggedin);
		} else {
			$('.nas-visit-ed-website-loggedin').prop("href", basicEDWebsite);
		}
		if ('signingUpMessageHtml' in ed) {
			$('#signingUpMessage').html(ed.signingUpMessageHtml);
		}
		if ('signingUpPropositionMessageHtml' in ed) {
			$('#signingUpPropositionMessage').html(ed.signingUpPropositionMessageHtml);
		}
		if ('useAuthNASRichScreen' in ed && ed.useAuthNASRichScreen) {
			authNASScreen = '#authNASRichScreen';
		} else {
			ed.useAuthNASRichScreen = false;
		}
		if ('domain' in ed) {
			domain = ed.domain;
		}
		var link = document.createElement('link');
    link.type = 'image/x-icon';
    link.rel = 'shortcut icon';
    link.href = domain + '/graphics/partners/elephantdrive/favicon.ico';
    document.getElementsByTagName('head')[0].appendChild(link);
		startMode();
	};

	main();

});