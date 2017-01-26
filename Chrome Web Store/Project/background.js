chrome.app.runtime.onLaunched.addListener(function() {
	chrome.app.window.create('index.html', {
		'innerBounds': {
			'width': 1280,
			'height': 720,
			'minWidth': 1280,
			'minHeight': 720
		},
		'resizable':true,
		'state': 'fullscreen'
	});
});
