using CondoBackend.Domain.Entities;
using CondoBackend.Infrastructure;
using CondoBackend.Infrastructure.Email;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddHttpContextAccessor();
builder.Services.AddControllers();
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();
builder.Services.AddEndpointsApiExplorer();

// Add DbContext and Identity services
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseInMemoryDatabase("CondoDb"));

builder.Services.Configure<IdentityOptions>(options =>
{
    options.SignIn.RequireConfirmedEmail = true;
});

builder.Services.Configure<SmtpOptions>(builder.Configuration.GetSection(SmtpOptions.Section));
builder.Services.AddTransient<IEmailSender<ApplicationUser>, SmtpEmailSender>();

builder.Services.AddIdentityApiEndpoints<ApplicationUser>()
.AddRoles<IdentityRole<string>>()
.AddEntityFrameworkStores<ApplicationDbContext>()
.AddDefaultTokenProviders();

// Add Authentication and Authorization middleware support
builder.Services.AddAuthentication();
builder.Services.AddAuthorization();

var app = builder.Build();

// Configure the superuser and roles
await DatabaseSeeder.SeedAsync(app);

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.UseSwaggerUI(options =>
    {
        options.SwaggerEndpoint("/openapi/v1.json", "v1");
    });
}

app.UseHttpsRedirection();

app.UseAuthentication();
app.UseAuthorization();

app.Use(async (context, next) =>
{
    if (HttpMethods.IsPost(context.Request.Method) &&
        context.Request.Path.StartsWithSegments("/account/register"))
    {
        if (!context.User.IsInRole(Roles.SuperUser))
        {
            context.Response.StatusCode = context.User.Identity?.IsAuthenticated == true
                ? StatusCodes.Status403Forbidden
                : StatusCodes.Status401Unauthorized;
            return;
        }
    }
    await next(context);
});

app.MapGroup("/account")
    .MapIdentityApi<ApplicationUser>();

app.MapControllers();

app.Run();