#!/usr/bin/env ruby
# Writes one static page per post, at /blog/posts/<id>/, so a link preview has
# something real to read.
#
# The article pages render in the browser from ?id=, which means their <head>
# only ever holds placeholders: the title, description and image are put there
# by JavaScript after the markdown loads. X, LinkedIn, Facebook, WeChat and QQ
# read the tags as served and run no script, so a shared article arrived as a
# bare link with no title and no picture.
#
# Each page here carries the post's front matter as Open Graph and Twitter tags
# and then hands the reader to the article itself. The share row shares these
# URLs, so the preview is read from them and the reader lands on the article.
require 'json'
require 'cgi'
require 'fileutils'

SITE = 'https://ammelsayed.pages.dev' # the host these links are shared from
BLOG_DIR = File.expand_path('../blog', __dir__)
# Not `blog/post/`: Cloudflare Pages serves `blog/post.html` at `blog/post`, and a
# directory of that name would sit on the article's own URL.
PAGES_DIR = File.join(BLOG_DIR, 'posts')
INDEX_PATH = File.expand_path('../data/blogs.generated.json', __dir__)
TEMPLATE = <<~HTML
  <!DOCTYPE html>
  <html lang="en">
  <head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>%<title>s</title>
  <meta name="description" content="%<description>s">
  <link rel="canonical" href="%<url>s">
  <meta property="og:type" content="article">
  <meta property="og:site_name" content="A.M.M. Elsayed">
  <meta property="og:title" content="%<title>s">
  <meta property="og:description" content="%<description>s">
  <meta property="og:url" content="%<url>s">
%<og_image>s
%<published>s
  <meta name="twitter:card" content="%<card>s">
  <meta name="twitter:title" content="%<title>s">
  <meta name="twitter:description" content="%<description>s">
%<twitter_image>s
  <meta http-equiv="refresh" content="0; url=%<path>s">
  <style>
  body { margin: 0; padding: 15vh 24px; font: 16px/1.6 system-ui, sans-serif; background: #101010; color: #e5e5e5; text-align: center; }
  a { color: #ffcc00; }
  </style>
  </head>
  <body>
  <p><a href="%<path>s">%<title>s</a></p>
  <script>location.replace('%<path>s' + location.hash);</script>
  </body>
  </html>
HTML

unless File.exist?(INDEX_PATH)
  warn "Failing: #{INDEX_PATH} is missing; run scripts/build-blog-index.rb first."
  exit 1
end

posts = JSON.parse(File.read(INDEX_PATH))
ids = posts.map { |post| post['id'].to_s }

# A post hidden with `show: false`, or deleted, drops out of the index. Its page
# would otherwise stay behind, carrying metadata for an article that is gone.
# Only directories are ours to remove; the settings editor keeps sources as files.
FileUtils.mkdir_p(PAGES_DIR)
Dir.glob(File.join(PAGES_DIR, '*')).each do |path|
  next unless File.directory?(path)
  FileUtils.rm_rf(path) unless ids.include?(File.basename(path))
end

posts.each do |post|
  id = post['id'].to_s
  title = CGI.escapeHTML(post['title'].to_s)
  description = CGI.escapeHTML(post['description'].to_s.gsub(/\s+/, ' ').strip)
  date = post['date'].to_s
  image = post['image'].to_s.strip
  # Anything that is not already an absolute or protocol-relative url is a path on
  # this site, with or without a leading slash; a preview reads it from the page's
  # own directory otherwise.
  image = "#{SITE}/#{image.delete_prefix('/')}" unless image.empty? || image.match?(%r{\A(?:https?:)?//}i)
  url = "#{SITE}/blog/posts/#{id}/"
  path = "/blog/post.html?id=#{id}"

  # Without a picture there is nothing to show in the card, so the image tags are
  # left out and the card drops to the small shape instead of promising a large
  # one with an empty image.
  big = !image.empty?
  image = CGI.escapeHTML(image)

  FileUtils.mkdir_p(File.join(PAGES_DIR, id))
  File.write(File.join(PAGES_DIR, id, 'index.html'), format(
    TEMPLATE,
    title: title,
    description: description,
    url: CGI.escapeHTML(url),
    path: CGI.escapeHTML(path),
    card: big ? 'summary_large_image' : 'summary',
    og_image: (big ? %(<meta property="og:image" content="#{image}">) : ''),
    twitter_image: (big ? %(<meta name="twitter:image" content="#{image}">) : ''),
    published: (format('<meta property="article:published_time" content="%s">', CGI.escapeHTML(date)) unless date.empty?)
  ))
end

puts "Generated #{posts.length} share page(s) under #{PAGES_DIR}."
