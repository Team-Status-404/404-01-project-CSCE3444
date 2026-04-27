from models.user_management import User

class TestUser:
    def test_register_short_password_returns_error(self):
        result = User.register("testuser", "test@example.com", "short")
        assert result["status"] == "error"
        assert result["message"] == "Password must be at least 8 characters."

    def test_register_missing_special_character_returns_error(self):
        result = User.register("testuser", "test@example.com", "Longpassword123")
        assert result["status"] == "error"
        assert result["message"] == "Password must contain at least one special character."
