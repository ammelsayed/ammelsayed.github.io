#!/usr/bin/env ruby
require 'json'
require 'yaml'
require 'date'
require_relative 'lib/post_id'

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
    # The name becomes the post's address, and this index is what gets committed,
    # so a name the page generator cannot serve is refused here rather than at
    # the deploy that would otherwise fail after the index had already landed.
    if (problem = PostId.problem(id))
      warn "Failing #{path}: #{id.inspect} #{problem}."
      exit 1
    end
    data['id'] = id
    # The list opens the post's own page at /blog/<id>: one click, and the
    # address in the bar is the post's, with no extension and no trailing slash.
    # That page also carries the title, the description and the image as
    # metadata, so a link copied from the index previews properly.
    data['link'] = "/blog/#{id}"
    data['date'] = data['date'].to_s if data['date']
    data['meta'] ||= [{ 'icon' => '🗓️', 'text' => data['date'] }] if data['date']
    data
  rescue Psych::Exception => error
    warn "Failing #{path}: invalid YAML front matter (#{error.message.lines.first.strip})"
    exit 1
  end
end

if (collision = PostId.collision(posts.map { |post| post['id'] }))
  warn "Failing: #{collision.join(' and ')} differ only in case, and would be one page."
  exit 1
end

File.write(OUTPUT_PATH, JSON.pretty_generate(posts) + "\n")
puts "Generated #{OUTPUT_PATH} with #{posts.length} blog post(s)."
