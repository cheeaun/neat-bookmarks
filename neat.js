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

(function(window, document){
	try {
	
	var body = document.body;
	
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
		$(id).innerText = _m(msg);
	});
	
	// RTL indicator
	var rtl = (body.getComputedStyle('direction') == 'rtl');
	if (rtl) body.addClass('rtl');
	
	// Init some variables
	var opens = localStorage.opens ? JSON.parse(localStorage.opens) : [];
	var dataURLs = localStorage.dataURLs ? JSON.parse(localStorage.dataURLs) : {};
	var nonOpens = {};
	var rememberState = !localStorage.dontRememberState;
	var a = new Element('a');
	
	var generateHTML = function(data, level){
		if (!level) level = 0;
		var paddingStart = 14*level;
		var aPaddingStart = paddingStart+16;
		var group = (level == 0) ? 'tree' : 'group';
		var html = '<ul role="' + group + '" data-level="' + level + '">';
		
		var httpsPattern = /^https?:\/\//i;
		for (var i=0, l=data.length; i<l; i++){
			var d = data[i];
			var children = d.children;
			var hasChildren = !!children;
			var title = d.title.replace(/>/g, '&gt;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
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
					+ '<span tabindex="0" style="-webkit-padding-start: ' + paddingStart + 'px"><i class="twisty"></i>'
					+ '<img src="folder.png" width="16" height="16" alt="">' + (title || _m('noTitle'))
					+ '</span>';
				if (isOpen && hasChildren){
					html += generateHTML(children, level+1);
				} else {
					nonOpens[id] = children;
				}
			} else {
				var isBookmarklet = /^javascript:/i.test(url);
				if (isBookmarklet && url.length > 140) url = url.slice(0, 140) + '...';
				var u = url.replace(/>/g, '&gt;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
				var name = title || (httpsPattern.test(u) ? u.replace(httpsPattern, '') : _m('noTitle'));
				var favicon = isBookmarklet ? 'document-code.png' : ('chrome://favicon/' + url);
				html += '<li class="child"' + idHTML + ' role="treeitem" data-parentid="' + parentID + '">'
					+ '<a href="' + u + '"' + ' title="' + u + '" tabindex="0" style="-webkit-padding-start: ' + aPaddingStart + 'px">'
					+ '<img src="' + favicon + '" width="16" height="16" alt=""><i>' + name + '</i>'
					+ '</a>';
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
			if (focusEl) focusEl = focusEl.firstChild;
			if (focusEl) focusEl.addClass('focus');
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
	$tree.addEventListener('click', function(e){
		var el = e.target;
		var tagName = el.tagName;
		var button = e.button;
		if (button == 0){
			if (tagName != 'SPAN') return;
			if (e.shiftKey) return;
			var parent = el.parentNode;
			Element.toggleClass(parent, 'open');
			Element.setProperty(parent, 'aria-expanded', Element.hasClass(parent, 'open'));
			var children = parent.querySelector('ul');
			if (!children){
				var id = parent.id.replace('neat-tree-item-', '');
				var html = generateHTML(nonOpens[id], parseInt(parent.parentNode.get('data-level'))+1);
				var div = new Element('div', {html: html});
				var ul = div.querySelector('ul');
				Element.inject(ul, parent);
				div.destroy();
			}
			var opens = $tree.querySelectorAll('li.open');
			opens = Array.map(opens, function(li){
				return li.id.replace('neat-tree-item-', '');
			});
			localStorage.opens = JSON.stringify(opens);
		} else if (e.button == 1){ // Force middle clicks to trigger the focus event
			if (tagName != 'A' && tagName != 'SPAN') return;
			el.focus();
		}
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
				var url = result.url;
				var u = url.replace(/>/g, '&gt;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
				var title = ' title="' + u + '"';
				var name = result.title.replace(/>/g, '&gt;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
				var favicon = /^javascript:/i.test(u) ? 'document-code.png' : ('chrome://favicon/' + url);
				html += '<li data-parentid="' + result.parentId + '" id="results-item-' + id + '" role="listitem">'
					+ '<a href="' + u + '"' + title + ' tabindex="0"><img src="' + favicon + '" width="16" height="16" alt=""><i>' + name + '</i></a>'
					+ '</li>';
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
	if (!searchMode) resetHeight();
	$tree.addEventListener('click', resetHeight);
	$tree.addEventListener('keyup', resetHeight);
	
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
			var li1 = $('neat-tree-item-' + id);
			var li2 = $('results-item-' + id);
			chrome.bookmarks.remove(id, function(){
				if (li1){
					var nearLi1 = li1.getNext() || li1.getPrevious();
					li1.destroy();
					if (!searchMode && nearLi1) nearLi1.querySelector('a').focus();
				}
				if (li2){
					var nearLi2 = li2.getNext() || li2.getPrevious();
					li2.destroy();
					if (searchMode && nearLi2) nearLi2.querySelector('a').focus();
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
					}
				});
			} else {
				chrome.bookmarks.removeTree(id, function(){
					li.destroy();
				});
			}
		}
		
	};
	
	var middleClickBgTab = !!localStorage.middleClickBgTab;
	var bookmarkHandler = function(e){
		e.preventDefault();
		var el = e.target;
		var button = e.button;
		if (e.ctrlKey || e.metaKey) button = 1;
		var shift = e.shiftKey;
		if (el.tagName == 'A'){
			var url = el.get('href');
			if (button == 0){ // click
				if (shift){
					actions.openBookmarkNewWindow(url);
				} else {
					actions.openBookmark(url);
				}
			} else if (button == 1){ // middle-click
				actions.openBookmarkNewTab(url, middleClickBgTab ? false : !shift);
			}
		} else if (el.tagName == 'SPAN'){
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
	$tree.addEventListener('focus', clearMenu, true);
	$results.addEventListener('focus', clearMenu, true);
	
	var currentContext = null;
	body.addEventListener('contextmenu', function(e){
		clearMenu();
		e.preventDefault();
		var el = e.target;
		if (el.tagName == 'A'){
			currentContext = el;
			var active = body.querySelector('.active');
			if (active) Element.removeClass(active, 'active');
			Element.addClass(el, 'active');
			var pageX = rtl ? Math.max(0, e.pageX - bookmarkMenuWidth) : Math.min(e.pageX, body.offsetWidth - bookmarkMenuWidth);
			var pageY = e.pageY;
			if (pageY > (window.innerHeight - bookmarkMenuHeight)) pageY -= bookmarkMenuHeight;
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
				var id = li.id.replace(/(neat\-tree|results)\-item\-/, '');
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
		var keyCode = e.keyCode;
		var metaKey = e.metaKey;
		if (keyCode == 40 && metaKey) keyCode = 35; // cmd + down (Mac)
		if (keyCode == 38 && metaKey) keyCode = 36; // cmd + up (Mac)
		switch (keyCode){
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
			case 13: // enter
				e.preventDefault();
				var event = document.createEvent('MouseEvents');
				event.initMouseEvent('click', true, true, window, 0, 0, 0, 0, 0, e.ctrlKey, e.altKey, e.shiftKey, e.metaKey, 0, null);
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
				var id = li.id.replace(/(neat\-tree|results)\-item\-/, '');
				if (li.hasClass('parent')){
					chrome.bookmarks.getChildren(id, function(children){
						var urlsLen = Array.clean(Array.map(children, function(c){
							return c.url;
						})).length;
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
})(window, document);
