var quaver = (function() {
  var options = { 
    proxy: "http://localhost:4567/[[url]]",
    twitter: "twitter",
    tweet: "<p class='tweet'><span class='avatar'><img src='[[avatar]]' /></span>[[text]]<span class='meta'><span class='date'>[[date]]</span></span></p>",
    tumblr: "tumbler",
    delicious: "delicious",
    dateFormat: ago
  };
  
  
  var init = function(opts) {
    for(opt in opts) {
      options[opt] = opts[opt];
    }
  };
  
  // Twitter
  var tweets = function(id) {
    json(options.twitter, function(json) {
      var s = [], t = readTweets(json);
      for(var i = 0, l = t.length; i < l; ++i) {
        s.push(expand(options.tweet, t[i]));
      }
      $(id).html(s.join(""));
    });
  };
  function readTweets(obj) {
    res = [];
    for(var i = 0, l = obj.length; i < l; ++i) {
      var t = obj[i]
      res.push({ id: t.id, date: options.dateFormat(new Date(t.created_at)), avatar: t.user.profile_image_url, text: linkify(t.text) });
    }
    return res;
  }

  // mini-js utils
  function json(url, callback) {
    url = expand(options.proxy, { url: url });
    new ajax(url, function(r) {
      callback(eval(r.responseText));
    });
  }
  
  function $(id) {
    return new element(id);
  }
  
  function bind(fn, scope) {
    return function() {
      return fn.apply(scope, arguments);
    }
  }
  
  // started with http://snippets.dzone.com/posts/show/6995 and built on for twitter and emails
  var linkifyLinks = /((http\:\/\/|https\:\/\/|ftp\:\/\/)|(www\.))+(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/gi;
  var linkifyProtocol = /^((https?|ftp)\:\/\/)/i;
  var linkifyTweeters = /(^|\s)(@\w+)/g
  var linkifyHashtags = /(^|\s)(#\w+)/g
  // rough approximation of an email regex taken from http://www.gskinner.com/RegExr/ (which is awesome)
  var linkifyEmails = /([\w-\.]+)@((?:[\w]+\.)+)([a-zA-Z]{2,4})/g
  function linkify(text) {
    return text.replace(linkifyLinks, function(v) {
      var url = v;
      if(!v.match(linkifyProtocol)) {
        url = "http://" + v;
      }
      return "<a href='" + url + "'>" + url + "</a>";
    }).replace(linkifyEmails, function(v) {
      return "<a href='mailto:" + v + "'>" + v + "</a>";
    }).replace(linkifyTweeters, function(v) {
      var s = v[0] == "@" ? "" : v[0], u = v[0] == "@" ? v : v.substr(1);
      return s + "<a href='http://twitter.com/" + u + "'>" + u + "</a>";
    }).replace(linkifyHashtags, function(v) {
      var s = v[0] == "#" ? "" : v[0], h = v[0] == "#" ? v : v.substr(1);
      return s + "<a href='http://twitter.com/search?q=" + h + "'>" + h + "</a>";
    });
  }
  
  var expandRegex = /(\[\[\w*\]\])/g
  function expand(string, obj) {
    return string.replace(expandRegex, function(v) {
      var p = obj[v.substr(2, v.length - 4)];
      if(p !== null) return p;
      return "";
    });
  }
  
  function ago(date) {
    var now = new Date(), diff = now.getTime() - date.getTime(), minutes = 60 * 1000, hours = minutes * 60, days = hours * 24, weeks = days * 7, months = days * 30;
    if(diff < 5 * minutes) return "just now";
    if(diff < 20 * minutes) return Math.ceil(diff / minutes) + " minutes ago";
    if(diff < 45 * minutes) return "about half an hour ago";
    if(diff < 2 * hours) return "about an hour ago";
    if(diff < hours * 18) return "about " + Math.round(diff / hours) + " hours ago";
    if(diff < days * 2) return "about a day ago";
    if(diff < weeks) return "about " + Math.round(diff / days) + " days ago";
    if(diff < weeks * 1.5) return "about a week ago";
    if(diff < months * 2) return "about " + Math.round(diff / weeks) + " weeks ago";
    return "about " + Math.round(diff / months) + " months ago";
  }
  
  // mini-element class
  var element = function(el) {
    if(typeof el == "string") {
      el = document.getElementById(el);
    }
    this.el = el;
  }
  element.prototype = {
    html: function(content) {
      this.el.innerHTML = content;
    },
    // based roughly on http://www.quirksmode.org/js/opacity.html but I like 0..1 ranges
    opacity: function(value) {
    	this.el.style.opacity = value;
    	this.el.style.filter = 'alpha(opacity=' + value * 100 + ')';
    }
  };
  
  // mini-ajax class
  var ajax = function(url, complete) {
    this.url = url;
    this.complete = complete;
    this.get();
  };
  ajax.prototype = { 
    get: function() {
      this.transport = this.transport();
  		this.transport.open('GET', this.url, true);
  		this.transport.onreadystatechange = bind(this.state, this);
  		this.transport.send();
    },
    transport: function() {
  		if(window.ActiveXObject) return new ActiveXObject('Microsoft.XMLHTTP');
  		if(window.XMLHttpRequest) return new XMLHttpRequest();
  		return false;
    },
  	state: function() {
  		if(this.transport.readyState == 4 && this.transport.status == 200) {
  			if(this.complete) setTimeout(bind(function() { this.complete(this.transport); }, this), 10);
  			this.transport.onreadystatechange = function(){};
  		}
  	}
	};
	
	return { init: init, tweets: tweets, util: { ajax: ajax, linkify: linkify, element: element } };
})();