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
    prompt = build_prompt(user_input)
    response = call_gemini_api(prompt)
    parse_response(response)
  end
  
  private
  
  def build_prompt(user_input)
    <<~PROMPT
      You are a mood analyzer and music recommender. Based on the user's input, provide sentiment analysis and song recommendations.

      User input: "#{user_input}"

      Respond with JSON in this exact format (no markdown, no extra text):
      {
        "sentiment": {
          "sentiment": <0-100 score where 0 is very negative and 100 is very positive>,
          "label": "<mood description with emoji>",
          "emotion": "<ONE WORD emotion from this list: Happy, Sad, Energetic, Chill, Angry, or Romantic>",
          "genre": "<music genre that matches this mood>"
        },
        "songs": [
          {
            "title": "Song Title",
            "artist": "Artist Name",
            "energy": "high/medium/low",
            "danceability": "high/medium/low",
            "valence": "positive/neutral/negative",
            "duration": "3:45"
          },
          {
            "title": "Song Title 2",
            "artist": "Artist Name 2",
            "energy": "high/medium/low",
            "danceability": "high/medium/low",
            "valence": "positive/neutral/negative",
            "duration": "4:12"
          },
          {
            "title": "Song Title 3",
            "artist": "Artist Name 3",
            "energy": "high/medium/low",
            "danceability": "high/medium/low",
            "valence": "positive/neutral/negative",
            "duration": "3:30"
          },
          {
            "title": "Song Title 4",
            "artist": "Artist Name 4",
            "energy": "high/medium/low",
            "danceability": "high/medium/low",
            "valence": "positive/neutral/negative",
            "duration": "2:58"
          },
          {
            "title": "Song Title 5",
            "artist": "Artist Name 5",
            "energy": "high/medium/low",
            "danceability": "high/medium/low",
            "valence": "positive/neutral/negative",
            "duration": "3:22"
          }
        ]
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
  
  def parse_response(data)
    candidates = data['candidates']
    raise StandardError, 'No response from Gemini API' unless candidates&.first
    
    response_text = candidates.first.dig('content', 'parts', 0, 'text')
    json_match = response_text.match(/\{[\s\S]*\}/)
    
    raise StandardError, 'Could not parse response' unless json_match
    
    result = JSON.parse(json_match[0])
    
    {
      sentiment: {
        sentiment: [[result.dig('sentiment', 'sentiment').to_i, 0].max, 100].min,
        label: result.dig('sentiment', 'label') || 'Neutral',
        emotion: result.dig('sentiment', 'emotion') || 'Happy',
        genre: result.dig('sentiment', 'genre') || 'Pop'
      },
      songs: result['songs'] || []
    }
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