(function(window, document, chrome){
	
	String.implement({
		htmlspecialchars: function(){
			return this.replace(/>/g, '&gt;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
		},
		widont: function(){
			return this.replace(/\s([^\s]+)$/i, '&nbsp;$1');
		}
	});
	
	var body = document.body;
	
	// Confirm dialog
	var ConfirmDialog = window.ConfirmDialog = {
		
		open: function(opts){
			if (!opts) return;
			$('confirm-dialog-text').set('html', opts.dialog.widont());
			$('confirm-dialog-button-1').set('html', opts.button1);
			$('confirm-dialog-button-2').set('html', opts.button2);
			if (opts.fn1) ConfirmDialog.fn1 = opts.fn1;
			if (opts.fn2) ConfirmDialog.fn2 = opts.fn2;
			$('confirm-dialog-button-' + (opts.focusButton || 1)).focus();
			body.addClass('needConfirm');
		},
		
		close: function(){
			body.removeClass('needConfirm');
		},
		
		fn1: function(){},
		
		fn2: function(){}
		
	};
	
	try {
	
	var os = Browser.Platform.name;
	var version = (function(){
		var matches = navigator.userAgent.match(/chrome\/([\d\.]+)/i);
		if (matches && matches[1]){
			var v = matches[1].split('.').map(function(s){
				return s.toInt();
			});
			return {
				major: v[0],
				minor: v[1],
				build: v[2],
				patch: v[3]
			};
		}
		return null;
	})();
	
	// Some i18n
	var _m = chrome.i18n.getMessage;
	$('search-input').placeholder = _m('searchBookmarks');
	$('edit-dialog-name').placeholder = _m('name');
	$('edit-dialog-url').placeholder = _m('url');
	Object.each({
		'bookmark-new-tab': 'openNewTab',
		'bookmark-new-window': 'openNewWindow',
		'bookmark-new-incognito-window': 'openIncognitoWindow',
		'bookmark-edit': 'edit',
		'bookmark-delete': 'delete',
		'folder-window': 'openBookmarks',
		'folder-new-window': 'openBookmarksNewWindow',
		'folder-new-incognito-window': 'openBookmarksIncognitoWindow',
		'folder-edit': 'edit',
		'folder-delete': 'deleteEllipsis',
		'edit-dialog-button': 'save'
	}, function(msg, id){
		$(id).innerText = _m(msg);
	});
	
	// RTL indicator
	var rtl = (window.getComputedStyle(body, null).direction == 'rtl');
	if (rtl) body.addClass('rtl');
	
	// Init some variables
	var opens = localStorage.opens ? JSON.parse(localStorage.opens) : [];
	var dataURLs = localStorage.dataURLs ? JSON.parse(localStorage.dataURLs) : {};
	var nonOpens = {};
	var rememberState = !localStorage.dontRememberState;
	var a = new Element('a');
	var httpsPattern = /^https?:\/\//i;
	
	var generateBookmarkHTML = function(title, url, extras){
		if (!extras) extras = '';
		var u = url.htmlspecialchars();
		var favicon = 'chrome://favicon/' + u;
		var tooltipURL = url;
		if (/^javascript:/i.test(url)){
			if (url.length > 140) tooltipURL = url.slice(0, 140) + '...';
			favicon = 'document-code.png';
		}
		tooltipURL = tooltipURL.htmlspecialchars();
		var name = title.htmlspecialchars() || (httpsPattern.test(url) ? url.replace(httpsPattern, '') : _m('noTitle'));
		return '<a href="' + u + '"' + ' title="' + tooltipURL + '" tabindex="0" ' + extras + '>'
			+ '<img src="' + favicon + '" width="16" height="16" alt=""><i>' + name + '</i>'
			+ '</a>';
	};
	
	var generateHTML = function(data, level){
		if (!level) level = 0;
		var paddingStart = 14*level;
		var aPaddingStart = paddingStart+16;
		var group = (level == 0) ? 'tree' : 'group';
		var html = '<ul role="' + group + '" data-level="' + level + '">';
		
		for (var i=0, l=data.length; i<l; i++){
			var d = data[i];
			var children = d.children;
			var hasChildren = !!children;
			var title = d.title.htmlspecialchars();
			var url = d.url;
			var id = d.id;
			var parentID = d.parentId;
			var idHTML = id ? ' id="neat-tree-item-' + id + '"': '';
			if (hasChildren || typeof url == 'undefined'){
				var isOpen = false;
				var open = '';
				if (rememberState){
					isOpen = opens.contains(id);
					if (isOpen) open = ' open';
				}
				html += '<li class="parent' + open + '"' + idHTML + ' role="treeitem" aria-expanded="' + isOpen + '" data-parentid="' + parentID + '">'
					+ '<span tabindex="0" style="-webkit-padding-start: ' + paddingStart + 'px"><b class="twisty"></b>'
					+ '<img src="folder.png" width="16" height="16" alt=""><i>' + (title || _m('noTitle')) + '</i>'
					+ '</span>';
				if (isOpen && hasChildren){
					html += generateHTML(children, level+1);
				} else {
					nonOpens[id] = children;
				}
			} else {
				html += '<li class="child"' + idHTML + ' role="treeitem" data-parentid="' + parentID + '">'
					+ generateBookmarkHTML(title, url, 'style="-webkit-padding-start: ' + aPaddingStart + 'px"');
			}
			html += '</li>';
		}
		html += '</ul>';
		return html;
	};
	
	var $tree = $('tree');
	chrome.bookmarks.getTree(function(tree){
		var html = generateHTML(tree[0].children);
		$tree.set('html', html);
		
		if (rememberState) $tree.scrollTop = localStorage.scrollTop || 0;
		
		var focusID = localStorage.focusID;
		if (typeof focusID != 'undefined' && focusID != null){
			var focusEl = $('neat-tree-item-' + focusID);
			if (focusEl) focusEl.firstElementChild.addClass('focus');
		}
	});
	
	// Events for the tree
	$tree.addEventListener('scroll', function(){
		localStorage.scrollTop = $tree.scrollTop;
	});
	$tree.addEventListener('focus', function(e){
		var el = e.target;
		var tagName = el.tagName;
		var focusEl = $tree.querySelector('.focus');
		if (focusEl) focusEl.removeClass('focus');
		if (tagName == 'A' || tagName == 'SPAN'){
			var id = el.parentNode.id.replace('neat-tree-item-', '');
			localStorage.focusID = id;
		} else {
			localStorage.focusID = null;
		}
	}, true);
	var closeUnusedFolders = localStorage.closeUnusedFolders;
	$tree.addEventListener('click', function(e){
		if (e.button != 0) return;
		var el = e.target;
		var tagName = el.tagName;
		if (tagName != 'SPAN') return;
		if (e.shiftKey || e.ctrlKey) return;
		var parent = el.parentNode;
		Element.toggleClass(parent, 'open');
		var expanded = Element.hasClass(parent, 'open');
		Element.setProperty(parent, 'aria-expanded', expanded);
		var children = parent.querySelector('ul');
		if (!children){
			var id = parent.id.replace('neat-tree-item-', '');
			var html = generateHTML(nonOpens[id], parseInt(parent.parentNode.get('data-level'))+1);
			var div = new Element('div', {html: html});
			var ul = div.querySelector('ul');
			Element.inject(ul, parent);
			div.destroy();
		}
		if (closeUnusedFolders && expanded){
			var siblings = parent.getSiblings('li');
			for (var i=0, l=siblings.length; i<l; i++){
				var li = siblings[i];
				if (li.hasClass('parent')){
					li.removeClass('open').setProperty('aria-expanded', false);
				}
			}
		}
		var opens = $tree.querySelectorAll('li.open');
		opens = Array.map(opens, function(li){
			return li.id.replace('neat-tree-item-', '');
		});
		localStorage.opens = JSON.stringify(opens);
	});
	// Force middle clicks to trigger the focus event
	$tree.addEventListener('mouseup', function(e){
		if (e.button != 1) return;
		var el = e.target;
		var tagName = el.tagName;
		if (tagName != 'A' && tagName != 'SPAN') return;
		el.focus();
	});
	
	// Search
	var $results = $('results');
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
				var id = result.id;
				html += '<li data-parentid="' + result.parentId + '" id="results-item-' + id + '" role="listitem">'
					+ generateBookmarkHTML(result.title, result.url);
			}
			html += '</ul>';
			$results.set('html', html).style.display = 'block';
			$tree.style.display = 'none';
			
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
	searchInput.addEventListener('keyup', search);
	searchInput.addEventListener('click', search);
	
	searchInput.addEventListener('keydown', function(e){
		var key = e.keyCode;
		var focusID = localStorage.focusID;
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
			}, 30);
		} else if (key == 9 && !searchMode && typeof focusID != 'undefined' && focusID != null){ // tab
			var focusEl = $('neat-tree-item-' + focusID);
			if (focusEl){
				e.preventDefault();
				focusEl.firstElementChild.focus();
			}
		}
	});
	
	searchInput.addEventListener('focus', function(){
		body.addClass('searchFocus');
	});
	searchInput.addEventListener('blur', function(){
		body.removeClass('searchFocus');
	});
	
	// Pressing esc shouldn't close the popup when search field has value
	searchInput.addEventListener('keydown', function(e){
		if (e.keyCode == 27 && searchInput.value){ // esc
			e.preventDefault();
			searchInput.value = '';
		}
	});
	
	// Saved search query
	if (rememberState && localStorage.searchQuery){
		searchInput.set('value', localStorage.searchQuery);
		searchInput.click();
	}
	
	// Popup auto-height
	var resetHeight = function(){
		setTimeout(function(){
			var neatTree = $tree.firstElementChild;
			var fullHeight = neatTree.offsetHeight + $tree.offsetTop + 16;
			// Slide up faster than down
			body.style.webkitTransitionDuration = (fullHeight < window.innerHeight) ? '.3s' : '.1s';
			var maxHeight = screen.height - window.screenY - 50;
			var height = Math.max(200, Math.min(fullHeight, maxHeight));
			body.style.height = height + 'px';
			localStorage.popupHeight = height;
		}, 100);
	};
	if (!searchMode) resetHeight();
	$tree.addEventListener('click', resetHeight);
	$tree.addEventListener('keyup', resetHeight);
	
	// Edit dialog
	var EditDialog = window.EditDialog = {
		
		open: function(opts){
			if (!opts) return;
			$('edit-dialog-text').set('html', opts.dialog.widont());
			if (opts.fn) EditDialog.fn = opts.fn;
			var type = opts.type || 'bookmark';
			var name = $('edit-dialog-name');
			name.value = opts.name;
			name.focus();
			name.select();
			name.scrollLeft = 0; // very delicate, show first few words instead of last
			var url = $('edit-dialog-url');
			if (type == 'bookmark'){
				url.style.display = '';
				url.value = opts.url;
			} else {
				url.style.display = 'none';
				url.value = '';
			}
			body.addClass('needEdit');
		},
		
		close: function(){
			var urlInput = $('edit-dialog-url');
			var url = urlInput.value;
			if (!urlInput.validity.valid){
				urlInput.value = 'http://' + url;
				if (!urlInput.validity.valid) url = ''; // if still invalid, fuck it.
				url = 'http://' + url;
			}
			EditDialog.fn($('edit-dialog-name').value, url);
			body.removeClass('needEdit');
		},
		
		fn: function(){}
		
	};
	
	// Bookmark handling
	var dontConfirmOpenFolder = !!localStorage.dontConfirmOpenFolder;
	var bookmarkClickStayOpen = !!localStorage.bookmarkClickStayOpen;
	var openBookmarksLimit = 10;
	var actions = {
		
		openBookmark: function(url){
			chrome.tabs.getSelected(null, function(tab){
				chrome.tabs.update(tab.id, {
					url: url
				});
				if (!bookmarkClickStayOpen) window.close.delay(200);
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
			if (!dontConfirmOpenFolder && urlsLen > openBookmarksLimit){
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
			if (!dontConfirmOpenFolder && urlsLen > openBookmarksLimit){
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
		
		editBookmarkFolder: function(id){
			chrome.bookmarks.get(id, function(nodeList){
				if (!nodeList.length) return;
				var node = nodeList[0];
				var url = node.url;
				var isBookmark = !!url;
				var type = isBookmark ? 'bookmark' : 'folder';
				var dialog = isBookmark ? _m('editBookmark') : _m('editFolder');
				EditDialog.open({
					dialog: dialog,
					type: type,
					name: node.title,
					url: decodeURIComponent(url),
					fn: function(name, url){
						chrome.bookmarks.update(id, {
							title: name,
							url: isBookmark ? url : ''
						}, function(n){
							var title = n.title;
							var url = n.url;
							var li = $('neat-tree-item-' + id);
							if (isBookmark){
								var css = li.querySelector('a').style.cssText;
								li.set('html', generateBookmarkHTML(title, url, 'style="' + css + '"'));
							} else {
								var i = li.querySelector('i');
								var name = title || (httpsPattern.test(url) ? url.replace(httpsPattern, '') : _m('noTitle'));
								i.innerText = name;
							}
							if (searchMode){
								li = $('results-item-' + id);
								li.set('html', generateBookmarkHTML(title, url));
							}
							li.firstElementChild.focus();
						});
					}
				});
			});
		},
		
		deleteBookmark: function(id){
			var li1 = $('neat-tree-item-' + id);
			var li2 = $('results-item-' + id);
			chrome.bookmarks.remove(id, function(){
				if (li1){
					var nearLi1 = li1.getNext() || li1.getPrevious();
					li1.destroy();
					if (!searchMode && nearLi1) nearLi1.querySelector('a, span').focus();
				}
				if (li2){
					var nearLi2 = li2.getNext() || li2.getPrevious();
					li2.destroy();
					if (searchMode && nearLi2) nearLi2.querySelector('a, span').focus();
				}
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
						var nearLi = li.getNext() || li.getPrevious();
						if (nearLi) nearLi.querySelector('a, span').focus();
					},
					fn2: function(){
						li.querySelector('a, span').focus();
					}
				});
			} else {
				chrome.bookmarks.removeTree(id, function(){
					li.destroy();
				});
				var nearLi = li.getNext() || li.getPrevious();
				if (nearLi) nearLi.querySelector('a, span').focus();
			}
		}
		
	};
	
	var middleClickBgTab = !!localStorage.middleClickBgTab;
	var bookmarkHandler = function(e){
		e.preventDefault();
		if (e.button != 0) return; // force left-click
		var el = e.target;
		var ctrlMeta = (e.ctrlKey || e.metaKey);
		var shift = e.shiftKey;
		if (el.tagName == 'A'){
			var url = el.get('href');
			if (ctrlMeta){ // ctrl/meta click
				actions.openBookmarkNewTab(url, middleClickBgTab ? shift : !shift);
			} else { // click
				if (shift){
					actions.openBookmarkNewWindow(url);
				} else {
					actions.openBookmark(url);
				}
			}
		} else if (el.tagName == 'SPAN'){
			var li = el.parentNode;
			var id = li.id.replace('neat-tree-item-', '');
			chrome.bookmarks.getChildren(id, function(children){
				var urls = Array.map(children, function(c){
					return c.url;
				}).clean();
				var urlsLen = urls.length;
				if (!urlsLen) return;
				if (ctrlMeta){ // ctrl/meta click
					actions.openBookmarks(urls, !shift);
				} else if (shift){ // shift click
					actions.openBookmarksNewWindow(urls);
				}
			});
		}
	};
	$tree.addEventListener('click', bookmarkHandler);
	$results.addEventListener('click', bookmarkHandler);
	var bookmarkHandlerMiddle = function(e){
		if (e.button != 1) return; // force middle-click
		var event = document.createEvent('MouseEvents');
		event.initMouseEvent('click', true, true, window, 0, 0, 0, 0, 0, true, false, e.shiftKey, true, 0, null);
		e.target.dispatchEvent(event);
	};
	$tree.addEventListener('mouseup', bookmarkHandlerMiddle);
	$results.addEventListener('mouseup', bookmarkHandlerMiddle);
	
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
	$tree.addEventListener('focus', clearMenu, true);
	$results.addEventListener('focus', clearMenu, true);
	
	var currentContext = null;
	var macCloseContextMenu = false;
	body.addEventListener('contextmenu', function(e){
		e.preventDefault();
		clearMenu();
		if (os == 'mac'){
			macCloseContextMenu = false;
			setTimeout(function(){ macCloseContextMenu = true; }, 500);
		}
		var el = e.target;
		if (el.tagName == 'A'){
			currentContext = el;
			var active = body.querySelector('.active');
			if (active) Element.removeClass(active, 'active');
			Element.addClass(el, 'active');
			var pageX = rtl ? Math.max(0, e.pageX - bookmarkMenuWidth) : Math.min(e.pageX, body.offsetWidth - bookmarkMenuWidth);
			var pageY = e.pageY;
			var boundY = window.innerHeight - bookmarkMenuHeight;
			if (pageY > boundY) pageY -= bookmarkMenuHeight;
			if (pageY < 0) pageY = boundY;
			pageY = Math.max(0, pageY);
			$bookmarkContextMenu.style.left = pageX + 'px';
			$bookmarkContextMenu.style.top = pageY + 'px';
			$bookmarkContextMenu.style.opacity = 1;
			$bookmarkContextMenu.focus();
		} else if (el.tagName == 'SPAN'){
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
			var pageX = rtl ? Math.max(0, e.pageX - folderMenuWidth) : Math.min(e.pageX, body.offsetWidth - folderMenuWidth);
			var pageY = e.pageY;
			var boundY = window.innerHeight - folderMenuHeight;
			if (pageY > boundY) pageY -= folderMenuHeight;
			if (pageY < 0) pageY = boundY;
			$folderContextMenu.style.left = pageX + 'px';
			$folderContextMenu.style.top = pageY + 'px';
			$folderContextMenu.style.opacity = 1;
			$folderContextMenu.focus();
		}
	});
	// on Mac, holding down right-click for a period of time closes the context menu
	// Not a complete implementation, but it works :)
	if (os == 'mac') body.addEventListener('mouseup', function(e){
		if (e.button == 2 && macCloseContextMenu){
			macCloseContextMenu = false;
			clearMenu();
		}
	});
	
	var bookmarkContextHandler = function(e){
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
			case 'bookmark-edit':
				var li = currentContext.parentNode;
				var id = li.id.replace(/(neat\-tree|results)\-item\-/, '');
				actions.editBookmarkFolder(id);
				break;
			case 'bookmark-delete':
				var li = currentContext.parentNode;
				var id = li.id.replace(/(neat\-tree|results)\-item\-/, '');
				actions.deleteBookmark(id);
				break;
		}
		clearMenu();
	};
	// On Mac, all three mouse clicks work; on Windows, middle-click doesn't work
	$bookmarkContextMenu.addEventListener('mouseup', function(e){
		e.stopPropagation();
		if (e.button == 0 || (os == 'mac' && e.button == 1)) bookmarkContextHandler(e);
	});
	$bookmarkContextMenu.addEventListener('contextmenu', bookmarkContextHandler);
	$bookmarkContextMenu.addEventListener('click', function(e){
		e.stopPropagation();
	});
	
	var folderContextHandler = function(e){
		if (!currentContext) return;
		var el = e.target;
		if (el.tagName != 'LI') return;
		var li = currentContext.parentNode;
		var id = li.id.replace('neat-tree-item-', '');
		chrome.bookmarks.getChildren(id, function(children){
			var urls = Array.map(children, function(c){
				return c.url;
			}).clean();
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
				case 'folder-edit':
					actions.editBookmarkFolder(id);
					break;
				case 'folder-delete':
					actions.deleteBookmarks(id, urlsLen, children.length-urlsLen);
					break;
			}
		});
		clearMenu();
	};
	$folderContextMenu.addEventListener('mouseup', function(e){
		e.stopPropagation();
		if (e.button == 0 || (os == 'mac' && e.button == 1)) folderContextHandler(e);
	});
	$folderContextMenu.addEventListener('contextmenu', folderContextHandler);
	$folderContextMenu.addEventListener('click', function(e){
		e.stopPropagation();
	});
	
	// Keyboard navigation
	var keyBuffer = '', keyBufferTimer;
	var treeKeyDown = function(e){
		var item = document.activeElement;
		if (!/^(a|span)$/i.test(item.tagName)) item = $tree.querySelector('.focus') || $tree.querySelector('li:first-child>span');
		var li = item.parentNode;
		var keyCode = e.keyCode;
		var metaKey = e.metaKey;
		if (keyCode == 40 && metaKey) keyCode = 35; // cmd + down (Mac)
		if (keyCode == 38 && metaKey) keyCode = 36; // cmd + up (Mac)
		switch (keyCode){
			case 40: // down
				e.preventDefault();
				var liChild = li.querySelector('ul>li:first-child');
				if (li.hasClass('open') && liChild){
					liChild.querySelector('a, span').focus();
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
					while (prevLi.hasClass('open') && prevLi.querySelector('ul>li:last-child')){
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
			case 39: // right (left for RTL)
				e.preventDefault();
				if (li.hasClass('parent') && ((!rtl && !li.hasClass('open')) || (rtl && li.hasClass('open')))){
					var event = document.createEvent('MouseEvents');
					event.initMouseEvent('click', true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
					li.firstElementChild.dispatchEvent(event);
				} else if (rtl){
					var parentID = li.get('data-parentid');
					if (parentID == '0') return;
					$('neat-tree-item-' + parentID).querySelector('span').focus();
				}
				break;
			case 37: // left (right for RTL)
				e.preventDefault();
				if (li.hasClass('parent') && ((!rtl && li.hasClass('open')) || (rtl && !li.hasClass('open')))){
					var event = document.createEvent('MouseEvents');
					event.initMouseEvent('click', true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
					li.firstElementChild.dispatchEvent(event);
				} else if (!rtl){
					var parentID = li.get('data-parentid');
					if (parentID == '0') return;
					$('neat-tree-item-' + parentID).querySelector('span').focus();
				}
				break;
			case 32: // space
				if (os != 'mac') break;
			case 13: // enter
				e.preventDefault();
				var event = document.createEvent('MouseEvents');
				event.initMouseEvent('click', true, true, window, 0, 0, 0, 0, 0, e.ctrlKey, false, e.shiftKey, e.metaKey, 0, null);
				li.firstElementChild.dispatchEvent(event);
				break;
			case 35: // end
				if (searchMode){
					this.querySelector('li:last-child a').focus();
				} else {
					var lis = this.querySelectorAll('ul>li:last-child');
					var li = Array.filter(lis, function(li){
						return !!li.parentNode.offsetHeight;
					}).getLast();
					li.querySelector('span, a').focus();
				}
				break;
			case 36: // home
				if (searchMode){
					this.querySelector('ul>li:first-child a').focus();
				} else {
					this.querySelector('ul>li:first-child').querySelector('span, a').focus();
				}
				break;
			case 34: // page down
				var self = this;
				var getLastItem = function(){
					var bound = self.offsetHeight + self.scrollTop;
					var items = self.querySelectorAll('a, span');
					return Array.filter(items, function(item){
						return !!item.getParent('ul').offsetHeight && item.offsetTop < bound;
					}).getLast();
				};
				var item = getLastItem();
				if (item != document.activeElement){
					e.preventDefault();
					item.focus();
				} else {
					setTimeout(function(){
						getLastItem().focus();
					}, 0);
				}
				break;
			case 33: // page up
				var self = this;
				var getFirstItem = function(){
					var bound = self.scrollTop;
					var items = self.querySelectorAll('a, span');
					return Array.filter(items, function(item){
						return !!item.getParent('ul').offsetHeight && ((item.offsetTop + item.offsetHeight) > bound);
					})[0];
				};
				var item = getFirstItem();
				if (item != document.activeElement){
					e.preventDefault();
					item.focus();
				} else {
					setTimeout(function(){
						getFirstItem().focus();
					}, 0);
				}
				break;
			case 113: // F2, not for Mac
				if (os == 'mac') break;
				var id = li.id.replace(/(neat\-tree|results)\-item\-/, '');
				actions.editBookmarkFolder(id);
				break;
			case 46: // delete
				break; // don't run 'default'
			default:
				var key = String.fromCharCode(keyCode).trim();
				if (!key) return;
				if (key != keyBuffer) keyBuffer += key;
				clearTimeout(keyBufferTimer);
				keyBufferTimer = setTimeout(function(){ keyBuffer = ''; }, 500);
				var lis = this.querySelectorAll('ul>li');
				var items = [];
				for (var i=0, l=lis.length; i<l; i++){
					var li = lis[i];
					if (li.parentNode.offsetHeight) items.push(li.firstElementChild);
				}
				var pattern = new RegExp('^'+keyBuffer.escapeRegExp(), 'i');
				var batch = [];
				var startFind = false;
				var found = false;
				var activeElement = document.activeElement;
				for (var i=0, l=items.length; i<l; i++){
					var item = items[i];
					if (item == activeElement){
						startFind = true;
					} else if (startFind){
						if (pattern.test(item.innerText.trim())){
							found = true;
							item.focus();
							break;
						}
					} else {
						batch.push(item);
					}
				}
				if (!found){
					for (var i=0, l=batch.length; i<l; i++){
						var item = batch[i];
						if (pattern.test(item.innerText.trim())){
							item.focus();
							break;
						}
					}
				}
		}
	};
	$tree.addEventListener('keydown', treeKeyDown);
	$results.addEventListener('keydown', treeKeyDown);
	
	var treeKeyUp = function(e){
		var item = document.activeElement;
		if (!/^(a|span)$/i.test(item.tagName)) item = $tree.querySelector('.focus') || $tree.querySelector('li:first-child>span');
		var li = item.parentNode;
		switch (e.keyCode){
			case 8: // backspace
				if (os != 'mac') break; // somehow delete button on mac gives backspace
			case 46: // delete
				e.preventDefault();
				var id = li.id.replace(/(neat\-tree|results)\-item\-/, '');
				if (li.hasClass('parent')){
					chrome.bookmarks.getChildren(id, function(children){
						var urlsLen = Array.map(children, function(c){
							return c.url;
						}).clean().length;
						actions.deleteBookmarks(id, urlsLen, children.length-urlsLen);
					});
				} else {
					actions.deleteBookmark(id);
				}
				break;
		}
	};
	$tree.addEventListener('keyup', treeKeyUp);
	$results.addEventListener('keyup', treeKeyUp);
	
	var contextKeyDown = function(e){
		var menu = this;
		var item = document.activeElement;
		var metaKey = e.metaKey;
		switch (e.keyCode){
			case 40: // down
				e.preventDefault();
				if (metaKey){ // cmd + down (Mac)
					menu.lastElementChild.focus();
				} else {
					if (item.tagName == 'LI'){
						var nextItem = item.getNext();
						if (nextItem && nextItem.hasClass('separator')) nextItem = nextItem.getNext();
						if (nextItem){
							nextItem.focus();
						} else if (os != 'mac'){
							menu.firstElementChild.focus();
						}
					} else {
						item.firstElementChild.focus();
					}
				}
				break;
			case 38: // up
				e.preventDefault();
				if (metaKey){ // cmd + up (Mac)
					menu.firstElementChild.focus();
				} else {
					if (item.tagName == 'LI'){
						var prevItem = item.getPrevious();
						if (prevItem && prevItem.hasClass('separator')) prevItem = prevItem.getPrevious();
						if (prevItem){
							prevItem.focus();
						} else if (os != 'mac'){
							menu.lastElementChild.focus();
						}
					} else {
						item.lastElementChild.focus();
					}
				}
				break;
			case 32: // space
				if (os != 'mac') break;
			case 13: // enter
				e.preventDefault();
				var event = document.createEvent('MouseEvents');
				event.initMouseEvent('mouseup', true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
				item.dispatchEvent(event);
			case 27: // esc
				e.preventDefault();
				var active = body.querySelector('.active');
				if (active) active.removeClass('active').focus();
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
		if (this.style.opacity.toInt()) this.focus();
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
		var changedWidth = rtl ? (e.screenX - screenX) : (screenX - e.screenX);
		var width = bodyWidth + changedWidth;
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
	
	// Closing dialogs on escape
	var closeDialogs = function(){
			if (body.hasClass('needConfirm')) ConfirmDialog.fn2(); ConfirmDialog.close();
			if (body.hasClass('needEdit')) EditDialog.close();
	};
	document.addEventListener('keydown', function(e){
		if (e.keyCode == 27){ // esc
			e.preventDefault();
			closeDialogs();
		}
	});
	$('cover').addEventListener('click', closeDialogs);
	
	// Make webkit transitions work only after elements are settled down
	setTimeout(function(){
		body.addClass('transitional');
	}, 10);
	
	// Fix stupid Chrome build 536 bug
	if (version.build >= 536) body.addClass('chrome-536');
	
	} catch(e){
		ConfirmDialog.open({
			dialog: '<strong>' + _m('errorOccured') + '</strong><pre>' + e + '</pre>',
			button1: '<strong>' + _m('reportError') + '</strong>',
			button2: _m('ignore'),
			fn1: function(){
				chrome.tabs.create({
					url: 'https://chrome.google.com/extensions/detail/nnancliccjabjjmipbpjkfbijifaainp'
				});
			}
		});
	}
	
	if (localStorage.userstyle){
		new Element('style', {
			text: localStorage.userstyle
		}).inject(document.body);
	}
})(window, document, chrome);
