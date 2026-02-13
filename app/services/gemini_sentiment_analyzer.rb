# app/services/gemini_sentiment_analyzer.rb
require 'net/http'
require 'json'

class GeminiSentimentAnalyzer
  GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent'
  
  def initialize
    @api_key = ENV['GEMINI_API_KEY']
    raise 'Gemini API key not configured' if @api_key.blank?
  end
  
  def analyze_and_recommend(user_input)
    # Get sentiment analysis from Gemini
    sentiment_data = analyze_sentiment(user_input)
    
    # Search Spotify for real songs based on mood
    spotify_service = SpotifySearchService.new
    spotify_tracks = spotify_service.search_songs(
      sentiment_data[:emotion],
      sentiment_data[:genre],
      limit: 10
    )
    
    # Enhance Spotify tracks with audio features
    songs = enhance_tracks_with_features(spotify_tracks, spotify_service)
    
    {
      sentiment: sentiment_data,
      songs: songs
    }
  end
  
  private
  
  def analyze_sentiment(user_input)
    prompt = build_sentiment_prompt(user_input)
    response = call_gemini_api(prompt)
    parse_sentiment_response(response)
  end
  
  def build_sentiment_prompt(user_input)
    <<~PROMPT
      You are a mood analyzer for a music recommendation app. Analyze the user's mood.

      User input: "#{user_input}"

      Respond with JSON in this exact format (no markdown, no extra text):
      {
        "sentiment": <0-100 score where 0 is very negative and 100 is very positive>,
        "label": "<mood description with emoji>",
        "emotion": "<ONE WORD emotion from this list: Happy, Sad, Energetic, Chill, Angry, or Romantic>",
        "genre": "<music genre that matches this mood>"
      }
    PROMPT
  end
  
  def call_gemini_api(prompt)
    uri = URI("#{GEMINI_API_URL}?key=#{@api_key}")
    
    http = Net::HTTP.new(uri.host, uri.port)
    http.use_ssl = true
    http.read_timeout = 30
    
    request = Net::HTTP::Post.new(uri)
    request['Content-Type'] = 'application/json'
    request.body = {
      contents: [
        {
          parts: [
            { text: prompt }
          ]
        }
      ]
    }.to_json
    
    response = http.request(request)
    
    unless response.is_a?(Net::HTTPSuccess)
      handle_api_error(response)
    end
    
    JSON.parse(response.body)
  rescue Net::ReadTimeout
    raise StandardError, 'Gemini API timeout - please try again'
  rescue JSON::ParserError
    raise StandardError, 'Invalid response from Gemini API'
  end
  
  def parse_sentiment_response(data)
    candidates = data['candidates']
    raise StandardError, 'No response from Gemini API' unless candidates&.first
    
    response_text = candidates.first.dig('content', 'parts', 0, 'text')
    json_match = response_text.match(/\{[\s\S]*\}/)
    
    raise StandardError, 'Could not parse response' unless json_match
    
    result = JSON.parse(json_match[0])
    
    {
      sentiment: [[result['sentiment'].to_i, 0].max, 100].min,
      label: result['label'] || 'Neutral 😐',
      emotion: result['emotion'] || 'Happy',
      genre: result['genre'] || 'Pop'
    }
  end
  
  def enhance_tracks_with_features(spotify_tracks, spotify_service)
    spotify_tracks.take(5).map do |track|
      # Get audio features from Spotify
      features = spotify_service.get_audio_features(track[:spotify_id])
      
      {
        spotify_id: track[:spotify_id],
        title: track[:title],
        artist: track[:artist],
        duration: format_duration(track[:duration_ms]),
        duration_ms: track[:duration_ms],
        spotify_uri: track[:spotify_uri],
        external_url: track[:spotify_url],
        image_url: track[:image_url],
        preview_url: track[:preview_url],
        album: track[:album],
        # Convert Spotify audio features to your format
        energy: audio_feature_label(features&.dig('energy')),
        danceability: audio_feature_label(features&.dig('danceability')),
        valence: valence_label(features&.dig('valence'))
      }
    end
  end
  
  def format_duration(ms)
    return "0:00" unless ms
    total_seconds = ms / 1000
    minutes = total_seconds / 60
    seconds = total_seconds % 60
    "#{minutes}:#{seconds.to_s.rjust(2, '0')}"
  end
  
  def audio_feature_label(value)
    return 'medium' unless value
    case value
    when 0...0.33 then 'low'
    when 0.33...0.67 then 'medium'
    else 'high'
    end
  end
  
  def valence_label(value)
    return 'neutral' unless value
    case value
    when 0...0.33 then 'negative'
    when 0.33...0.67 then 'neutral'
    else 'positive'
    end
  end
  
  def handle_api_error(response)
    case response.code.to_i
    when 401, 403
      raise StandardError, 'Invalid Gemini API key'
    when 429
      raise StandardError, 'Rate limit exceeded - please try again later'
    else
      raise StandardError, "Gemini API error (#{response.code})"
    end
  end
end