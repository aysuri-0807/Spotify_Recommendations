Rails.application.routes.draw do
  namespace :api do
    post '/register', to: 'users#create'
    post '/login', to: 'sessions#create'
    delete '/logout', to: 'sessions#destroy'
    get '/users/me', to: 'users#show'
    
    post '/songs/suggestions', to: 'songs#create_suggestions'
    get '/songs/recent', to: 'songs#recent'
  end
  
  get '/health', to: proc { [200, {}, ['OK']] }
end