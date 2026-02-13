# app/services/spotify_search_service.rb
require 'httparty'

class SpotifySearchService
  SPOTIFY_API_BASE = 'https://api.spotify.com/v1'
  SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token'
  
  def initialize
    @client_id = ENV['SPOTIFY_CLIENT_ID']
    @client_secret = ENV['SPOTIFY_CLIENT_SECRET']
    raise 'Spotify credentials not configured' if @client_id.blank? || @client_secret.blank?
    @access_token = nil
  end
  
  # Search for songs based on mood and genre
  def search_songs(mood, genre, limit: 10)
    ensure_access_token
    
    # Build search query
    query = build_search_query(mood, genre)
    
    response = HTTParty.get(
      "#{SPOTIFY_API_BASE}/search",
      query: {
        q: query,
        type: 'track',
        limit: limit,
        market: 'US'
      },
      headers: {
        'Authorization' => "Bearer #{@access_token}"
      }
    )
    
    if response.success?
      parse_tracks(response['tracks']['items'])
    else
      Rails.logger.error "Spotify search failed: #{response.code} - #{response.body}"
      []
    end
  rescue StandardError => e
    Rails.logger.error "Spotify search error: #{e.message}"
    []
  end
  
  # Get audio features for a track
  def get_audio_features(track_id)
    ensure_access_token
    
    response = HTTParty.get(
      "#{SPOTIFY_API_BASE}/audio-features/#{track_id}",
      headers: {
        'Authorization' => "Bearer #{@access_token}"
      }
    )
    
    response.success? ? response.parsed_response : nil
  rescue StandardError => e
    Rails.logger.error "Spotify audio features error: #{e.message}"
    nil
  end
  
  private
  
  def ensure_access_token
    @access_token = get_access_token if @access_token.nil?
  end
  
  def get_access_token
    auth_string = Base64.strict_encode64("#{@client_id}:#{@client_secret}")
    
    response = HTTParty.post(
      SPOTIFY_TOKEN_URL,
      body: {
        grant_type: 'client_credentials'
      },
      headers: {
        'Authorization' => "Basic #{auth_string}",
        'Content-Type' => 'application/x-www-form-urlencoded'
      }
    )
    
    if response.success?
      response['access_token']
    else
      raise "Failed to get Spotify access token: #{response.code}"
    end
  end
  
  def build_search_query(mood, genre)
  mood_keywords = {
    'Happy' => 'happy upbeat',
    'Sad' => 'sad emotional',
    'Energetic' => 'energetic workout',
    'Chill' => 'chill relax',
    'Angry' => 'angry rock metal hardcore',
    'Romantic' => 'romantic love'
  }
  
  mood_keywords[mood] || mood.downcase
end
  
  def parse_tracks(tracks)
    tracks.map do |track|
      {
        spotify_id: track['id'],
        title: track['name'],
        artist: track['artists'].map { |a| a['name'] }.join(', '),
        duration_ms: track['duration_ms'],
        spotify_uri: track['uri'],
        spotify_url: track['external_urls']['spotify'],
        image_url: track['album']['images'].first&.dig('url'),
        preview_url: track['preview_url'],
        album: track['album']['name']
      }
    end
  end
end