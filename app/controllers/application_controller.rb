class ApplicationController < ActionController::API
  before_action :authenticate_request
  
  attr_reader :current_user
  
  private
  
  def authenticate_request
    @current_user = nil
    header = request.headers['Authorization']
    return unless header.present?
    
    token = header.split(' ').last
    begin
      decoded = JsonWebToken.decode(token)
      @current_user = User.find(decoded[:user_id])
    rescue ActiveRecord::RecordNotFound, JWT::DecodeError
      @current_user = nil
    end
  end
  
  def authenticate_user!
    render json: { error: 'Not authenticated' }, status: :unauthorized unless current_user
  end
  
  def generate_token(user)
    JsonWebToken.encode(user_id: user.id)
  end
end