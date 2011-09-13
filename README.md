# Outfit Her

Outfit Her is a way to create and share outfits. It’s a simple, single-page webapp that lets you 
search for items in the [Zappos](http://www.zappos.com/) catalog, add them to a virtual paper doll, 
and then create a link to show your friends.

Backstory
---------

I submitted this app to the [First Zappos Developer Contest](http://developer.zappos.com/blog/first-zappos-developer-contest) 
and subsequently won it. I'm posting the code here in case anyone is interested in seeing it 
(although since the code is 90% jQuery you could've seen most of it with View Source).

For more information see [this blog post](http://antifantastic.com/post/5027747212/outfit-her-helping-women-create-outfits-with-zappos
).

Demonstration
-------------

[Click here](http://outfither.antifantastic.com/) to view the app.

How to run it
-------------

Most dependencies are outlined in the Gemfile. To install the required gems:

    bundle install

The app runs on Sinatra and requires a [Zappos API key](http://developer.zappos.com/content/getting-started#Getting_an_API_Key) 
set as an environment variable. Start the app with the `ZAPPOS_API_KEY` env variable like so:

    ZAPPOS_API_KEY=abcdef1234567890abcdef1234567890abcdef12 ruby -rubygems application.rb
                
And you should be good to go!
