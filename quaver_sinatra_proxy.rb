require 'rubygems'
require 'sinatra'
require "net/http"
require "uri"
require "quaver_config"

get '/twitter' do
  return get_cache("twitter") if !params[:debug].nil?
  url = "http://api.twitter.com/1/statuses/user_timeline/#{QUAVER_CONFIG[:twitter][:username]}.json"
  go_get(url)
end

get "/tumblr" do
  url = "#{QUAVER_CONFIG[:tumblr][:blog_url]}/api/read/json"
  remove_jsonp(go_get(url))
end

get '/delicious' do
  url = "http://feeds.delicious.com/v2/json/#{QUAVER_CONFIG[:delicious][:username]}"
  go_get(url)
end

def go_get(url) 
  uri = URI.parse(url)
  Net::HTTP.get_response(uri).body
end

def remove_jsonp(jsonp)
  json = jsonp[jsonp.index('{')..-1].strip
  return json[0..-2] if json[-1..-1] == ';'
  json
end

def get_cache(name)
  File.read("#{name}.json")
end