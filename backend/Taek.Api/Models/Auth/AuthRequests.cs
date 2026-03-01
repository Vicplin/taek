namespace Taek.Api.Models.Auth;

public record LoginRequest(string Email, string Password);

public record RegisterRequest(string Email, string Password, string FullName, string Role);

public record VerifyEmailRequest(string Email, string Token, string Type = "signup");

public record RefreshRequest(string RefreshToken);

public record ForgotPasswordRequest(string Email);

public record RecoverRequest(string Email, string? RedirectTo = null);

public record ResetPasswordRequest(string Password);
