# A post's file name is its address: /blog/<id>. What a host serves and what the
# listing advertises is that string, unchanged, so it is kept to what a url
# carries, and never to a name one of the site's own pages already answers to.
#
# Both scripts that read the posts check it here, because the index is committed
# while the pages are built later: a name refused only at build time would reach
# the repository first and fail there.
module PostId
  # No dots either: the address is the page written as `<id>.html`, and an id
  # carrying an extension of its own would be shadowed by the source file. A
  # post called `post1.md` would be advertised at /blog/post1.md, which serves
  # the Markdown, not the page. Forty characters is far longer than a name that
  # reads as an address, and short of anything a file name cannot hold.
  MAX_LENGTH = 40
  PATTERN = /\A[A-Za-z0-9][A-Za-z0-9_-]*\z/
  # `post.html` is the article shell and `index.html` the listing.
  RESERVED = %w[post index].freeze

  # Why this name cannot be a post's address, or nil when it can.
  def self.problem(id)
    return 'is not a name a url carries: use letters, digits, dashes and underscores' unless id.match?(PATTERN)
    return "is longer than #{MAX_LENGTH} characters" if id.length > MAX_LENGTH
    # Folded, because the page is a file: where case is not kept, `Post.html` is
    # the shell's own page.
    return 'is the name of the article shell or the listing' if RESERVED.include?(id.downcase)

    nil
  end

  # The ids that fold to one page, or nil: two posts whose ids differ only in
  # case are one file wherever names are compared without it.
  def self.collision(ids)
    ids.group_by(&:downcase).find { |_, group| group.size > 1 }&.last
  end
end
