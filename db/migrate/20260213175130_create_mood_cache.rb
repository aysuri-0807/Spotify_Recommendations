class CreateMoodCache < ActiveRecord::Migration[8.1]
  def change
    create_table :mood_caches do |t|
      t.string :mood_key
      t.jsonb :sentiment_data
      t.jsonb :songs_data
      t.integer :user_id
      t.datetime :last_accessed_at
      t.integer :access_count

      t.timestamps
    end
  end
end
