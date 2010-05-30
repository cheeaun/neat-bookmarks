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
		if (localStorage && localStorage.opens) NeatTree.opens = JSON.parse(localStorage.opens);
		
		var html = '<div class="neat-tree">' + NeatTree.generateHTML(data) + '</div>';
		
		var nonOpens = NeatTree.nonOpens;
		element.set('html', html).addEventListener('click', function(e){
			var el = e.target;
			if (el.tagName != 'SPAN') return;
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
			
			if (NeatTree.options.fetchURLIcons){
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
			}
		}
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
					var u = url.replace('<', '&lt;').replace('>', '&gt;').replace('"', '&quot;');
					var title = ' title="' + a.set('text', url).get('text') + '"';
					var name = d.name.replace('>', '&gt;').replace('"', '&quot;');
					var dataURL = NeatTree.dataURLs[a.set('href', url).host];
					if (dataURL){
						if (dataURL === 1){
							html += '<a href="' + u + '"' + title + ' class="fetched" tabindex="0">' + name + '</a>';
						} else {
							html += '<a href="' + u + '"' + title + ' class="fetched" tabindex="0" style="background-image: url(' + dataURL + ')">' + name + '</a>';
						}
					} else {
						html += '<a href="' + u + '"' + title + '>' + name + '</a>';
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

document.addEventListener('DOMContentLoaded', function(){
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
		var json = processBookmarks(tree[0].children);
		NeatTree.init($tree, json);
	});
	
	var $results = $('results');
	var dataURLs = (localStorage && localStorage.dataURLs) ? JSON.parse(localStorage.dataURLs) : {};
	var a = new Element('a');
	
	var searchInput = $('search-input');
	var search = function(){
		var value = searchInput.get('value').trim();
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
				var u = url.replace('>', '&gt;').replace('"', '&quot;');
				var title = ' title="' + a.set('text', url).get('text') + '"';
				var name = result.title.replace('>', '&gt;').replace('"', '&quot;');
				var dataURL = dataURLs[a.set('href', url).host];
				html += '<li>';
				if (dataURL && dataURL != 1){
					html += '<a href="' + u + '"' + title + ' style="background-image: url(' + dataURL + ')">' + name + '</a>';
				} else {
					html += '<a href="' + u + '"' + title + '>' + name + '</a>';
				}
				html += '</li>';
			}
			html += '</ul>';
			$results.set('html', html).style.display = 'block';
			$tree.style.display = 'none';
		});
	};
	searchInput.addEventListener('keyup', search);
	searchInput.addEventListener('click', search);
	
	var linkHandler = function(e){
		e.preventDefault();
		var el = e.target;
		if (el.tagName != 'A') el = el.getParent('a');
		if (!el) return;
		chrome.tabs.getSelected(null, function(tab){
			var button = e.button;
			if (e.ctrlKey || e.metaKey) button = 1;
			var url = el.get('href');
			var shift = e.shiftKey;
			if (button == 0){
				if (shift){
					chrome.windows.create({
						url: url
					});
				} else {
					chrome.tabs.update(tab.id, {
						url: url
					});
				}
			} else if (button == 1){ // middle-click
				chrome.tabs.create({
					url: url,
					selected: !shift
				});
			}
		});
	};
	$tree.addEventListener('click', linkHandler);
	$results.addEventListener('click', linkHandler);
});