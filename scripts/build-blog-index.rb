#!/usr/bin/env ruby
require 'json'
require 'yaml'
require 'date'

BLOG_DIR = File.expand_path('../blog', __dir__)
OUTPUT_PATH = File.expand_path('../data/blogs.generated.json', __dir__)

posts = Dir.glob(File.join(BLOG_DIR, '*.md')).sort.filter_map do |path|
  text = File.read(path)
  match = text.match(/\A---\s*\n(.*?)\n---\s*(?:\n|\z)/m)
  unless match
    warn "Failing #{path}: missing YAML front matter"
    exit 1
  end

  begin
    data = YAML.safe_load(match[1], permitted_classes: [Date], aliases: false) || {}
    next if data['show'].to_s.downcase == 'false' # show: false keeps a post out of the index; absent means visible
    id = File.basename(path, '.md')
    data['id'] = id
    # The list links to the post's own page, whose tags carry the title, the
    # description and the image; it hands the reader on to the article. A link
    # copied from the index therefore previews properly instead of arriving as a
    # bare url, which a ?id= address cannot do.
    data['link'] = "/blog/posts/#{id}/"
    data['date'] = data['date'].to_s if data['date']
    data['meta'] ||= [{ 'icon' => '🗓️', 'text' => data['date'] }] if data['date']
    data
  rescue Psych::Exception => error
    warn "Failing #{path}: invalid YAML front matter (#{error.message.lines.first.strip})"
    exit 1
  end
end

File.write(OUTPUT_PATH, JSON.pretty_generate(posts) + "\n")
puts "Generated #{OUTPUT_PATH} with #{posts.length} blog post(s)."
