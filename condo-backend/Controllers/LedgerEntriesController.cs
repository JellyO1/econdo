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
public class LedgerEntriesController(ApplicationDbContext db) : ControllerBase
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
    public async Task<ActionResult<IEnumerable<LedgerEntryDto>>> GetAll(
        [FromQuery] int? fractionId,
        [FromQuery] LedgerEntryStatus? status)
    {
        var query = db.LedgerEntries.Include(e => e.PrincipalOwner).AsQueryable();

        if (fractionId.HasValue)
            query = query.Where(e => e.FractionId == fractionId.Value);

        if (status.HasValue)
            query = query.Where(e => e.Status == status.Value);

        if (IsResident)
            query = query.Where(e => MyFractionIds.Contains(e.FractionId));

        var entries = await query
            .Select(e => new LedgerEntryDto(
                e.Id, e.FractionId, e.PrincipalOwnerId, e.PrincipalOwner.Name,
                e.Type.ToString(), e.Amount, e.DueDate, e.Status.ToString()))
            .ToListAsync();

        return Ok(entries);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<LedgerEntryDto>> GetById(int id)
    {
        var e = await db.LedgerEntries
            .Include(e => e.PrincipalOwner)
            .FirstOrDefaultAsync(e => e.Id == id);

        if (e is null) return NotFound();

        if (IsResident && !await MyFractionIds.ContainsAsync(e.FractionId))
            return Forbid();

        return Ok(new LedgerEntryDto(e.Id, e.FractionId, e.PrincipalOwnerId, e.PrincipalOwner.Name,
            e.Type.ToString(), e.Amount, e.DueDate, e.Status.ToString()));
    }

    [HttpPost]
    [Authorize(Roles = $"{Roles.SuperUser},{Roles.Admin}")]
    public async Task<ActionResult<LedgerEntryDto>> Create(CreateLedgerEntryRequest request)
    {
        if (!await db.Fractions.AnyAsync(f => f.Id == request.FractionId))
            return BadRequest("Fraction not found.");

        if (!IsSuperUser && !await IsAdminOfFractionAsync(request.FractionId))
            return Forbid();

        if (!await db.Owners.AnyAsync(o => o.Id == request.PrincipalOwnerId))
            return BadRequest("Owner not found.");

        var entry = new LedgerEntry
        {
            FractionId = request.FractionId,
            PrincipalOwnerId = request.PrincipalOwnerId,
            Type = request.Type,
            Amount = request.Amount,
            DueDate = request.DueDate,
            Status = LedgerEntryStatus.Pending,
        };

        db.LedgerEntries.Add(entry);
        await db.SaveChangesAsync();

        await db.Entry(entry).Reference(e => e.PrincipalOwner).LoadAsync();

        var dto = new LedgerEntryDto(entry.Id, entry.FractionId, entry.PrincipalOwnerId, entry.PrincipalOwner.Name,
            entry.Type.ToString(), entry.Amount, entry.DueDate, entry.Status.ToString());

        return CreatedAtAction(nameof(GetById), new { id = entry.Id }, dto);
    }

    [HttpPatch("{id}/status")]
    [Authorize(Roles = $"{Roles.SuperUser},{Roles.Admin}")]
    public async Task<ActionResult<LedgerEntryDto>> UpdateStatus(int id, UpdateLedgerEntryStatusRequest request)
    {
        var entry = await db.LedgerEntries
            .Include(e => e.PrincipalOwner)
            .FirstOrDefaultAsync(e => e.Id == id);

        if (entry is null) return NotFound();

        if (!IsSuperUser && !await IsAdminOfFractionAsync(entry.FractionId))
            return Forbid();

        entry.Status = request.Status;

        await db.SaveChangesAsync();

        return Ok(new LedgerEntryDto(entry.Id, entry.FractionId, entry.PrincipalOwnerId, entry.PrincipalOwner.Name,
            entry.Type.ToString(), entry.Amount, entry.DueDate, entry.Status.ToString()));
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = $"{Roles.SuperUser},{Roles.Admin}")]
    public async Task<IActionResult> Delete(int id)
    {
        var entry = await db.LedgerEntries.FirstOrDefaultAsync(e => e.Id == id);
        if (entry is null) return NotFound();

        if (!IsSuperUser && !await IsAdminOfFractionAsync(entry.FractionId))
            return Forbid();

        entry.IsDeleted = true;

        await db.SaveChangesAsync();

        return NoContent();
    }
}
