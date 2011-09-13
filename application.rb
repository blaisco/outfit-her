require 'sinatra'
require 'sinatra/reloader' if development?
require 'erb'
require 'net/http'

get '/' do
  erb :index
end

get '/z/:method' do
  # sleep(1) # for testing ajax loading indicator
  url = "http://api.zappos.com/"
  m = params[:method]
  url = url + m + "?" + request.query_string + "&key=" + ENV['ZAPPOS_API_KEY']
  puts url

  uri = URI.parse(url)
  http = Net::HTTP.new(uri.host, uri.port)
  request = Net::HTTP::Get.new(uri.request_uri)
  
  begin
    r = http.request(request)
  rescue
    puts "Failed Request | url=" + url
    ''
  end
  
  if r.code[0].chr == "2" # i.e. 200, 201, etc.
    response.headers['Cache-Control'] = 'public, max-age=43200' # cache for 12 hours
    content_type :json
    r.body
  else
    puts "Bad Request | url=" + url +
      " | response.code=" + r.code +
      " | response.body=" + r.body
    ''
  end
end
