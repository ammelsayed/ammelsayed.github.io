#!/usr/bin/env ruby
require 'json'
require 'yaml'
require 'date'

BLOG_DIR = File.expand_path('../blog', __dir__)
OUTPUT_PATH = File.expand_path('../data/blogs.generated.json', __dir__)
# A post's id is its filename, and every page the site builds for it is a
# directory named after that id. A name a path cannot hold (a `/`, a leading `..`)
# would give a link to something other than the post, so it stops the build here
# rather than at the page generator.
ID_PATTERN = /\A[A-Za-z0-9][A-Za-z0-9._-]*\z/.freeze

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
    unless id.match?(ID_PATTERN)
      warn "Failing #{path}: \"#{id}\" cannot be a post id; rename the file."
      exit 1
    end
    data['id'] = id
    # The list opens the post's own page: one click, and the address in the bar is
    # the post's. That page also carries the title, the description and the image
    # as metadata, so a link copied from the index previews properly.
    data['link'] = "/blog/#{id}/"
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
