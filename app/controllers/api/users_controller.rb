class Api::UsersController < ApplicationController
  before_action :authenticate_user!, only: [:show]
  def create
    user = User.new(user_params)
    
    if user.save
      token = generate_token(user)
      render json: {
        message: 'User created successfully',
        user: { id: user.id, email: user.email, name: user.name },
        token: token
      }, status: :created
    else
      render json: { errors: user.errors.full_messages }, status: :unprocessable_entity
    end
  end
  
  def show
    render json: {
      user: { id: current_user.id, email: current_user.email, name: current_user.name }
    }
  end
  
  private
  
  def user_params
    params.require(:user).permit(:email, :password, :password_confirmation, :name)
  end
end