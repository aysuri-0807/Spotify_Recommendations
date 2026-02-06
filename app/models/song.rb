class Song < ApplicationRecord
  has_many :user_songs, dependent: :destroy
  has_many :users, through: :user_songs
  
  validates :title, presence: true
  validates :artist, presence: true
  validates :spotify_id, presence: true, uniqueness: true
  
  def formatted_duration
    return "0:00" unless duration_ms
    total_seconds = duration_ms / 1000
    minutes = total_seconds / 60
    seconds = total_seconds % 60
    "#{minutes}:#{seconds.to_s.rjust(2, '0')}"
  end
  
  def spotify_embed_url
    return nil unless spotify_id
    "https://open.spotify.com/embed/track/#{spotify_id}"
  end
end