using System.Security.Claims;
using CondoBackend.Application.DTOs;
using CondoBackend.Domain.Entities;
using CondoBackend.Infrastructure;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CondoBackend.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class QuotaConfigsController(ApplicationDbContext db) : ControllerBase
{
    private string CurrentUserId => User.FindFirstValue(ClaimTypes.NameIdentifier)!;
    private bool IsSuperUser => User.IsInRole(Roles.SuperUser);
    private bool IsResident => User.IsInRole(Roles.Resident);

    private IQueryable<int> MyFractionIds =>
        db.OwnerFractions
          .Where(of => of.Owner.UserId == CurrentUserId)
          .Select(of => of.FractionId);

    private Task<bool> IsAdminOfFractionAsync(int fractionId) =>
        db.Fractions.AnyAsync(f => f.Id == fractionId &&
            f.Condominium.Admins.Any(a => a.Id == CurrentUserId));

    [HttpGet]
    public async Task<ActionResult<IEnumerable<QuotaConfigDto>>> GetAll([FromQuery] int? fractionId)
    {
        var query = db.QuotaConfigs.AsQueryable();

        if (fractionId.HasValue)
            query = query.Where(q => q.FractionId == fractionId.Value);

        if (IsResident)
            query = query.Where(q => MyFractionIds.Contains(q.FractionId));

        var configs = await query
            .Select(q => new QuotaConfigDto(q.Id, q.FractionId, q.MonthlyValue, q.StartDate, q.EndDate, q.IsActive))
            .ToListAsync();

        return Ok(configs);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<QuotaConfigDto>> GetById(int id)
    {
        var q = await db.QuotaConfigs
            .FirstOrDefaultAsync(q => q.Id == id);

        if (q is null) return NotFound();

        if (IsResident && !await MyFractionIds.ContainsAsync(q.FractionId))
            return Forbid();

        return Ok(new QuotaConfigDto(q.Id, q.FractionId, q.MonthlyValue, q.StartDate, q.EndDate, q.IsActive));
    }

    [HttpPost]
    [Authorize(Roles = $"{Roles.SuperUser},{Roles.Admin}")]
    public async Task<ActionResult<QuotaConfigDto>> Create(CreateQuotaConfigRequest request)
    {
        if (!await db.Fractions.AnyAsync(f => f.Id == request.FractionId))
            return BadRequest("Fraction not found.");

        if (!IsSuperUser && !await IsAdminOfFractionAsync(request.FractionId))
            return Forbid();

        var config = new QuotaConfig
        {
            FractionId = request.FractionId,
            MonthlyValue = request.MonthlyValue,
            StartDate = request.StartDate,
            EndDate = request.EndDate,
            IsActive = true,
        };

        db.QuotaConfigs.Add(config);
        await db.SaveChangesAsync();

        var dto = new QuotaConfigDto(config.Id, config.FractionId, config.MonthlyValue, config.StartDate, config.EndDate, config.IsActive);
        return CreatedAtAction(nameof(GetById), new { id = config.Id }, dto);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = $"{Roles.SuperUser},{Roles.Admin}")]
    public async Task<ActionResult<QuotaConfigDto>> Update(int id, UpdateQuotaConfigRequest request)
    {
        var config = await db.QuotaConfigs.FirstOrDefaultAsync(q => q.Id == id);
        if (config is null) return NotFound();

        if (!IsSuperUser && !await IsAdminOfFractionAsync(config.FractionId))
            return Forbid();

        config.MonthlyValue = request.MonthlyValue;
        config.StartDate = request.StartDate;
        config.EndDate = request.EndDate;
        config.IsActive = request.IsActive;

        await db.SaveChangesAsync();

        return Ok(new QuotaConfigDto(config.Id, config.FractionId, config.MonthlyValue, config.StartDate, config.EndDate, config.IsActive));
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = $"{Roles.SuperUser},{Roles.Admin}")]
    public async Task<IActionResult> Delete(int id)
    {
        var config = await db.QuotaConfigs.FirstOrDefaultAsync(q => q.Id == id);
        if (config is null) return NotFound();

        if (!IsSuperUser && !await IsAdminOfFractionAsync(config.FractionId))
            return Forbid();

        config.IsDeleted = true;

        await db.SaveChangesAsync();

        return NoContent();
    }
}
