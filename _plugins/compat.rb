unless defined?(Fixnum)
  Fixnum = Integer
end

require 'uri'
unless URI.respond_to?(:escape)
  module URI
    def self.escape(string, *args)
      DEFAULT_PARSER.escape(string, *args)
    end
  end
end
