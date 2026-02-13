# app/controllers/api/songs_controller.rb
class Api::SongsController < ApplicationController
  # Only require authentication for saving and viewing suggestions
  # Anyone can analyze mood without logging in
  before_action :authenticate_user!, only: [:create_suggestions, :recent, :cache_stats]
  
  # Mood analysis using Gemini AI with smart caching
  def analyze_mood
    user_input = params[:mood_input]
    
    if user_input.blank?
      return render json: { error: 'Mood input is required' }, status: :unprocessable_entity
    end
    
    begin
      # Pass current user ID to analyzer (nil if not logged in)
      # This ensures logged-in users don't get their own cached results
      analyzer = GeminiSentimentAnalyzer.new(user_id: current_user&.id)
      result = analyzer.analyze_and_recommend(user_input)
      
      # Add cache hit info to response
      render json: result.merge(
        cache_info: {
          cache_hit: result[:cache_hit],
          message: result[:cache_hit] ? '✅ Loaded from cache' : '🆕 Fresh from Gemini + Spotify'
        }
      ), status: :ok
    rescue StandardError => e
      Rails.logger.error "Mood analysis error: #{e.message}"
      Rails.logger.error e.backtrace.join("\n")
      render json: { error: e.message }, status: :service_unavailable
    end
  end
  
  def create_suggestions
    mood = params[:mood]
    mood_description = params[:mood_description]
    songs_data = params[:songs] || []
    
    if mood.blank?
      render json: { error: 'Mood is required' }, status: :unprocessable_entity
      return
    end
    
    saved_suggestions = []
    errors = []
    
    songs_data.each do |song_data|
      begin
        user_song = current_user.add_song_suggestion(
          {
            spotify_id: song_data[:spotify_id],
            title: song_data[:title],
            artist: song_data[:artist],
            duration_ms: song_data[:duration_ms],
            spotify_uri: song_data[:spotify_uri],
            spotify_url: song_data[:spotify_url]
          },
          mood,
          mood_description
        )
        saved_suggestions << user_song
      rescue StandardError => e
        errors << { song: song_data[:title], error: e.message }
      end
    end
    
    render json: {
      message: "Saved #{saved_suggestions.count} song(s)",
      saved_count: saved_suggestions.count,
      errors: errors
    }, status: :created
  end
  
  def recent
    suggestions = current_user.recent_suggestions(15)
    
    render json: {
      suggestions: suggestions.map do |user_song|
        {
          id: user_song.id,
          mood: user_song.mood,
          mood_description: user_song.mood_description,
          suggested_at: user_song.created_at,
          song: {
            id: user_song.song.id,
            title: user_song.song.title,
            artist: user_song.song.artist,
            duration: user_song.song.formatted_duration,
            duration_ms: user_song.song.duration_ms,
            spotify_id: user_song.song.spotify_id,
            spotify_url: user_song.song.spotify_url,
            spotify_embed_url: user_song.song.spotify_embed_url
          }
        }
      end
    }
  end
  
  # Optional: View cache statistics (admin/debugging)
  def cache_stats
    stats = {
      total_cached_moods: MoodCache.count,
      total_cache_hits: MoodCache.sum(:access_count),
      most_popular_moods: MoodCache.order(access_count: :desc).limit(10).map do |cache|
        {
          mood: cache.mood_key,
          hits: cache.access_count,
          last_accessed: cache.last_accessed_at
        }
      end,
      cache_efficiency: calculate_cache_efficiency
    }
    
    render json: stats
  end
  
  private
  
  def calculate_cache_efficiency
    total_requests = MoodCache.sum(:access_count) + MoodCache.count
    cache_hits = MoodCache.sum(:access_count)
    
    return 0 if total_requests.zero?
    
    ((cache_hits.to_f / total_requests) * 100).round(2)
  end
end