class CreateSongs < ActiveRecord::Migration[8.1]
  def change
    create_table :songs do |t|
      t.string :title
      t.string :artist
      t.integer :duration_ms
      t.string :spotify_id
      t.string :spotify_uri
      t.string :spotify_url

      t.timestamps
    end
    add_index :songs, :spotify_id, unique: true
  end
end
