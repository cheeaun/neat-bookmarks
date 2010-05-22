var NeatTree = new Class({

	Implements: [Events, Options],
	
	options: {
		fetchURLIcons: true,
		defaultIcon: 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAACu0lEQVQ4jaWTXVMaZxTHfwK7sLu4CyNqIRRUJFKttiX4EieZqbbpTLhJJpf9BMnYi/aLJDf2qt/A8aJvMf0Cph0jNDFjImNiBKGGFVI04CILbC+qTJz2Lv+r88w8//P8znnOgfdU11lgswuSILh9A4MfTU5cSi64lGDi2MANILmontTy60/SK99nXz1/ZJrVUrtlGgD2M7PT5QnEp5K3B6Pzd2Ij0cj0bMw7FPF1jY35u67NjzqLxRPVJgamNVXTDg7y2+22WbesdtMOIDo1f3wyefvDodmvL1/9NDI6FpK9mszns8P4+zXGR/r4eHxADg9e6N1+WQ8rsiTqr3c3W836kR0gEo1/GY7O3fnu25sRUXR06svvH9Lv68bT7USWBPKvD5majGobz/7uaZ6UMuXS3nMbwCfx5MLF4XDfzGehjtk0W5hmC68mA1AzmlQODbyaxPBQqG8ifn0BwAbgVIKJGzenempG81yHv7hyEVX5l0iRHIxE+tjJveHWrekeUQomABwAx4bl7vepqIoDRRYJ+j0E/Z6OGcBug2LpLQD9PhXDsNwdAgBFFgGYiQ+Q36/QMM/TnEkQ7ABYp2fH2T/v5EqqvzeEqjj46uowq6kcmdNLQyEf/l6ZuZlBSpU6mZc6kotqh6BxXFj/+ce18rsvjccC6KUqeqnKH+ld1jb+AsDncbG09LDcMArrnQRP0vcXMy+y+moq97/YAIX9Cq02rKZy7GYL+tP0yiKcTmK1WqtpqqZtbtXCF0IfaKGAhlO0IQgC+mnjxmMBMjs6d+/9slcspJa3Nh/+1Bkky2qZBwf5bUWWxMdPyz1rqT1bt1eVK4fH7OtHHL2t8+BBuvzr/d+zxUJq+XHqtx8ajaOiZbWb/1mm8EAsMXEp+Y0oBRNGHbdlWUguqqZReLTx58pi9tVW6t1lem/9A8T0Fk4ivpzMAAAAAElFTkSuQmCC'
	},
	
	initialize: function(element, data, options){
		this.setOptions(options);
		this.element = document.id(element);
		this.load(data);
		return this;
	},
	
	toElement: function(){
		return this.element;
	},
	
	load: function(data){
		var element = this.element;
		this.data = data;
		var dataURLs = this.dataURLs = (localStorage && localStorage.dataURLs) ? JSON.decode(localStorage.dataURLs) : {};
		
		var html = '<div class="neat-tree">' + this.generateHTML(data) + '</div>';
		
		var element = this.element.set('html', html).addEvent('click', function(e){
			var el = e.target;
			if (el.tagName != 'SPAN') return;
			el.getParent('li.parent').toggleClass('open');
			var opens = element.getElements('li.open').map(function(li){
				return li.id.replace('neat-tree-item-', '');
			});
			if (localStorage) localStorage.opens = JSON.encode(opens);
		});
		
		if (localStorage){
			element.addEvent('scroll', function(){
				localStorage.scrollTop = element.scrollTop;
			});
			
			if (localStorage.opens){
				var opens = JSON.decode(localStorage.opens);
				for (var i=opens.length; i--;){
					$('neat-tree-item-' + opens[i]).addClass('open');
				}
			}
			
			element.scrollTop = localStorage.scrollTop || 0;
			
			if (this.options.fetchURLIcons){
				var links = element.getElements('a:not(.fetched)[href^=http]');
				if (!links.length) return;
				
				var c = new Element('canvas', {
					styles: {
						display: 'none'
					}
				}).inject(document.body);
				var ctx = c.getContext('2d');
				
				var linksLen = links.length-1;
				var defaultIcon = this.options.defaultIcon;
				
				links.each(function(el, i){
					var img = new Image();
					var domain = el.host;
					var data = dataURLs[domain];
					if (data){
						if (data !== 1) el.setStyle('background-image', 'url(' + data + ')');
						linksLen--;
						return;
					}
					var url = 'http://www.google.com/s2/favicons?domain=' + domain;
					img.onload = function(){
						c.width = img.width;
						c.height = img.height;
						ctx.drawImage(img, 0, 0, img.width, img.height);
						var data = c.toDataURL();
						if (!data.contains(defaultIcon)){
							el.setStyle('background-image', 'url(' + data + ')');
						} else {
							data = 1;
						}
						dataURLs[domain] = data;
						img.destroy();
						
						if (i == linksLen) localStorage.dataURLs = JSON.encode(dataURLs);
					};
					img.src = url;
				});
			}
		}
		
		return this;
	},
	
	_a: new Element('a'),
	
	generateHTML: function(data){
		var html = '<ul>';
		var a = this._a;
		var self = this;
		
		for (var i=0, l=data.length; i<l; i++){
			var d = data[i];
			var children = d.children;
			var url = d.url;
			var id = d.id;
			var idHTML = id ? ' id="neat-tree-item-' + id + '"': '';
			if (!!children){
				html += '<li class="parent"' + idHTML + '>'
					+ '<span tabindex="0">' + d.name + '</span>'
					+ this.generateHTML(children);
			} else {
				html += '<li class="child"' + idHTML + '>';
				if (url){
					var u = url.replace('<', '&lt;').replace('>', '&gt;').replace('"', '&quot;');
					var title = (/^http/i.test(url)) ? (' title="' + a.set('text', url).get('text') + '"') : '';
					var name = d.name.replace('>', '&gt;').replace('"', '&quot;');
					var dataURL = self.dataURLs[a.set('href', url).host];
					if (dataURL && dataURL != 1){
						html += '<a href="' + u + '"' + title + ' class="fetched" style="background-image: url(' + dataURL + ')">' + name + '</a>';
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
	
});