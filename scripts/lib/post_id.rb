# A post's file name is its address: /blog/<id>. What a host serves and what the
# listing advertises is that string, unchanged, so it is kept to what a url can
# carry, and never to a name one of the site's own pages already answers to.
#
# Both scripts that read the posts check it here, because the index is committed
# while the pages are built later: a name refused only at build time would reach
# the repository first and fail there.
module PostId
  PATTERN = /\A[A-Za-z0-9][A-Za-z0-9._-]*\z/
  # `post.html` is the article shell and `index.html` the listing.
  RESERVED = %w[post index].freeze

  # Why this name cannot be a post's address, or nil when it can.
  def self.problem(id)
    return 'is not a name a url carries: use letters, digits, dots and dashes' unless id.match?(PATTERN)
    return 'ends in .html, which is the extension its own page is written with' if id.match?(/\.html\z/i)
    return 'is the name of the article shell or the listing' if RESERVED.include?(id)

    nil
  end
end
