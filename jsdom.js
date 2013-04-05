var jsdom = require("jsdom");
var redis = require('redis').createClient();
var fs = require('fs');
var jquery = fs.readFileSync("./jquery.js").toString();

var base_url = 'https://clients.mindbodyonline.com/ASP/home.asp?studioid=';
function read(id){
  //console.log(process.memoryUsage());
  var url = base_url+(id-1).toString();
  jsdom.env({html:url, src:jquery, done:function (errors, window) {
    var $ = window.$
    var title = $('title').text();
    if (title!=='Status | MINDBODY'){
      window.close();
      jsdom.env({html:'https://clients.mindbodyonline.com/ASP/main_class.asp', src:jquery, done:function (errors, window) {
        var $ = window.$
        var href = $('#top-logo-container a').attr('href');
        if (href){
          href = href.split("'")[1].split("'")[0];
          window.close();
          jsdom.env({html:href, src:jquery, done:function (errors, window) {
            var $ = window.$
            var links = {name:title.split(' Online')[0], url:href, mb_id:id};
            $('a').each(function(){
               var href = $(this).attr('href');
               if (href && href.indexOf('twitter.com')!==-1){
                 var chunks = href.split('/');
                 links.twitter = chunks[chunks.length-1];
               }
               if (href && href.indexOf('facebook.com')!==-1){
                 links.facebook = href;
               }
               if (href && href.indexOf('mailto:')!==-1){
                 links.email = href.split('mailto:')[1];
               }
            });
            console.log(links);
            redis.sadd('mb:users', links.mb_id, function(){
              var key = 'mb:user:'+links.mb_id;
              console.log(key);
              redis.hmset(key, links, function(){
                window.close();
                read(id-1)
              });
            });
          }});
        } else {
          console.log('--no data--');
          window.close();
          read(id-1)
        }
      }});
    } else {
      console.log('--no data--');
      window.close();
      read(id-20)
    }
  }});
}

read(37813)
