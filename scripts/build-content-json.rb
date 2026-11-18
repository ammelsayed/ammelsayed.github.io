#!/usr/bin/env ruby
require 'json'
require 'yaml'
require 'date'

DATA_DIR = File.expand_path('../data', __dir__)
ROOT_DIR = File.expand_path('..', __dir__)

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

# Pixel dimensions of a local image, read from its header. They are written into
# the JSON so a card can reserve the right amount of space before the (lazily
# loaded) image arrives, instead of pushing the page around when it decodes.
# Returns nil for anything we cannot size, and the card then behaves as before.
def image_size(path)
  return nil unless File.file?(path)

  File.open(path, 'rb') do |io|
    head = io.read(32).to_s

    if head.start_with?("\x89PNG".b)
      # signature(8) + chunk length(4) + "IHDR"(4) + width(4) + height(4)
      return [head[16, 4].unpack1('N'), head[20, 4].unpack1('N')]
    end

    if head.start_with?("\xFF\xD8".b)
      io.rewind
      io.read(2)
      until io.eof?
        marker = io.read(2).to_s
        break if marker.bytesize < 2

        if marker.getbyte(0) != 0xFF
          io.seek(-1, IO::SEEK_CUR)
          next
        end

        code = marker.getbyte(1)
        next if code == 0xFF # fill byte

        length = io.read(2).to_s.unpack1('n')
        break if length.nil? || length < 2

        # SOF0..SOF15 hold the frame size; C4 (DHT), C8 (JPG), CC (DAC) are not SOF.
        if code >= 0xC0 && code <= 0xCF && ![0xC4, 0xC8, 0xCC].include?(code)
          body = io.read(length - 2).to_s
          return [body[3, 2].to_s.unpack1('n'), body[1, 2].to_s.unpack1('n')]
        end

        io.seek(length - 2, IO::SEEK_CUR)
      end
    end
  end

  nil
end

SOURCES.each do |name|
  source = File.join(DATA_DIR, "#{name}.yaml")
  target = File.join(DATA_DIR, "#{name}.json")

  unless File.exist?(source)
    warn "Failing #{name}: #{source} not found"
    exit 1
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

  entries = data.select { |entry| entry.is_a?(Hash) }
  if entries.length != data.length
    warn "Dropping #{data.length - entries.length} non-object entry/entries in #{name}.yaml"
  end

  entries.each do |entry|
    image = entry['image']
    next unless image.is_a?(String) && image.start_with?('/')

    size = image_size(File.join(ROOT_DIR, image))
    next if size.nil?

    entry['image_width'], entry['image_height'] = size
  end

  File.write(target, JSON.pretty_generate(normalize(entries)) + "\n")
  puts "Generated #{target} with #{entries.length} item(s)."
end
