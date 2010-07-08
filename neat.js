var NeatTree = {
	
	options: {
		fetchURLIcons: true,
		defaultIcon: 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAACu0lEQVQ4jaWTXVMaZxTHfwK7sLu4CyNqIRRUJFKttiX4EieZqbbpTLhJJpf9BMnYi/aLJDf2qt/A8aJvMf0Cph0jNDFjImNiBKGGFVI04CILbC+qTJz2Lv+r88w8//P8znnOgfdU11lgswuSILh9A4MfTU5cSi64lGDi2MANILmontTy60/SK99nXz1/ZJrVUrtlGgD2M7PT5QnEp5K3B6Pzd2Ij0cj0bMw7FPF1jY35u67NjzqLxRPVJgamNVXTDg7y2+22WbesdtMOIDo1f3wyefvDodmvL1/9NDI6FpK9mszns8P4+zXGR/r4eHxADg9e6N1+WQ8rsiTqr3c3W836kR0gEo1/GY7O3fnu25sRUXR06svvH9Lv68bT7USWBPKvD5majGobz/7uaZ6UMuXS3nMbwCfx5MLF4XDfzGehjtk0W5hmC68mA1AzmlQODbyaxPBQqG8ifn0BwAbgVIKJGzenempG81yHv7hyEVX5l0iRHIxE+tjJveHWrekeUQomABwAx4bl7vepqIoDRRYJ+j0E/Z6OGcBug2LpLQD9PhXDsNwdAgBFFgGYiQ+Q36/QMM/TnEkQ7ABYp2fH2T/v5EqqvzeEqjj46uowq6kcmdNLQyEf/l6ZuZlBSpU6mZc6kotqh6BxXFj/+ce18rsvjccC6KUqeqnKH+ld1jb+AsDncbG09LDcMArrnQRP0vcXMy+y+moq97/YAIX9Cq02rKZy7GYL+tP0yiKcTmK1WqtpqqZtbtXCF0IfaKGAhlO0IQgC+mnjxmMBMjs6d+/9slcspJa3Nh/+1Bkky2qZBwf5bUWWxMdPyz1rqT1bt1eVK4fH7OtHHL2t8+BBuvzr/d+zxUJq+XHqtx8ajaOiZbWb/1mm8EAsMXEp+Y0oBRNGHbdlWUguqqZReLTx58pi9tVW6t1lem/9A8T0Fk4ivpzMAAAAAElFTkSuQmCC',
		anotherDefaultIcon: 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAACgklEQVQ4EaVTS2tTQRQ+edy8bt43iSQ2N40NtSVWsUQaoi5ECD4gyy5cSBG6iht/iZt0UUq3Ci7jY1HcSS6hSSs0FFvQ2CY1asz7dZObl3OmRhRxowdm7rlzvvPNN2fOyMbjMfyPKSfJoeXHWqautl0Nea5Ig1G0WhcDjUZXj3GDQdOymrRpBSNfSwrHqb6pVxKePRIxJkMFmKztsy7/rH211ZIiPi/n4Gc4TuoPQcUowMtzsLV1UD7KV4omVh3ff/9tQ2TaBSShCnBn/0X7arszuHfhksvt9XDA6lSwuDAF7Y4EHpcRzvE2LnNQ4J48TevnfXbI7A3WiIC8HGUEiex6uxd5sLJEk3ENd0/uHqNLzcHpgCFqVu4vuRsEizkYoATD/ig67bY6gpf5UzSZ+4QAh8Wko2ttcQC1ukj+tcCftThILIoBSlAhBQuH5zgE/Wo3r82CkT2tM6tVwvkZB2RzFbh9a56rVMUAYmm00RD1Z2xGCsazTznNdEySEaggW30tNdEFxDZJDvpUATqYiBZcnIaTzzVSg9/V0CCZsA5ok+6hCvCes7mS0WnnqYrwdR8kdnJwSKGANwBOuw5uBL1QqnXh8EOR9gaGqQLOrEu/Jvf8A08/C3MuKJZadCR3j2B7r0DXbWYNPH+RKVtJDi5QAkYli2VJk+Cuf7NP5FjDEVBlhS/NooaRx34SCIlcGjtsY1PIT0iwgKhiYugn3+ZgfUPIG/XquJDMUQW0Btjb2J7YYeubQuTlq33H3Tt+DvugWu+AJA0htZ0snxRqRaNBHX9HsJiD5PQtoDN5TKEgH+gNRw/xnpvNrh7fChbZZmFTaq0ylnjzceePx4QE/2rfAQCqHU3jzrYUAAAAAElFTkSuQmCC'
	},

	nonOpens: {},
	
	init: function(element, data){
		NeatTree.element = document.id(element);
		NeatTree.load(data);
	},
	
	load: function(data){
		var element = NeatTree.element;
		NeatTree.data = data;
		var dataURLs = NeatTree.dataURLs = (localStorage && localStorage.dataURLs) ? JSON.parse(localStorage.dataURLs) : {};
		NeatTree.opens = (localStorage && localStorage.opens) ? JSON.parse(localStorage.opens) : [];
		
		var html = '<div class="neat-tree">' + NeatTree.generateHTML(data) + '</div>';
		
		var nonOpens = NeatTree.nonOpens;
		element.set('html', html).addEventListener('click', function(e){
			var el = e.target;
			if (el.tagName != 'SPAN') return;
			if (e.button != 0) return;
			if (e.shiftKey) return;
			var parent = el.parentNode;
			Element.toggleClass(parent, 'open');
			var children = parent.querySelector('ul');
			if (!children){
				var id = parent.id.replace('neat-tree-item-', '');
				var html = NeatTree.generateHTML(nonOpens[id]);
				var div = new Element('div', {html: html});
				var ul = div.querySelector('ul');
				Element.inject(ul, parent);
				div.destroy();
				NeatTree.fetchIcons();
			}
			var opens = element.querySelectorAll('li.open');
			opens = Array.map(opens, function(li){
				return li.id.replace('neat-tree-item-', '');
			});
			if (localStorage) localStorage.opens = JSON.stringify(opens);
		});
		
		if (localStorage){
			element.addEventListener('scroll', function(){
				localStorage.scrollTop = element.scrollTop;
			});
			
			element.scrollTop = localStorage.scrollTop || 0;
			
			element.addEventListener('focus', function(e){
				var el = e.target;
				var tagName = el.tagName;
				var focusEl = element.querySelector('.focus');
				if (focusEl) focusEl.removeClass('focus');
				if (tagName == 'A' || tagName == 'SPAN'){
					var id = el.parentNode.id.replace('neat-tree-item-', '');
					localStorage.focusID = id;
				} else {
					localStorage.focusID = null;
				}
			}, true);
			
			var focusID = localStorage.focusID;
			if (typeof focusID != 'undefined' && focusID != null){
				var focusEl = $('neat-tree-item-' + focusID);
				if (focusEl) focusEl = focusEl.firstChild;
				if (!focusEl) return;
				focusEl.addClass('focus');
			}
			
			NeatTree.fetchIcons();
		}
	},
	
	fetchIcons: function(element, dataURLs){
		if (!NeatTree.options.fetchURLIcons) return;
		if (!element) element = NeatTree.element;
		if (!dataURLs) dataURLs = NeatTree.dataURLs;
		
		var links = element.querySelectorAll('a:not(.fetched)[href^=http]');
		if (!links.length) return;
		
		(function(){
			var c = new Element('canvas').inject(document.body);
			var ctx = c.getContext('2d');
			
			var linksLen = links.length-1;
			var defaultIcon = NeatTree.options.defaultIcon;
			var anotherDefaultIcon = NeatTree.options.anotherDefaultIcon;
			
			Array.each(links, function(el, i){
				var img = new Image();
				var domain = el.host;
				var data = dataURLs[domain];
				if (data){
					if (data !== 1) el.style.backgroundImage = 'url(' + data + ')';
					linksLen--;
					return;
				}
				var url = 'http://www.google.com/s2/favicons?domain=' + domain;
				img.onload = function(){
					c.width = img.width;
					c.height = img.height;
					ctx.drawImage(img, 0, 0, img.width, img.height);
					var data = c.toDataURL();
					if (!data.contains(defaultIcon) && !data.contains(anotherDefaultIcon)){
						el.style.backgroundImage = 'url(' + data + ')';
					} else {
						data = 1;
					}
					dataURLs[domain] = data;
					
					if (i == linksLen) localStorage.dataURLs = JSON.stringify(dataURLs);
				};
				img.src = url;
			});
		}).delay(100);
	},
	
	_a: new Element('a'),
	
	generateHTML: function(data){
		var html = '<ul>';
		var a = NeatTree._a;
		var opens = NeatTree.opens;
		var nonOpens = NeatTree.nonOpens;
		
		for (var i=0, l=data.length; i<l; i++){
			var d = data[i];
			var children = d.children;
			var url = d.url;
			var id = d.id;
			var idHTML = id ? ' id="neat-tree-item-' + id + '"': '';
			if (!!children){
				var isOpen = opens.contains(id);
				var open = isOpen ? ' open' : '';
				html += '<li class="parent' + open + '"' + idHTML + '>'
					+ '<span tabindex="0">' + d.name + '</span>';
				if (isOpen){
					html += NeatTree.generateHTML(children);
				} else {
					nonOpens[id] = children;
				}
			} else {
				html += '<li class="child"' + idHTML + '>';
				if (url){
					var u = url.replace(/>/g, '&gt;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
					var title = ' title="' + u + '"';
					var name = d.name.replace(/>/g, '&gt;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
					var dataURL = NeatTree.dataURLs[a.set('href', url).host];
					if (dataURL){
						if (dataURL === 1){
							html += '<a href="' + u + '"' + title + ' class="fetched" tabindex="0">' + name + '</a>';
						} else {
							html += '<a href="' + u + '"' + title + ' class="fetched" tabindex="0" style="background-image: url(' + dataURL + ')">' + name + '</a>';
						}
					} else {
						html += '<a href="' + u + '"' + title + ' tabindex="0">' + name + '</a>';
					}
				} else {
					html += '<span tabindex="0">' + d.name + '</span>';
				}
			}
			html += '</li>';
		}
		html += '</ul>';
		return html;
	}
	
};

var ConfirmDialog = {
	
	open: function(opts){
		if (opts){
			$('confirm-dialog-text').set('html', opts.dialog);
			$('confirm-dialog-button-1').set('html', opts.button1);
			$('confirm-dialog-button-2').set('html', opts.button2);
			if (opts.fn1) ConfirmDialog.fn1 = opts.fn1;
			if (opts.fn2) ConfirmDialog.fn2 = opts.fn2;
		}
		document.body.addClass('needConfirm');
	},
	
	close: function(){
		document.body.removeClass('needConfirm');
	},
	
	fn1: function(){},
	
	fn2: function(){}
	
};

document.addEventListener('DOMContentLoaded', function(){
	var body = document.body;
	
	if (localStorage.popupHeight) body.style.height = localStorage.popupHeight + 'px';
	
	var processBookmarks = function(c){
		var response = [];
		for (var i=0, l=c.length; i<l; i++){
			var item = c[i];
			var o = {
				name: item.title || '(untitled)'
			};
			if (item.url){
				o.url = item.url;
				o.icon = ''
			}
			if (item.id) o.id = item.id;
			var children = item.children;
			if (children && children.length){
				o.children = processBookmarks(children);
			}
			response.push(o);
		}
		return response;
	};
	
	var $tree = $('tree');
	chrome.bookmarks.getTree(function(tree){
		// delay because window.screenY sometimes give the wrong value
		(function(){
			var height = screen.height - window.screenY - 40;
			body.style.height = height + 'px';
			localStorage.popupHeight = height;
		}).delay(0);
		
		var json = processBookmarks(tree[0].children);
		NeatTree.init($tree, json);
	});
	
	var $results = $('results');
	var dataURLs = (localStorage && localStorage.dataURLs) ? JSON.parse(localStorage.dataURLs) : {};
	var a = new Element('a');
	
	var searchInput = $('search-input');
	var search = function(){
		var value = searchInput.get('value').trim();
		localStorage.searchQuery = value;
		if (value == ''){
			$results.style.display = 'none';
			$tree.style.display = 'block';
			return;
		}
		chrome.bookmarks.search(value, function(results){
			results.sort(function(a, b){
				return b.dateAdded - a.dateAdded;
			});
			var html = '<ul>';
			for (var i=0, l=results.length; i<l; i++){
				var result = results[i];
				var url = result.url;
				var u = url.replace(/>/g, '&gt;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
				var title = ' title="' + u + '"';
				var name = result.title.replace(/>/g, '&gt;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
				var dataURL = dataURLs[a.set('href', url).host];
				html += '<li data-parentId="' + result.parentId + '">';
				if (dataURL){
					if (dataURL === 1){
						html += '<a href="' + u + '"' + title + ' class="fetched" tabindex="0">' + name + '</a>';
					} else {
						html += '<a href="' + u + '"' + title + ' class="fetched" tabindex="0" style="background-image: url(' + dataURL + ')">' + name + '</a>';
					}
				} else {
					html += '<a href="' + u + '"' + title + ' tabindex="0">' + name + '</a>';
				}
				html += '</li>';
			}
			html += '</ul>';
			$results.set('html', html).style.display = 'block';
			$tree.style.display = 'none';
			
			NeatTree.fetchIcons($results, dataURLs);
			
			var lis = $results.querySelectorAll('li');
			Array.each(lis, function(li){
				var parentId = li.get('data-parentId');
				chrome.bookmarks.get(parentId, function(node){
					if (!node || !node.length) return;
					var a = li.querySelector('a');
					a.title = 'Parent folder: "' + node[0].title + '"\n' + a.title;
				});
			});
		});
	};
	searchInput.addEventListener('keyup', search);
	searchInput.addEventListener('click', search);
	
	if (localStorage.searchQuery){
		searchInput.set('value', localStorage.searchQuery);
		searchInput.click();
	}
	
	var bookmarkHandler = function(e){
		console.log(e);
		e.preventDefault();
		var el = e.target;
		if (el.tagName == 'A'){
			chrome.tabs.getSelected(null, function(tab){
				var button = e.button;
				if (e.ctrlKey || e.metaKey) button = 1;
				var url = el.get('href');
				var shift = e.shiftKey;
				if (button == 0){
					if (shift){ // shift click
						chrome.windows.create({
							url: url
						});
					} else { // click
						chrome.tabs.update(tab.id, {
							url: url
						});
						if (!localStorage.bookmarkClickStayOpen) window.close();
					}
				} else if (button == 1){ // middle-click
					chrome.tabs.create({
						url: url,
						selected: !shift
					});
				}
			});
		} else if (el.tagName == 'SPAN'){
			var li = el.parentNode;
			var id = li.id.replace('neat-tree-item-', '');
			var button = e.button;
			if (e.ctrlKey || e.metaKey) button = 1;
			var shift = e.shiftKey;
			chrome.bookmarks.getChildren(id, function(children){
				var urls = Array.clean(Array.map(children, function(c){
					return c.url;
				}));
				if (!urls.length) return;
				if (button == 0 && shift){ // shift click
					chrome.extension.sendRequest({
						command: 'openAllBookmarksInNewWindow',
						data: urls
					});
				} else if (button == 1){ // middle-click
					for (var i=0, l=urls.length; i<l; i++){
						chrome.tabs.create({
							url: urls[i],
							selected: !shift
						});
					}
				}
			});
		}
	};
	$tree.addEventListener('click', bookmarkHandler);
	$results.addEventListener('click', bookmarkHandler);
	
	// Disable Chrome auto-scroll feature
	window.addEventListener('mousedown', function(e){
		if (e.button == 1) e.preventDefault();
	});
	
	var $bookmarkContextMenu = $('bookmark-context-menu');
	var $folderContextMenu = $('folder-context-menu');
	var bodyWidth = body.offsetWidth;
	var bookmarkMaxX = bodyWidth - $bookmarkContextMenu.offsetWidth;
	var bookmarkMenuHeight = $bookmarkContextMenu.offsetHeight;
	var folderMaxX = bodyWidth - $folderContextMenu.offsetWidth;
	var folderMenuHeight = $folderContextMenu.offsetHeight;
	
	var clearMenu = function(){
		var active = body.querySelector('.active');
		if (active) Element.removeClass(active, 'active');
		$bookmarkContextMenu.style.left = '-999px';
		$bookmarkContextMenu.style.opacity = 0;
		$folderContextMenu.style.left = '-999px';
		$folderContextMenu.style.opacity = 0;
	};
	
	body.addEventListener('click', clearMenu);
	$tree.addEventListener('scroll', clearMenu);
	$results.addEventListener('scroll', clearMenu);
	
	var currentContext = null;
	body.addEventListener('contextmenu', function(e){
		clearMenu();
		e.preventDefault();
		var el = e.target;
		var tagName = el.tagName;
		if (tagName == 'A'){
			currentContext = el;
			var active = body.querySelector('.active');
			if (active) Element.removeClass(active, 'active');
			Element.addClass(el, 'active');
			var pageX = Math.min(e.pageX, bookmarkMaxX);
			var pageY = e.pageY;
			if (pageY > (window.innerHeight - bookmarkMenuHeight)) pageY -= bookmarkMenuHeight;
			$bookmarkContextMenu.style.left = pageX + 'px';
			$bookmarkContextMenu.style.top = pageY + 'px';
			$bookmarkContextMenu.style.opacity = 1;
		} else if (tagName == 'SPAN'){
			currentContext = el;
			var active = body.querySelector('.active');
			if (active) Element.removeClass(active, 'active');
			Element.addClass(el, 'active');
			var pageX = Math.min(e.pageX, folderMaxX);
			var pageY = e.pageY;
			if (pageY > (window.innerHeight - folderMenuHeight)) pageY -= folderMenuHeight;
			$folderContextMenu.style.left = pageX + 'px';
			$folderContextMenu.style.top = pageY + 'px';
			$folderContextMenu.style.opacity = 1;
		}
	});
	
	$bookmarkContextMenu.addEventListener('click', function(e){
		if (!currentContext) return;
		var el = e.target;
		if (el.tagName != 'LI') return;
		var url = currentContext.href;
		switch (el.id){
			case 'bookmark-new-tab':
				chrome.tabs.create({
					url: url
				});
				break;
			case 'bookmark-new-window':
				chrome.windows.create({
					url: url
				});
				break;
			case 'bookmark-new-incognito-window':
				chrome.windows.create({
					url: url,
					incognito: true
				});
				break;
			case 'bookmark-delete':
				var li = currentContext.parentNode;
				var id = li.id.replace('neat-tree-item-', '');
				ConfirmDialog.open({
					dialog: 'Are you sure you want to delete the <strong>' + currentContext.get('text') + '</strong> bookmark?',
					button1: '<strong>Delete</strong>',
					button2: 'Cancel',
					fn1: function(){
						chrome.bookmarks.remove(id, function(){
							Element.destroy(li);
						});
					}
				});
				break;
		}
	});
	
	$folderContextMenu.addEventListener('click', function(e){
		if (!currentContext) return;
		var el = e.target;
		if (el.tagName != 'LI') return;
		var li = currentContext.parentNode;
		var id = li.id.replace('neat-tree-item-', '');
		chrome.bookmarks.getChildren(id, function(children){
			var urls = Array.clean(Array.map(children, function(c){
				return c.url;
			}));
			var urlsLen = urls.length;
			var noURLS = !urlsLen;
			var limit = 10;
			switch (el.id){
				case 'folder-window':
					if (noURLS) return;
					if (urlsLen > limit){
						ConfirmDialog.open({
							dialog: 'Are you sure you want to open all <strong>' + urlsLen + ' bookmarks</strong>?',
							button1: '<strong>Open</strong>',
							button2: 'Cancel',
							fn1: function(){
								for (var i=0; i<urlsLen; i++){
									chrome.tabs.create({
										url: urls[i]
									});
								}
							}
						});
					} else {
						for (var i=0; i<urlsLen; i++){
							chrome.tabs.create({
								url: urls[i]
							});
						}
					}
					break;
				case 'folder-new-window':
					if (noURLS) return;
					if (urlsLen > limit){
						ConfirmDialog.open({
							dialog: 'Are you sure you want to open all <strong>' + urlsLen + ' bookmarks</strong> in a new window?',
							button1: '<strong>Open</strong>',
							button2: 'Cancel',
							fn1: function(){
								chrome.extension.sendRequest({
									command: 'openAllBookmarksInNewWindow',
									data: urls
								});
							}
						});
					} else {
						chrome.extension.sendRequest({
							command: 'openAllBookmarksInNewWindow',
							data: urls
						});
					}
					break;
				case 'folder-new-incognito-window':
					if (noURLS) return;
					if (urlsLen > limit){
						ConfirmDialog.open({
							dialog: 'Are you sure you want to open all <strong>' + urlsLen + ' bookmarks</strong> in a new incognito window?',
							button1: '<strong>Open</strong>',
							button2: 'Cancel',
							fn1: function(){
								chrome.extension.sendRequest({
									command: 'openAllBookmarksInIncognitoWindow',
									data: urls
								});
							}
						});
					} else {
						chrome.extension.sendRequest({
							command: 'openAllBookmarksInIncognitoWindow',
							data: urls
						});
					}
					break;
				case 'folder-delete':
					ConfirmDialog.open({
						dialog: 'Are you sure you want to delete the <strong>' + currentContext.get('text') + '</strong> folder and <strong>' + urls.length + ' bookmark(s)</strong> in it?',
						button1: '<strong>Delete</strong>',
						button2: 'Cancel',
						fn1: function(){
							chrome.bookmarks.removeTree(id, function(){
								li.destroy();
							});
						}
					});
					break;
			}
		});
	});
});