using System.Globalization;
using System.Text;
using FluentValidation;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using RevisionAI.Application.Auth.Validators;
using RevisionAI.Application.Common.Interfaces;
using RevisionAI.Infrastructure.Data;
using RevisionAI.Infrastructure.Services;
using Serilog;

// Configure Serilog with explicit console sink
Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Information()
    .WriteTo.Console(formatProvider: CultureInfo.InvariantCulture)
    .CreateLogger();

try
{
    string[] cliArgs = args;

    // ---- CLI seeding mode: dotnet run -- --seed anaesthesia ----
    if (cliArgs.Contains("--seed"))
    {
        await RunSeeder(cliArgs);
        return 0;
    }

    await RunApiServer(cliArgs);
    return 0;
}
catch (Exception ex)
{
    Log.Fatal(ex, "Application terminated unexpectedly");
    return 1;
}
finally
{
    Log.CloseAndFlush();
}

static async Task RunSeeder(string[] cliArgs)
{
    Log.Information("CLI seeding mode activated.");

    string subjectName = cliArgs
        .SkipWhile(a => a != "--seed")
        .Skip(1)
        .FirstOrDefault() ?? "anaesthesia";

    WebApplicationBuilder builder = WebApplication.CreateBuilder([]);
    builder.Host.UseSerilog();

    builder.Services.AddDbContext<AppDbContext>(options =>
        options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

    WebApplication app = builder.Build();

    using IServiceScope scope = app.Services.CreateScope();
    AppDbContext dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    ILogger<AppDbContext> logger = scope.ServiceProvider.GetRequiredService<ILogger<AppDbContext>>();

    (int inserted, int skipped) = await SeedQuestions.SeedSubjectAsync(dbContext, logger, subjectName);
    Log.Information("Seeding completed: {Inserted} inserted, {Skipped} skipped", inserted, skipped);
}

static async Task RunApiServer(string[] cliArgs)
{
    Log.Information("Starting RevisionAI API...");

    WebApplicationBuilder builder = WebApplication.CreateBuilder(cliArgs);

    // Use Serilog for ASP.NET logging
    builder.Host.UseSerilog();

    // Add services
    builder.Services.AddControllers();
    builder.Services.AddEndpointsApiExplorer();
    builder.Services.AddSwaggerGen();

    // Database — PostgreSQL via EF Core
    builder.Services.AddDbContext<AppDbContext>(options =>
        options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

    // Register AppDbContext as the IAppDbContext interface
    builder.Services.AddScoped<IAppDbContext>(sp => sp.GetRequiredService<AppDbContext>());

    // MediatR
    builder.Services.AddMediatR(cfg => cfg.RegisterServicesFromAssemblyContaining<IAppDbContext>());

    // FluentValidation
    builder.Services.AddValidatorsFromAssemblyContaining<GoogleLoginRequestValidator>();

    // Infrastructure Services
    builder.Services.AddSingleton<JwtTokenService>();
    builder.Services.AddSingleton<IJwtTokenService>(sp => sp.GetRequiredService<JwtTokenService>());
    builder.Services.AddSingleton<RefreshTokenService>();
    builder.Services.AddSingleton<IRefreshTokenService>(sp => sp.GetRequiredService<RefreshTokenService>());
    builder.Services.AddHttpClient<GoogleAuthService>();
    builder.Services.AddSingleton<IGoogleAuthService>(sp => sp.GetRequiredService<GoogleAuthService>());
    builder.Services.AddMemoryCache();
    builder.Services.AddSingleton<OtpService>();
    builder.Services.AddSingleton<IOtpService>(sp => sp.GetRequiredService<OtpService>());

    // Background Services
    builder.Services.AddHostedService<HourlyQuestionService>();

    // Authentication — JWT Bearer
    string? jwtKey = builder.Configuration["Jwt:Key"];
    string? jwtIssuer = builder.Configuration["Jwt:Issuer"];
    string? jwtAudience = builder.Configuration["Jwt:Audience"];

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
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey!))
        };
    });

    builder.Services.AddAuthorization();

    WebApplication app = builder.Build();

    // Middleware: Catch FluentValidation exceptions and return 400 instead of 500
    app.Use(async (context, next) =>
    {
        try
        {
            await next(context);
        }
        catch (FluentValidation.ValidationException ex)
        {
            context.Response.StatusCode = StatusCodes.Status400BadRequest;
            context.Response.ContentType = "application/json";
            var errors = ex.Errors.Select(e => e.ErrorMessage).ToList();
            await context.Response.WriteAsJsonAsync(new
            {
                title = "Validation Error",
                detail = string.Join("; ", errors),
                status = StatusCodes.Status400BadRequest
            });
        }
    });

    // Configure pipeline
    if (app.Environment.IsDevelopment())
    {
        app.UseSwagger();
        app.UseSwaggerUI();
    }

    app.UseSerilogRequestLogging();
    app.UseAuthentication();
    app.UseAuthorization();
    app.MapControllers();

    Log.Information("RevisionAI API running on {Url}", app.Urls.FirstOrDefault() ?? "http://localhost:5242");
    await app.RunAsync();
}