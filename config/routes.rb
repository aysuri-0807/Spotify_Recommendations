Rails.application.routes.draw do
  namespace :api do
    # Authentication routes
    post '/register', to: 'users#create'
    post '/login', to: 'sessions#create'
    delete '/logout', to: 'sessions#destroy'
    get '/users/me', to: 'users#show'
    
    # Songs routes
    post '/songs/analyze', to: 'songs#analyze_mood'           # NEW - Gemini mood analysis
    post '/songs/suggestions', to: 'songs#create_suggestions' # Existing - save songs
    get '/songs/recent', to: 'songs#recent'                   # Existing - get history
  end
  
  get '/health', to: proc { [200, {}, ['OK']] }
end