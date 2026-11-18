#!/usr/bin/env ruby
require 'json'
require 'yaml'
require 'date'

DATA_DIR = File.expand_path('../data', __dir__)

# The YAML files in data/ remain the single source of truth for structured
# content. They are converted to JSON here, at build time, so that the browser
# can render the lists with a plain JSON.parse instead of having to download a
# YAML parser (~39 KB from a third-party CDN) before it can show anything.
SOURCES = %w[events projects publications].freeze

def normalize(value)
  case value
  when Hash then value.transform_values { |v| normalize(v) }
  when Array then value.map { |v| normalize(v) }
  when Date, Time then value.to_s
  else value
  end
end

SOURCES.each do |name|
  source = File.join(DATA_DIR, "#{name}.yaml")
  target = File.join(DATA_DIR, "#{name}.json")

  unless File.exist?(source)
    warn "Skipping #{name}: #{source} not found"
    next
  end

  begin
    data = YAML.safe_load(File.read(source), permitted_classes: [Date, Time], aliases: true)
  rescue Psych::Exception => error
    warn "Failing #{name}: invalid YAML (#{error.message.lines.first.strip})"
    exit 1
  end

  unless data.is_a?(Array)
    warn "Failing #{name}: expected a top-level list of entries"
    exit 1
  end

  File.write(target, JSON.pretty_generate(normalize(data)) + "\n")
  puts "Generated #{target} with #{data.length} item(s)."
end
