using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Text;
using Taek.Api.Middleware;
using Taek.Api.Services;

var builder = WebApplication.CreateBuilder(args);

// Clear default claim mapping so "sub" claim is not mapped to ClaimTypes.NameIdentifier
JwtSecurityTokenHandler.DefaultInboundClaimTypeMap.Clear();

// ─── Services ────────────────────────────────────────────────────────────────

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

// Swagger
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() { Title = "TAEK API", Version = "v1" });
    c.AddSecurityDefinition("Bearer", new()
    {
        Description = "JWT Authorization header. Example: 'Bearer {token}'",
        Name = "Authorization",
        In = Microsoft.OpenApi.Models.ParameterLocation.Header,
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });
    c.AddSecurityRequirement(new()
    {
        {
            new() { Reference = new() { Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme, Id = "Bearer" } },
            Array.Empty<string>()
        }
    });
});

// CORS — allow Next.js dev server and Vercel production
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        var allowedOrigins = builder.Configuration
            .GetSection("Cors:AllowedOrigins")
            .Get<string[]>() ?? ["http://localhost:3000"];

        policy
            .WithOrigins(allowedOrigins)
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

// JWT — Supabase issues standard JWTs; we validate using the project JWT secret
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        var jwtSecret = builder.Configuration["Supabase:JwtSecret"]
            ?? throw new InvalidOperationException("Supabase:JwtSecret is not configured.");

        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
            ValidateIssuer = false,   // Supabase does not set iss in dev
            ValidateAudience = false,
            ClockSkew = TimeSpan.FromSeconds(30),
        };
    });

// Supabase Client Injection
builder.Services.AddScoped<Supabase.Client>(_ => 
    new Supabase.Client(
        builder.Configuration["Supabase:Url"]!, 
        builder.Configuration["Supabase:ServiceRoleKey"]!, // Use Service Role Key for backend admin actions
        new Supabase.SupabaseOptions
        {
            AutoRefreshToken = true,
            AutoConnectRealtime = true
        }
    ));

builder.Services.AddAuthorization();
builder.Services.AddScoped<SupabaseStorageService>();

// ─── Build ───────────────────────────────────────────────────────────────────

var app = builder.Build();

// ─── Middleware pipeline ──────────────────────────────────────────────────────

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c => c.SwaggerEndpoint("/swagger/v1/swagger.json", "TAEK API v1"));
}

app.UseHttpsRedirection();
app.UseCors("AllowFrontend");
app.UseAuthentication();
app.UseMiddleware<AppRoleMiddleware>();
app.UseAuthorization();
app.MapControllers();

// ─── Health check (Phase 0 verification) ─────────────────────────────────────
app.MapGet("/health", () => Results.Ok(new
{
    status = "ok",
    service = "TAEK API",
    version = "0.1.0",
    timestamp = DateTime.UtcNow
}))
.WithTags("Health")
.AllowAnonymous();

app.Run();
