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
public class FractionsController(ApplicationDbContext db) : ControllerBase
{
    private string CurrentUserId => User.FindFirstValue(ClaimTypes.NameIdentifier)!;
    private bool IsSuperUser => User.IsInRole(Roles.SuperUser);
    private bool IsResident => User.IsInRole(Roles.Resident);

    private IQueryable<int> MyFractionIds =>
        db.OwnerFractions
          .Where(of => of.Owner.UserId == CurrentUserId)
          .Select(of => of.FractionId);

    private IQueryable<int> MyCondominiumIds =>
        db.Condominiums
          .Where(c => c.Admins.Any(a => a.Id == CurrentUserId))
          .Select(c => c.Id);

    [HttpGet]
    public async Task<ActionResult<IEnumerable<FractionDto>>> GetAll([FromQuery] int? condominiumId)
    {
        var query = db.Fractions.Include(f => f.LedgerEntries).AsQueryable();

        if (condominiumId.HasValue)
            query = query.Where(f => f.CondominiumId == condominiumId.Value);

        if (IsResident)
            query = query.Where(f => MyFractionIds.Contains(f.Id));

        var fractions = await query.ToListAsync();

        return Ok(fractions.Select(f => new FractionDto(
            f.Id, f.CondominiumId, f.Block, f.Floor, f.Letter, f.Permilage,
            f.PaymentStatus.ToString())));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<FractionDto>> GetById(int id)
    {
        var f = await db.Fractions
            .Include(f => f.LedgerEntries)
            .FirstOrDefaultAsync(f => f.Id == id);

        if (f is null) return NotFound();

        if (IsResident && !await MyFractionIds.ContainsAsync(id))
            return Forbid();

        return Ok(new FractionDto(f.Id, f.CondominiumId, f.Block, f.Floor, f.Letter, f.Permilage,
            f.PaymentStatus.ToString()));
    }

    [HttpPost]
    [Authorize(Roles = $"{Roles.SuperUser},{Roles.Admin}")]
    public async Task<ActionResult<FractionDto>> Create(CreateFractionRequest request)
    {
        if (!await db.Condominiums.AnyAsync(c => c.Id == request.CondominiumId))
            return BadRequest("Condominium not found.");

        if (!IsSuperUser && !await MyCondominiumIds.ContainsAsync(request.CondominiumId))
            return Forbid();

        var fraction = new Fraction
        {
            CondominiumId = request.CondominiumId,
            Block = request.Block,
            Floor = request.Floor,
            Letter = request.Letter,
            Permilage = request.Permilage,
        };

        db.Fractions.Add(fraction);
        await db.SaveChangesAsync();

        var dto = new FractionDto(fraction.Id, fraction.CondominiumId, fraction.Block, fraction.Floor,
            fraction.Letter, fraction.Permilage, fraction.PaymentStatus.ToString());

        return CreatedAtAction(nameof(GetById), new { id = fraction.Id }, dto);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = $"{Roles.SuperUser},{Roles.Admin}")]
    public async Task<ActionResult<FractionDto>> Update(int id, UpdateFractionRequest request)
    {
        var fraction = await db.Fractions
            .Include(f => f.LedgerEntries)
            .FirstOrDefaultAsync(f => f.Id == id);

        if (fraction is null) return NotFound();

        if (!IsSuperUser && !await MyCondominiumIds.ContainsAsync(fraction.CondominiumId))
            return Forbid();

        fraction.Block = request.Block;
        fraction.Floor = request.Floor;
        fraction.Letter = request.Letter;
        fraction.Permilage = request.Permilage;

        await db.SaveChangesAsync();

        return Ok(new FractionDto(fraction.Id, fraction.CondominiumId, fraction.Block, fraction.Floor,
            fraction.Letter, fraction.Permilage, fraction.PaymentStatus.ToString()));
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = $"{Roles.SuperUser},{Roles.Admin}")]
    public async Task<IActionResult> Delete(int id)
    {
        var fraction = await db.Fractions.FirstOrDefaultAsync(f => f.Id == id);
        if (fraction is null) return NotFound();

        if (!IsSuperUser && !await MyCondominiumIds.ContainsAsync(fraction.CondominiumId))
            return Forbid();

        fraction.IsDeleted = true;

        await db.SaveChangesAsync();

        return NoContent();
    }

    [HttpGet("{id}/owners")]
    [Authorize(Roles = $"{Roles.SuperUser},{Roles.Admin}")]
    public async Task<ActionResult<IEnumerable<OwnerFractionDto>>> GetOwners(int id)
    {
        var fraction = await db.Fractions.FirstOrDefaultAsync(f => f.Id == id);
        if (fraction is null) return NotFound();

        if (!IsSuperUser && !await MyCondominiumIds.ContainsAsync(fraction.CondominiumId))
            return Forbid();

        var ownerFractions = await db.OwnerFractions
            .Include(of => of.Owner)
            .Where(of => of.FractionId == id)
            .Select(of => new OwnerFractionDto(of.OwnerId, of.Owner.Name, of.FractionId, of.IsPrincipal))
            .ToListAsync();

        return Ok(ownerFractions);
    }

    [HttpPost("{id}/owners")]
    [Authorize(Roles = $"{Roles.SuperUser},{Roles.Admin}")]
    public async Task<ActionResult<OwnerFractionDto>> AssignOwner(int id, AssignOwnerToFractionRequest request)
    {
        var fraction = await db.Fractions.FirstOrDefaultAsync(f => f.Id == id);
        if (fraction is null) return NotFound("Fraction not found.");

        if (!IsSuperUser && !await MyCondominiumIds.ContainsAsync(fraction.CondominiumId))
            return Forbid();

        if (!await db.Owners.AnyAsync(o => o.Id == request.OwnerId))
            return BadRequest("Owner not found.");

        if (await db.OwnerFractions.AnyAsync(of => of.FractionId == id && of.OwnerId == request.OwnerId))
            return Conflict("Owner is already assigned to this fraction.");

        if (request.IsPrincipal)
        {
            var existingPrincipal = await db.OwnerFractions
                .FirstOrDefaultAsync(of => of.FractionId == id && of.IsPrincipal);
            if (existingPrincipal is not null)
                existingPrincipal.IsPrincipal = false;
        }

        var ownerFraction = new OwnerFraction
        {
            FractionId = id,
            OwnerId = request.OwnerId,
            IsPrincipal = request.IsPrincipal
        };

        db.OwnerFractions.Add(ownerFraction);
        await db.SaveChangesAsync();

        var owner = await db.Owners.FirstOrDefaultAsync(o => o.Id == request.OwnerId);
        return Ok(new OwnerFractionDto(ownerFraction.OwnerId, owner!.Name, ownerFraction.FractionId, ownerFraction.IsPrincipal));
    }

    [HttpDelete("{id}/owners/{ownerId}")]
    [Authorize(Roles = $"{Roles.SuperUser},{Roles.Admin}")]
    public async Task<IActionResult> RemoveOwner(int id, int ownerId)
    {
        var fraction = await db.Fractions.FirstOrDefaultAsync(f => f.Id == id);
        if (fraction is null) return NotFound();

        if (!IsSuperUser && !await MyCondominiumIds.ContainsAsync(fraction.CondominiumId))
            return Forbid();

        var ownerFraction = await db.OwnerFractions
            .FirstOrDefaultAsync(of => of.FractionId == id && of.OwnerId == ownerId);

        if (ownerFraction is null) return NotFound();

        db.OwnerFractions.Remove(ownerFraction);
        await db.SaveChangesAsync();

        return NoContent();
    }
}
