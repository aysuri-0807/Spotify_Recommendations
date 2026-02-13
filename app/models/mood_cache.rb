# app/models/mood_cache.rb
class MoodCache < ApplicationRecord
  belongs_to :user, optional: true
  
  # Normalize input to create consistent keys
  def self.normalize_input(text)
    text.to_s
      .downcase
      .gsub(/[^\w\s]/, '')  # Remove punctuation
      .strip
      .squeeze(' ')          # Remove extra spaces
  end
  
  # Find similar cache entry
  def self.find_similar(mood_input, exclude_user_id: nil)
    normalized_key = normalize_input(mood_input)
    
    query = where(mood_key: normalized_key)
    
    # Exclude entries created by this user (so they don't get their own cache)
    query = query.where.not(user_id: exclude_user_id) if exclude_user_id
    
    query.order(access_count: :desc).first
  end
  
  # Create or update cache entry
  def self.cache_result(mood_input, sentiment_data, songs_data, user_id: nil)
    normalized_key = normalize_input(mood_input)
    
    create!(
      mood_key: normalized_key,
      sentiment_data: sentiment_data,
      songs_data: songs_data,
      user_id: user_id,
      last_accessed_at: Time.current,
      access_count: 1
    )
  end
  
  # Increment access count when cache is hit
  def mark_accessed!
    increment!(:access_count)
    touch(:last_accessed_at)
  end
  
  # Get random subset of songs
  def random_songs(count = 5)
    songs_data.sample(count)
  end
  
  # Cleanup old cache entries (optional - run as background job)
  def self.cleanup_old_entries(days_old: 30)
    where('last_accessed_at < ?', days_old.days.ago).destroy_all
  end
end