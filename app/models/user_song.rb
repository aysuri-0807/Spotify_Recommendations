class UserSong < ApplicationRecord
  belongs_to :user
  belongs_to :song
  
  validates :mood, presence: true
  
  scope :recent, ->(limit = 15) { order(created_at: :desc).limit(limit) }
end