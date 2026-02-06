class Api::SessionsController < ApplicationController
  skip_before_action :authenticate_user!, only: [:create]
  
  def create
    user = User.find_by(email: params[:email])
    
    if user&.authenticate(params[:password])
      token = generate_token(user)
      render json: {
        message: 'Login successful',
        user: { id: user.id, email: user.email, name: user.name },
        token: token
      }
    else
      render json: { error: 'Invalid email or password' }, status: :unauthorized
    end
  end
  
  def destroy
    render json: { message: 'Logged out successfully' }
  end
end