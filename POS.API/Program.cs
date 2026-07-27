using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using POS.Application.Services;
using POS.Core.Interfaces;
using POS.Infrastructure.Data;
using POS.Infrastructure.Data.Seed;
using POS.Infrastructure.ExternalServices;
using POS.Infrastructure.Repositories;
using POS.API.Middleware;

var builder = WebApplication.CreateBuilder(args);

// 1. Add DB Context (SQLite)
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection")));

// 2. Register Repositories and Services
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IProductRepository, ProductRepository>();
builder.Services.AddScoped<ISaleRepository, SaleRepository>();
builder.Services.AddScoped<IInventoryRepository, InventoryRepository>();
builder.Services.AddScoped<IAlertRepository, AlertRepository>();
builder.Services.AddScoped<IAnalyticsRepository, AnalyticsRepository>();
builder.Services.AddHttpClient<IExternalBarcodeService, OpenFoodFactsBarcodeService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IProductService, ProductService>();
builder.Services.AddScoped<ISaleService, SaleService>();
builder.Services.AddScoped<IInventoryService, InventoryService>();
builder.Services.AddScoped<IAlertService, AlertService>();
builder.Services.AddScoped<IAnalyticsService, AnalyticsService>();

builder.Services.AddHealthChecks();

// 3. JWT Authentication Configuration
var jwtKey = builder.Configuration["Jwt:Key"] ?? "SUPER_SECRET_POS_JWT_SIGNING_KEY_2026_CHANGE_IN_PROD!";
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "POSApi";
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "POSClient";

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtIssuer,
        ValidAudience = jwtAudience,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
    };
});

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("OwnerOnly", policy => policy.RequireRole("Owner"));
    options.AddPolicy("OwnerOrWorker", policy => policy.RequireRole("Owner", "Worker"));
});

// 4. CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.SetIsOriginAllowed(_ => true)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});


builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

// 5. Swagger with Bearer Token Authorization UI
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "POS System REST API", Version = "v1" });
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Example: \"Authorization: Bearer {token}\"",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

var app = builder.Build();

// Seed database on startup
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await DataSeeder.SeedAsync(context);
}

// Enable Exception Middleware
app.UseMiddleware<ExceptionMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowFrontend");
app.UseAuthentication();
app.UseAuthorization();
app.MapHealthChecks("/health");
app.MapControllers();

// Redirect root to Swagger UI so localhost:5000 is not a dead 404
app.MapGet("/", () => Results.Redirect("/swagger")).ExcludeFromDescription();

app.Run();
