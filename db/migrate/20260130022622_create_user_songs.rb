class CreateUserSongs < ActiveRecord::Migration[7.0]
  def change
    create_table :user_songs do |t|
      t.references :user, null: false, foreign_key: true
      t.references :song, null: false, foreign_key: true
      t.string :mood, null: false
      t.text :mood_description

      t.timestamps
    end
    
    add_index :user_songs, [:user_id, :created_at]
  end
end