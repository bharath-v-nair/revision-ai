using System.Globalization;
using Microsoft.EntityFrameworkCore;
using RevisionAI.Infrastructure.Data;
using Serilog;

// Configure Serilog with explicit console sink
Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Information()
    .WriteTo.Console(formatProvider: CultureInfo.InvariantCulture)
    .CreateLogger();

try
{
    Log.Information("Starting RevisionAI API...");

    WebApplicationBuilder builder = WebApplication.CreateBuilder(args);

    // Use Serilog for ASP.NET logging
    builder.Host.UseSerilog();

    // Add services
    builder.Services.AddControllers();
    builder.Services.AddEndpointsApiExplorer();
    builder.Services.AddSwaggerGen();

    // Database — PostgreSQL via EF Core
    builder.Services.AddDbContext<AppDbContext>(options =>
        options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

    // TODO: Add authentication (Phase 0.3)
    // TODO: Add CORS for Angular frontend

    WebApplication app = builder.Build();

    // Configure pipeline
    if (app.Environment.IsDevelopment())
    {
        app.UseSwagger();
        app.UseSwaggerUI();
    }

    app.UseSerilogRequestLogging();
    app.MapControllers();

    Log.Information("RevisionAI API running on {Url}", app.Urls.FirstOrDefault() ?? "http://localhost:5242");
    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "Application terminated unexpectedly");
}
finally
{
    Log.CloseAndFlush();
}
