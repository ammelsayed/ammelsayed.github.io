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
    warn "Skipping #{path}: missing YAML front matter"
    next
  end

  begin
    data = YAML.safe_load(match[1], permitted_classes: [Date], aliases: false) || {}
    id = File.basename(path, '.md')
    data['id'] = id
    data['link'] = "/blog/post.html?id=#{id}"
    data['date'] = data['date'].to_s if data['date']
    data['meta'] ||= [{ 'icon' => '🗓️', 'text' => data['date'] }] if data['date']
    data
  rescue Psych::Exception => error
    warn "Skipping #{path}: invalid YAML front matter (#{error.message.lines.first.strip})"
    next
  end
end

File.write(OUTPUT_PATH, JSON.pretty_generate(posts) + "\n")
puts "Generated #{OUTPUT_PATH} with #{posts.length} blog post(s)."
