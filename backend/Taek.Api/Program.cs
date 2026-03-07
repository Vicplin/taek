using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Net.Http;
using Taek.Api.Middleware;
using Taek.Api.Services;

var builder = WebApplication.CreateBuilder(args);

// Clear default claim mapping so "sub" claim is not mapped to ClaimTypes.NameIdentifier
JwtSecurityTokenHandler.DefaultInboundClaimTypeMap.Clear();
JwtSecurityTokenHandler.DefaultMapInboundClaims = false;

// ─── Services ────────────────────────────────────────────────────────────────

builder.Services.AddControllers();
builder.Services.AddHttpClient();
builder.Services.AddEndpointsApiExplorer();

// Swagger
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() { Title = "TAEK API", Version = "v1" });
    c.AddSecurityDefinition("Bearer", new()
    {
        Description = "Enter your JWT token only (without 'Bearer')",
        Name = "Authorization",
        In = Microsoft.OpenApi.Models.ParameterLocation.Header,
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT"
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

// Fetch JWKS manually at startup
var supabaseUrl = builder.Configuration["Supabase:Url"]!;
var jwksUri = $"{supabaseUrl}/auth/v1/.well-known/jwks.json";

IssuerSigningKeyResolver signingKeyResolver;
using (var http = new HttpClient())
{
    http.Timeout = TimeSpan.FromSeconds(30);
    var jwksJson = await http.GetStringAsync(jwksUri);
    var jwks = new JsonWebKeySet(jwksJson);
    var keys = jwks.GetSigningKeys();
    signingKeyResolver = (token, securityToken, kid, parameters) => keys;
}

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKeyResolver = signingKeyResolver,
            ValidateIssuer = true,
            ValidIssuer = $"{supabaseUrl}/auth/v1",
            ValidateAudience = true,
            ValidAudience = "authenticated",
            ClockSkew = TimeSpan.Zero,
            RoleClaimType = ClaimTypes.Role,
            NameClaimType = "sub"
        };

        options.Events = new JwtBearerEvents
        {
            OnAuthenticationFailed = context =>
            {
                Console.WriteLine($"JWT Auth failed: {context.Exception.GetType().Name}: {context.Exception.Message}");
                Console.WriteLine($"JWT Auth failed inner: {context.Exception.InnerException?.Message}");
                return Task.CompletedTask;
            },
            OnTokenValidated = context =>
            {
                var claims = context.Principal?.Claims.Select(c => $"{c.Type}={c.Value}");
                Console.WriteLine($"JWT Token validated. Claims: {string.Join(", ", claims ?? [])}");
                return Task.CompletedTask;
            },
            OnMessageReceived = context =>
            {
                Console.WriteLine($"JWT received, token present: {!string.IsNullOrEmpty(context.Token)}");
                return Task.CompletedTask;
            }
        };
    });

// Supabase Client Injection
builder.Services.AddScoped<Supabase.Client>(_ => 
    new Supabase.Client(
        builder.Configuration["Supabase:Url"]!, 
        builder.Configuration["Supabase:ServiceRoleKey"]!, 
        new Supabase.SupabaseOptions 
        { 
            AutoRefreshToken = false, 
            AutoConnectRealtime = false 
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

if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}
app.UseCors("AllowFrontend");
app.UseAuthentication();
app.UseMiddleware<AppRoleMiddleware>();
app.UseAuthorization();
app.MapControllers();

app.Run();
