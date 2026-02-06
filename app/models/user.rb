class User < ApplicationRecord
  has_secure_password
  
  has_many :user_songs, dependent: :destroy
  has_many :songs, through: :user_songs
  
  validates :email, presence: true, uniqueness: true, format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :name, presence: true
  
  def recent_suggestions(limit = 15)
    user_songs.includes(:song).order(created_at: :desc).limit(limit)
  end
  
  def add_song_suggestion(song_params, mood, mood_description = nil)
    song = Song.find_or_create_by(spotify_id: song_params[:spotify_id]) do |s|
      s.title = song_params[:title]
      s.artist = song_params[:artist]
      s.duration_ms = song_params[:duration_ms]
      s.spotify_uri = song_params[:spotify_uri]
      s.spotify_url = song_params[:spotify_url]
    end
    
    user_songs.create!(song: song, mood: mood, mood_description: mood_description)
  end
end