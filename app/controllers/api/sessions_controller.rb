# app/controllers/api/sessions_controller.rb
class Api::SessionsController < ApplicationController
  skip_before_action :authenticate_request, only: [:create]
  
  def create
    user = User.find_by(email: params[:email])
    
    # Check if user exists first
    if user.nil?
      render json: { 
        error: 'This email is not registered. Please sign up first!' 
      }, status: :unauthorized
      return
    end
    
    # Then check password
    if user.authenticate(params[:password])
      token = generate_token(user)
      render json: {
        message: 'Login successful',
        user: { id: user.id, email: user.email, name: user.name },
        token: token
      }
    else
      render json: { error: 'Incorrect password. Please try again.' }, status: :unauthorized
    end
  end
  
  def destroy
    render json: { message: 'Logged out successfully' }
  end
end