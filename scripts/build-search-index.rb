#!/usr/bin/env ruby
# Builds data/search-index.json, the one file the header search reads.
#
# The header is the same component on every page, so its search has to cover the
# whole site rather than the list the reader happens to be looking at. That means
# one index holding the static pages, the posts (with their text, so a phrase that
# only appears mid-article still matches), and the three YAML-backed lists.
#
# It reads the files the other builders write, so it runs last.

require 'json'
require 'yaml'
require 'date'

ROOT = File.expand_path('..', __dir__)
DATA_DIR = File.join(ROOT, 'data')
BLOG_DIR = File.join(ROOT, 'blog')
OUTPUT_PATH = File.join(DATA_DIR, 'search-index.json')

# The pages that have no data file behind them. Without these, searching for
# "cv" or "about" would look like a failure rather than a page that exists.
PAGES = [
  { 'title' => 'Home', 'description' => 'A.M.M. Elsayed: research, publications, projects, blog and events.',
    'url' => '/index.html', 'tags' => 'home start' },
  { 'title' => 'About', 'description' => 'Biography, research interests, positions and contact details.',
    'url' => '/about/index.html', 'tags' => 'about biography contact' },
  { 'title' => 'Publications', 'description' => 'Journal papers, preprints and conference notes in experimental particle physics.',
    'url' => '/publications/index.html', 'tags' => 'publications papers preprints' },
  { 'title' => 'Projects', 'description' => 'Analysis code, software and web templates.',
    'url' => '/projects/index.html', 'tags' => 'projects code software' },
  { 'title' => 'Blog', 'description' => 'Notes on physics, software and computing.',
    'url' => '/blog/index.html', 'tags' => 'blog posts notes' },
  { 'title' => 'Events', 'description' => 'Talks, interviews, schools and conferences.',
    'url' => '/events/index.html', 'tags' => 'events talks conferences' },
  { 'title' => 'Curriculum Vitae', 'description' => 'The full CV as a PDF.',
    'url' => '/docs/CV.pdf', 'tags' => 'cv curriculum vitae resume pdf' }
]

# Markdown to plain text: enough to make the article searchable, without pulling
# in a converter. Fences, images and link targets are dropped; the words stay.
def plain_text(markdown)
  body = markdown.sub(/\A---\s*\n.*?\n---\s*(?:\n|\z)/m, '')
  # Articles open with their own title as an H1; repeating it in the snippet
  # would only restate the line printed above it.
  body = body.sub(/\A\s*\#{1,6}\s+.*(?:\n|\z)/, '')
  body = body.gsub(/^```.*$/, '')
  body = body.gsub(/!\[([^\]]*)\]\([^)]*\)/, '\1')
  body = body.gsub(/\[([^\]]*)\]\([^)]*\)/, '\1')
  body = body.gsub(/<[^>]+>/, ' ')
  body = body.each_line.map { |line| line.sub(/\A\s{0,3}(?:\#{1,6}\s+|>\s*|[-*+]\s+|\d+\.\s+)/, '') }.join
  body = body.gsub(/[*_`]/) { |mark| mark == '`' ? ' ' : '' }
  body.gsub(/\s+/, ' ').strip
end

def trim(text, limit)
  return '' if text.nil?

  clean = text.strip
  return clean if clean.length <= limit

  cut = clean[0, limit]
  cut = cut.sub(/\s+\S*\z/, '')
  "#{cut} …"
end

def tags_for(entry)
  parts = [entry['badge']]
  parts.concat(Array(entry['meta']).map { |item| item['text'] if item.is_a?(Hash) })
  parts.compact.map(&:to_s).reject(&:empty?).uniq.join(' ')
end

items = PAGES.map { |page| page.merge('kind' => 'Page') }

JSON.parse(File.read(File.join(DATA_DIR, 'blogs.generated.json'))).each do |post|
  id = post['id'].to_s
  next if id.empty?

  path = File.join(BLOG_DIR, "#{id}.md")
  body = File.exist?(path) ? trim(plain_text(File.read(path)), 2200) : ''

  items << {
    'title' => post['title'].to_s,
    'description' => post['description'].to_s,
    'url' => "/blog/posts/#{id}/",
    'kind' => 'Post',
    'tags' => tags_for(post),
    'body' => body,
    'date' => post['date'].to_s
  }
end

[['publications.json', 'Publication', '/publications/index.html'],
 ['projects.json', 'Project', '/projects/index.html'],
 ['events.json', 'Event', '/events/index.html']].each do |file, kind, fallback|
  path = File.join(DATA_DIR, file)
  next unless File.exist?(path)

  JSON.parse(File.read(path)).each do |entry|
    items << {
      'title' => entry['title'].to_s,
      'description' => entry['description'].to_s,
      'url' => (entry['link'].to_s.empty? ? fallback : entry['link'].to_s),
      'kind' => kind,
      'tags' => tags_for(entry),
      'body' => '',
      'date' => entry['date'].to_s
    }
  end
end

items.reject! { |item| item['title'].empty? }

index = { 'generated' => Time.now.utc.strftime('%Y-%m-%dT%H:%M:%SZ'), 'items' => items }
File.write(OUTPUT_PATH, JSON.pretty_generate(index) + "\n")
puts "Generated #{OUTPUT_PATH} with #{items.length} entry(ies)."
