var NeatTree = {
	
	fetchURLIcons: (localStorage && localStorage.fetchIcons),
	
	ignoredIcons: [
		'000000000000000000000000000000000000000000000000000000000000000000000000568514196170149291211271808211412417818998108169241839416125383941612539710716924111412217818911812718082617014929568514190000000000005685141965801533510811817413696106168214132139186236163174206255157169203255163174206255196204225255126133184236941041662141081161741366580153355685141900000000617014929108116174136981081702261411531942551741842132551851942192552352392472552242292412552552552552552302342452551851942192559410416622610611617413661701492900000000118127180829410416621419620422525517418421325517418421325517918921625517918921625522422924125525525525525525225325525519019922225519119922225592104166214118127180820000000011412217818912613318423625225325525517418421325517418421325517418421325517418421325524124425125525525525525524124425125517418421325520821423125512313118323611312217618900000000971071692411962042252552412442512551741842132551741842132551741842132552412442512552552552552552552552552552522532552552132192352551741842132551962042252559510516824100000000829316025321922423925525525525525518519421925521321923525524124425125525525525525525525525525525525525525525525525525519019922225517418421325521922423925581911592530000000082931602532302342452552552552552552412442512551851942192552352392472552552552552552552552552552552552552552552552552551901992222551791892162552192242392558091159253000000009610616824119620422525525525525525525525525525525525525525519620422525519620422525519620422525523023424525525525525525525525525525523523924725519620422525594104167241000000001141221781891271331842362552552552552552552552552552552552552412442512551741842132551741842132551741842132552012092292552552552552552552552552551181271802361111211761890000000011912917981941041662141962042252552552552552552552552552552412442512551741842132551741842132551741842132551741842132552522532552551962042252559210316621411912517981000000006170149291081161741369410416622619620422525525525525525525525525525521922423925517418421325517418421325521922423925519620422525592102166226106116174136617014929000000005685141965801533510611617413692104166214121129181236196204225255191199222255157169203255151163200255121129182236921031662141061161741366580153355685141900000000000056851419617014929119125179811131221761899510516824181921602538091159253941041672411131221771881211301818061701492956851419000000000000000000000000000000000000000000000000000000000000000000000000'
	],

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
		
		element.set('html', html).addEventListener('click', function(e){
			var el = e.target;
			if (el.tagName != 'SPAN') el = el.parentNode;
			if (el.tagName != 'SPAN') return;
			if (e.button != 0) return;
			if (e.shiftKey) return;
			var parent = el.parentNode;
			Element.toggleClass(parent, 'open');
			Element.setProperty(parent, 'aria-expanded', Element.hasClass(parent, 'open'));
			var children = parent.querySelector('ul');
			if (!children){
				var id = parent.id.replace('neat-tree-item-', '');
				var html = NeatTree.generateHTML(NeatTree.nonOpens[id]);
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
			});
			// Force middle clicks to trigger the focus event
			element.addEventListener('click', function(e){
				if (e.button != 1) return;
				var el = e.target;
				var tagName = el.tagName;
				if (tagName != 'A' && tagName != 'SPAN') el = el.parentNode;
				var parentTagName = el.tagName;
				if (parentTagName != 'A' && parentTagName != 'SPAN') return;
				el.focus();
			});
			
			var focusID = localStorage.focusID;
			if (typeof focusID != 'undefined' && focusID != null){
				var focusEl = $('neat-tree-item-' + focusID);
				if (focusEl) focusEl = focusEl.firstChild;
				if (focusEl) focusEl.addClass('focus');
			}
			
			NeatTree.fetchIcons();
		}
	},
	
	fetchIcons: function(element, dataURLs){
		if (!NeatTree.fetchURLIcons) return;
		if (!element) element = NeatTree.element;
		if (!dataURLs) dataURLs = NeatTree.dataURLs;
		
		var links = element.querySelectorAll('a:not(.fetched)[href^=http]');
		if (!links.length) return;
		
		(function(){
			var c = new Element('canvas').inject(document.body);
			var ctx = c.getContext('2d');
			
			var linksLen = links.length-1;
			var ignoredIcons = NeatTree.ignoredIcons;
			
			Array.each(links, function(el, i){
				var elImg = el.firstElementChild;
				var img = new Image();
				var domain = el.host;
				var data = dataURLs[domain];
				if (data){
					if (data !== 1) el.src = data;
					linksLen--;
					return;
				}
				var url = 'http://www.google.com/s2/favicons?domain=' + domain;
				img.onload = function(){
					var w = img.width, h = img.height;
					c.width = w;
					c.height = w;
					ctx.drawImage(img, 0, 0, w, h);
					var data = c.toDataURL();
					var d = Array.join(ctx.getImageData(0 ,0 , w, h).data, '');
					if (ignoredIcons.contains(d)){
						data = 1;
					} else {
						elImg.src = data;
					}
					dataURLs[domain] = data;
					
					if (i == linksLen) localStorage.dataURLs = JSON.stringify(dataURLs);
				};
				img.src = url;
			});
		}).delay(100);
	},
	
	_a: new Element('a'),
	
	generateHTML: function(data, group){
		var html = '<ul role="' + (group ? 'group' : 'tree') + '">';
		var a = NeatTree._a;
		var opens = NeatTree.opens;
		var nonOpens = NeatTree.nonOpens;
		var fetchURLIcons = NeatTree.fetchURLIcons;
		
		for (var i=0, l=data.length; i<l; i++){
			var d = data[i];
			var children = d.children;
			var hasChildren = !!children;
			var url = d.url;
			var id = d.id;
			var parentID = d.parentId;
			var idHTML = id ? ' id="neat-tree-item-' + id + '"': '';
			if (hasChildren || typeof url == 'undefined'){
				var isOpen = opens.contains(id);
				var open = isOpen ? ' open' : '';
				html += '<li class="parent' + open + '"' + idHTML + ' role="treeitem" aria-expanded="' + isOpen + '" data-parentid="' + parentID + '">'
					+ '<span tabindex="0"><img src="folder.png" width="16" height="16" alt="">' + d.name + '</span>';
				if (isOpen && hasChildren){
					html += NeatTree.generateHTML(children, true);
				} else {
					nonOpens[id] = children;
				}
			} else {
				html += '<li class="child"' + idHTML + ' role="treeitem" data-parentid="' + parentID + '">';
				var u = url.replace(/>/g, '&gt;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
				var title = ' title="' + u + '"';
				var name = d.name.replace(/>/g, '&gt;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
				var favicon = /^javascript:/i.test(u) ? 'document-code.png' : ('chrome://favicon/' + url);
				var fetched = false;
				if (fetchURLIcons){
					var dataURL = NeatTree.dataURLs[a.set('href', url).host];
					if (dataURL){
						fetched = true;
						if (dataURL !== 1) favicon = dataURL;
					}
				}
				var fetchedHTML = fetched ? ' class="fetched"' : '';
				html += '<a href="' + u + '"' + title + fetched + ' tabindex="0"><img src="' + favicon + '" width="16" height="16" alt=""><i>' + name + '</i></a>';
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
			$('confirm-dialog-text').set('html', opts.dialog.replace(/\s([^\s]+)$/i, '&nbsp;$1'));
			$('confirm-dialog-button-1').set('html', opts.button1);
			$('confirm-dialog-button-2').set('html', opts.button2);
			if (opts.fn1) ConfirmDialog.fn1 = opts.fn1;
			if (opts.fn2) ConfirmDialog.fn2 = opts.fn2;
			$('confirm-dialog-button-' + (opts.focusButton || 1)).focus();
		}
		document.body.addClass('needConfirm');
	},
	
	close: function(){
		document.body.removeClass('needConfirm');
		$('search-input').focus(); // temporary solution
	},
	
	fn1: function(){},
	
	fn2: function(){}
	
};

document.addEventListener('DOMContentLoaded', function(){
	try {
	
	var body = document.body;
	
	// Popup dimensions
	if (localStorage.popupHeight) body.style.height = localStorage.popupHeight + 'px';
	if (localStorage.popupWidth) body.style.width = localStorage.popupWidth + 'px';
	
	// Some i18n
	var _m = chrome.i18n.getMessage;
	$('search-input').placeholder = _m('searchBookmarks');
	$each({
		'bookmark-new-tab': 'openNewTab',
		'bookmark-new-window': 'openNewWindow',
		'bookmark-new-incognito-window': 'openIncognitoWindow',
		'bookmark-delete': 'delete',
		'folder-window': 'openBookmarks',
		'folder-new-window': 'openBookmarksNewWindow',
		'folder-new-incognito-window': 'openBookmarksIncognitoWindow',
		'folder-delete': 'delete'
	}, function(msg, id){
		$(id).innerHTML = _m(msg);
	});
	
	// Bookmark processing
	var processBookmarks = function(c){
		var response = [];
		for (var i=0, l=c.length; i<l; i++){
			var item = c[i];
			var o = {
				name: item.title || _m('untitledBookmark')
			};
			if (item.url){
				o.url = item.url;
				o.icon = ''
			}
			if (item.id) o.id = item.id;
			if (item.parentId) o.parentId = item.parentId;
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
		var json = processBookmarks(tree[0].children);
		NeatTree.init($tree, json);
	});
	
	// Popup auto-height
	var resetHeight = function(){
		setTimeout(function(){
			if (!body.style.webkitTransitionProperty) body.style.webkitTransitionProperty = 'height';
			var neatTree = $tree.firstElementChild;
			var fullHeight = neatTree.offsetHeight + $tree.offsetTop + 16;
			body.style.webkitTransitionDuration = (fullHeight < window.innerHeight) ? '.3s' : '.1s';
			var maxHeight = screen.height - window.screenY - 50;
			var height = Math.max(200, Math.min(fullHeight, maxHeight));
			body.style.height = height + 'px';
			localStorage.popupHeight = height;
		}, 100);
	};
	resetHeight();
	$tree.addEventListener('click', resetHeight);
	$tree.addEventListener('keyup', resetHeight);
	
	// Search
	var $results = $('results');
	var dataURLs = (localStorage && localStorage.dataURLs) ? JSON.parse(localStorage.dataURLs) : {};
	var fetchURLIcons = NeatTree.fetchURLIcons;
	var a = new Element('a');
	
	var searchMode = false;
	var searchInput = $('search-input');
	var prevValue = '';
	var search = function(){
		var value = searchInput.value.trim();
		localStorage.searchQuery = value;
		if (value == ''){
			searchMode = false;
			$results.style.display = 'none';
			$tree.style.display = 'block';
			return;
		}
		if (value == prevValue) return;
		prevValue = value;
		searchMode = true;
		chrome.bookmarks.search(value, function(results){
			results.sort(function(a, b){
				return b.dateAdded - a.dateAdded;
			});
			var html = '<ul role="list">';
			for (var i=0, l=results.length; i<l; i++){
				var result = results[i];
				var url = result.url;
				var u = url.replace(/>/g, '&gt;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
				var title = ' title="' + u + '"';
				var name = result.title.replace(/>/g, '&gt;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
				var favicon = /^javascript:/i.test(u) ? 'document-code.png' : ('chrome://favicon/' + url);
				html += '<li data-parentid="' + result.parentId + '" role="listitem">';
				var fetched = false;
				if (fetchURLIcons){
					var dataURL = NeatTree.dataURLs[a.set('href', url).host];
					if (dataURL){
						fetched = true;
						if (dataURL !== 1) favicon = dataURL;
					}
				}
				var fetchedHTML = fetched ? ' class="fetched"' : '';
				html += '<a href="' + u + '"' + title + fetched + ' tabindex="0"><img src="' + favicon + '" width="16" height="16" alt=""><i>' + name + '</i></a>';
				html += '</li>';
			}
			html += '</ul>';
			$results.set('html', html).style.display = 'block';
			$tree.style.display = 'none';
			
			NeatTree.fetchIcons($results, dataURLs);
			
			var lis = $results.querySelectorAll('li');
			Array.each(lis, function(li){
				var parentId = li.get('data-parentid');
				chrome.bookmarks.get(parentId, function(node){
					if (!node || !node.length) return;
					var a = li.querySelector('a');
					a.title = _m('parentFolder', node[0].title) + '\n' + a.title;
				});
			});
		});
	};
	searchInput.addEventListener('keydown', function(e){
		var key = e.keyCode;
		if (key == 40 && searchInput.value.length == searchInput.selectionEnd){ // down
			if (searchMode){
				$results.querySelector('ul>li:first-child a').focus();
			} else {
				$tree.querySelector('ul>li:first-child').querySelector('span, a').focus();
			}
		} else if (key == 13 && searchInput.value.length){ // enter
			var item = $results.querySelector('ul>li:first-child a');
			item.focus();
			setTimeout(function(){
				var event = document.createEvent('MouseEvents');
				event.initMouseEvent('click', true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
				item.dispatchEvent(event);
			}, 100);
		}
	});
	searchInput.addEventListener('keyup', search);
	searchInput.addEventListener('click', search);
	
	// Pressing esc shouldn't close the popup when search field has value
	searchInput.addEventListener('keydown', function(e){
		if (e.keyCode == 27 && searchInput.value){ // esc
			e.preventDefault();
			searchInput.value = '';
		}
	});
	
	// Saved search query
	if (localStorage.searchQuery){
		searchInput.set('value', localStorage.searchQuery);
		searchInput.click();
	}
	
	// Bookmark handling
	var openBookmarksLimit = 10;
	var actions = {
		
		openBookmark: function(url){
			chrome.tabs.getSelected(null, function(tab){
				chrome.tabs.update(tab.id, {
					url: url
				});
				if (!localStorage.bookmarkClickStayOpen) window.close.delay(200);
			});
		},
		
		openBookmarkNewTab: function(url, selected){
			chrome.tabs.create({
				url: url,
				selected: selected
			});
		},
		
		openBookmarkNewWindow: function(url, incognito){
			chrome.windows.create({
				url: url,
				incognito: incognito
			});
		},
		
		openBookmarks: function(urls, selected){
			var urlsLen = urls.length;
			var open = function(){
				for (var i=0; i<urlsLen; i++){
					chrome.tabs.create({
						url: urls[i],
						selected: selected
					});
				}
			};
			if (urlsLen > openBookmarksLimit){
				ConfirmDialog.open({
					dialog: _m('confirmOpenBookmarks', ''+urlsLen),
					button1: '<strong>' + _m('open') + '</strong>',
					button2: _m('nope'),
					fn1: open
				});
			} else {
				open();
			}
		},
		
		openBookmarksNewWindow: function(urls, incognito){
			var urlsLen = urls.length;
			var open = function(){
				chrome.extension.sendRequest({
					command: 'openAllBookmarksInNewWindow',
					data: urls,
					incognito: incognito
				});
			};
			if (urlsLen > openBookmarksLimit){
				var dialog = incognito ? _m('confirmOpenBookmarksNewIncognitoWindow', ''+urlsLen) : _m('confirmOpenBookmarksNewWindow', ''+urlsLen);
				ConfirmDialog.open({
					dialog: dialog,
					button1: '<strong>' + _m('open') + '</strong>',
					button2: _m('nope'),
					fn1: open
				});
			} else {
				open();
			}
		},
		
		deleteBookmark: function(id){
			var li = $('neat-tree-item-' + id);
			chrome.bookmarks.remove(id, function(){
				Element.destroy(li);
			});
		},
		
		deleteBookmarks: function(id, bookmarkCount, folderCount){
			var li = $('neat-tree-item-' + id);
			var item = li.querySelector('span');
			if (bookmarkCount || folderCount){
				var dialog = '';
				var folderName = '<cite>' + item.get('text').trim() + '</cite>';
				if (bookmarkCount && folderCount){
					dialog = _m('confirmDeleteFolderSubfoldersBookmarks', [folderName, folderCount, bookmarkCount]);
				} else if (bookmarkCount){
					dialog = _m('confirmDeleteFolderBookmarks', [folderName, bookmarkCount]);
				} else {
					dialog = _m('confirmDeleteFolderSubfolders', [folderName, folderCount]);
				}
				ConfirmDialog.open({
					dialog: dialog,
					button1: '<strong>' + _m('delete') + '</strong>',
					button2: _m('nope'),
					fn1: function(){
						chrome.bookmarks.removeTree(id, function(){
							li.destroy();
						});
					}
				});
			} else {
				chrome.bookmarks.removeTree(id, function(){
					li.destroy();
				});
			}
		}
		
	};
	
	var bookmarkHandler = function(e){
		e.preventDefault();
		var el = e.target;
		var button = e.button;
		if (e.ctrlKey || e.metaKey) button = 1;
		var shift = e.shiftKey;
		if (el.tagName == 'A' || el.parentNode.tagName == 'A' && (el = el.parentNode)){
			var url = el.get('href');
			if (button == 0){
				if (shift){
					actions.openBookmarkNewWindow(url);
				} else {
					actions.openBookmark(url);
				}
			} else if (button == 1){
				actions.openBookmarkNewTab(url, !shift);
			}
		} else if (el.tagName == 'SPAN' || el.parentNode.tagName == 'SPAN' && (el = el.parentNode)){
			var li = el.parentNode;
			var id = li.id.replace('neat-tree-item-', '');
			chrome.bookmarks.getChildren(id, function(children){
				var urls = Array.clean(Array.map(children, function(c){
					return c.url;
				}));
				var urlsLen = urls.length;
				if (!urlsLen) return;
				if (button == 0 && shift){ // shift click
					actions.openBookmarksNewWindow(urls);
				} else if (button == 1){ // middle-click
					actions.openBookmarks(urls, !shift);
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
	
	// Context menu
	var $bookmarkContextMenu = $('bookmark-context-menu');
	var $folderContextMenu = $('folder-context-menu');
	var bookmarkMenuWidth = $bookmarkContextMenu.offsetWidth;
	var bookmarkMenuHeight = $bookmarkContextMenu.offsetHeight;
	
	var clearMenu = function(e){
		currentContext = null;
		var active = body.querySelector('.active');
		if (active){
			Element.removeClass(active, 'active');
			// This is kinda hacky. Oh well.
			if (e){
				var el = e.target;
				if (el == $tree || el == $results) active.focus();
			}
		}
		$bookmarkContextMenu.style.left = '-999px';
		$bookmarkContextMenu.style.opacity = 0;
		$folderContextMenu.style.left = '-999px';
		$folderContextMenu.style.opacity = 0;
	};
	
	body.addEventListener('click', clearMenu);
	$tree.addEventListener('scroll', clearMenu);
	$results.addEventListener('scroll', clearMenu);
	$tree.addEventListener('focus', clearMenu);
	$results.addEventListener('focus', clearMenu);
	
	var currentContext = null;
	body.addEventListener('contextmenu', function(e){
		clearMenu();
		e.preventDefault();
		var el = e.target;
		if (el.tagName == 'A' || el.parentNode.tagName == 'A' && (el = el.parentNode)){
			currentContext = el;
			var active = body.querySelector('.active');
			if (active) Element.removeClass(active, 'active');
			Element.addClass(el, 'active');
			var pageX = Math.min(e.pageX, body.offsetWidth - bookmarkMenuWidth);
			var pageY = e.pageY;
			if (pageY > (window.innerHeight - bookmarkMenuHeight)) pageY -= bookmarkMenuHeight;
			$bookmarkContextMenu.style.left = pageX + 'px';
			$bookmarkContextMenu.style.top = pageY + 'px';
			$bookmarkContextMenu.style.opacity = 1;
			$bookmarkContextMenu.focus();
		} else if (el.tagName == 'SPAN' || el.parentNode.tagName == 'SPAN' && (el = el.parentNode)){
			currentContext = el;
			var active = body.querySelector('.active');
			if (active) Element.removeClass(active, 'active');
			Element.addClass(el, 'active');
			if (el.parentNode.get('data-parentid') == '0'){
				$folderContextMenu.addClass('hide-editables');
			} else {
				$folderContextMenu.removeClass('hide-editables');
			}
			var folderMenuWidth = $folderContextMenu.offsetWidth;
			var folderMenuHeight = $folderContextMenu.offsetHeight;
			var pageX = Math.min(e.pageX, body.offsetWidth - folderMenuWidth);
			var pageY = e.pageY;
			if (pageY > (window.innerHeight - folderMenuHeight)) pageY -= folderMenuHeight;
			$folderContextMenu.style.left = pageX + 'px';
			$folderContextMenu.style.top = pageY + 'px';
			$folderContextMenu.style.opacity = 1;
			$folderContextMenu.focus();
		}
	});
	
	$bookmarkContextMenu.addEventListener('click', function(e){
		e.stopPropagation();
		if (!currentContext) return;
		var el = e.target;
		if (el.tagName != 'LI') return;
		var url = currentContext.href;
		switch (el.id){
			case 'bookmark-new-tab':
				actions.openBookmarkNewTab(url);
				break;
			case 'bookmark-new-window':
				actions.openBookmarkNewWindow(url);
				break;
			case 'bookmark-new-incognito-window':
				actions.openBookmarkNewWindow(url, true);
				break;
			case 'bookmark-delete':
				var li = currentContext.parentNode;
				var id = li.id.replace('neat-tree-item-', '');
				actions.deleteBookmark(id);
				break;
		}
		clearMenu();
	});
	
	$folderContextMenu.addEventListener('click', function(e){
		e.stopPropagation();
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
			switch (el.id){
				case 'folder-window':
					if (noURLS) return;
					actions.openBookmarks(urls);
					break;
				case 'folder-new-window':
					if (noURLS) return;
					actions.openBookmarksNewWindow(urls);
					break;
				case 'folder-new-incognito-window':
					if (noURLS) return;
					actions.openBookmarksNewWindow(urls, true);
					break;
				case 'folder-delete':
					actions.deleteBookmarks(id, urlsLen, children.length-urlsLen);
					break;
			}
		});
		clearMenu();
	});
	
	// Keyboard navigation
	var treeKeyDown = function(e){
		var item = document.activeElement;
		if (!/^(a|span)$/i.test(item.tagName)) item = $tree.querySelector('.focus') || $tree.querySelector('li:first-child>span');
		var li = item.parentNode;
		switch (e.keyCode){
			case 40: // down
				e.preventDefault();
				if (li.hasClass('open')){
					li.querySelector('ul>li:first-child').querySelector('a, span').focus();
				} else {
					var nextLi = li.getNext();
					if (nextLi){
						nextLi.querySelector('a, span').focus();
					} else {
						var nextLi;
						do {
							li = li.parentNode.parentNode;
							if (li) nextLi = li.getNext();
							if (nextLi) nextLi.querySelector('a, span').focus();
						} while (li && !nextLi);
					}
				}
				break;
			case 38: // up
				e.preventDefault();
				var prevLi = li.getPrevious();
				if (prevLi){
					while (prevLi.hasClass('open')){
						var lis = prevLi.querySelectorAll('ul>li:last-child');
						prevLi = Array.filter(lis, function(li){
							return !!li.parentNode.offsetHeight;
						}).getLast();
					};
					prevLi.querySelector('a, span').focus();
				} else {
					var parentPrevLi = li.parentNode.parentNode;
					if (parentPrevLi && parentPrevLi.tagName == 'LI'){
						parentPrevLi.querySelector('a, span').focus();
					} else {
						searchInput.focus();
					}
				}
				break;
			case 39: // right
				e.preventDefault();
				if (!li.hasClass('open')){
					var event = document.createEvent('MouseEvents');
					event.initMouseEvent('click', true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
					li.firstElementChild.dispatchEvent(event);
				}
				break;
			case 37: // left
				e.preventDefault();
				if (li.hasClass('open')){
					var event = document.createEvent('MouseEvents');
					event.initMouseEvent('click', true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
					li.firstElementChild.dispatchEvent(event);
				}
				break;
			case 13: // enter
				e.preventDefault();
				var event = document.createEvent('MouseEvents');
				event.initMouseEvent('click', true, true, window, 0, 0, 0, 0, 0, e.ctrlKey, e.altKey, e.shiftKey, e.metaKey, 0, null);
				li.firstElementChild.dispatchEvent(event);
				break;
		}
	};
	$tree.addEventListener('keydown', treeKeyDown);
	$results.addEventListener('keydown', treeKeyDown);
	
	var treeKeyUp = function(e){
		var item = document.activeElement;
		if (!/^(a|span)$/i.test(item.tagName)) item = $tree.querySelector('.focus') || $tree.querySelector('li:first-child>span');
		var li = item.parentNode;
		switch (e.keyCode){
			case 46: // delete
				e.preventDefault();
				var id = li.id.replace('neat-tree-item-', '');
				if (li.hasClass('parent')){
					chrome.bookmarks.getChildren(id, function(children){
						var urlsLen = Array.clean(Array.map(children, function(c){
							return c.url;
						})).length;
						actions.deleteBookmarks(id, urlsLen, children.length-urlsLen);
					});
				} else if (li.hasClass('child')){
					actions.deleteBookmark(id);
				}
				break;
		}
	};
	$tree.addEventListener('keyup', treeKeyUp);
	$results.addEventListener('keyup', treeKeyUp);
	
	var contextKeyDown = function(e){
		var item = document.activeElement;
		switch (e.keyCode){
			case 40: // down
				e.preventDefault();
				if (item.tagName == 'LI'){
					var nextItem = item.getNext();
					if (nextItem.hasClass('separator')) nextItem = nextItem.getNext();
					if (nextItem) nextItem.focus();
				} else {
					item.firstElementChild.focus();
				}
				break;
			case 38: // up
				e.preventDefault();
				if (item.tagName == 'LI'){
					var prevItem = item.getPrevious();
					if (prevItem.hasClass('separator')) prevItem = prevItem.getPrevious();
					if (prevItem) prevItem.focus();
				} else {
					item.lastElementChild.focus();
				}
				break;
			case 13: // enter
				e.preventDefault();
				var event = document.createEvent('MouseEvents');
				event.initMouseEvent('click', true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
				item.dispatchEvent(event);
			case 27: // esc
				e.preventDefault();
				clearMenu();
		}
	};
	$bookmarkContextMenu.addEventListener('keydown', contextKeyDown);
	$folderContextMenu.addEventListener('keydown', contextKeyDown);
	
	var contextMouseMove = function(e){
		e.target.focus();
	};
	$bookmarkContextMenu.addEventListener('mousemove', contextMouseMove);
	$folderContextMenu.addEventListener('mousemove', contextMouseMove);
	
	var contextMouseOut = function(){
		this.focus();
	};
	$bookmarkContextMenu.addEventListener('mouseout', contextMouseOut);
	$folderContextMenu.addEventListener('mouseout', contextMouseOut);
	
	// Resizer
	var $resizer = $('resizer');
	var resizerDown = false;
	var bodyWidth;
	var screenX;
	$resizer.addEventListener('mousedown', function(e){
		e.preventDefault();
		e.stopPropagation();
		resizerDown = true;
		bodyWidth = body.offsetWidth;
		screenX = e.screenX;
	});
	document.addEventListener('mousemove', function(e){
		if (!resizerDown) return;
		e.preventDefault();
		var width = bodyWidth - (e.screenX - screenX);
		width = Math.min(640, Math.max(320, width));
		document.body.style.width = width + 'px';
		localStorage.popupWidth = width;
		clearMenu(); // messes the context menu
	});
	document.addEventListener('mouseup', function(e){
		if (!resizerDown) return;
		e.preventDefault();
		resizerDown = false;
	});
	
	} catch(e){
		var status = 'd cheeaun Neat Bookmarks: ' + e + ' ' + navigator.platform + ' ' + navigator.userAgent.match(/Chrome\/[^\s]*/);
		ConfirmDialog.open({
			dialog: '<strong>' + _m('errorOccured') + '</strong><br>' + _m('errorOccuredAction'),
			button1: '<strong>' + _m('reportError') + '</strong>',
			button2: _m('ignore'),
			fn1: function(){
				chrome.tabs.create({
					url: 'http://twitter.com/home?status=' + encodeURIComponent(status)
				});
			}
		});
	}
});