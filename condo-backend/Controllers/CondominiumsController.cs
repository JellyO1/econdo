using System.Security.Claims;
using CondoBackend.Application.DTOs;
using CondoBackend.Domain.Entities;
using CondoBackend.Infrastructure;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CondoBackend.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CondominiumsController(ApplicationDbContext db, UserManager<ApplicationUser> userManager) : ControllerBase
{
    private string CurrentUserId => User.FindFirstValue(ClaimTypes.NameIdentifier)!;
    private bool IsSuperUser => User.IsInRole(Roles.SuperUser);
    private bool IsResident => User.IsInRole(Roles.Resident);

    private IQueryable<int> MyCondominiumIdsAsResident =>
        db.OwnerFractions
            .Where(of => of.Owner.UserId == CurrentUserId)
            .Select(of => of.Fraction.CondominiumId)
            .Distinct();

    private static CondominiumDto ToDto(Condominium c) =>
        new(c.Id, c.Name, c.Address, c.NIF, c.IBAN,
            c.Admins.Select(a => new CondominiumAdminDto(a.Id, a.Email!)));

    [HttpGet]
    public async Task<ActionResult<IEnumerable<CondominiumDto>>> GetAll()
    {
        var query = db.Condominiums.Include(c => c.Admins).AsQueryable();

        if (IsResident)
            query = query.Where(c => MyCondominiumIdsAsResident.Contains(c.Id));
        else if (!IsSuperUser)
            query = query.Where(c => c.Admins.Any(a => a.Id == CurrentUserId));

        var condominiums = await query.ToListAsync();
        return Ok(condominiums.Select(ToDto));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<CondominiumDto>> GetById(int id)
    {
        var condominium = await db.Condominiums
            .Include(c => c.Admins)
            .FirstOrDefaultAsync(c => c.Id == id);

        if (condominium is null) return NotFound();

        if (IsResident && !await MyCondominiumIdsAsResident.ContainsAsync(id))
            return Forbid();

        if (!IsSuperUser && !IsResident && condominium.Admins.All(a => a.Id != CurrentUserId))
            return Forbid();

        return Ok(ToDto(condominium));
    }

    [HttpPost]
    [Authorize(Roles = $"{Roles.SuperUser}")]
    public async Task<ActionResult<CondominiumDto>> Create(CreateCondominiumRequest request)
    {
        var condominium = new Condominium
        {
            Name = request.Name,
            Address = request.Address,
            NIF = request.NIF,
            IBAN = request.IBAN,
            Admins = []
        };

        db.Condominiums.Add(condominium);
        await db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = condominium.Id }, ToDto(condominium));
    }

    [HttpPut("{id}")]
    [Authorize(Roles = $"{Roles.SuperUser},{Roles.Admin}")]
    public async Task<ActionResult<CondominiumDto>> Update(int id, UpdateCondominiumRequest request)
    {
        var condominium = await db.Condominiums
            .Include(c => c.Admins)
            .FirstOrDefaultAsync(c => c.Id == id);

        if (condominium is null) return NotFound();

        if (!IsSuperUser && condominium.Admins.All(a => a.Id != CurrentUserId))
            return Forbid();

        condominium.Name = request.Name;
        condominium.Address = request.Address;
        condominium.NIF = request.NIF;
        condominium.IBAN = request.IBAN;
        await db.SaveChangesAsync();

        return Ok(ToDto(condominium));
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = Roles.SuperUser)]
    public async Task<IActionResult> Delete(int id)
    {
        var condominium = await db.Condominiums.FirstOrDefaultAsync(c => c.Id == id);
        if (condominium is null) return NotFound();

        condominium.IsDeleted = true;

        await db.SaveChangesAsync();

        return NoContent();
    }

    [HttpPost("{id}/admins/{userId}")]
    [Authorize(Roles = Roles.SuperUser)]
    public async Task<IActionResult> AssignAdmin(int id, string userId)
    {
        var condominium = await db.Condominiums
            .Include(c => c.Admins)
            .FirstOrDefaultAsync(c => c.Id == id);

        if (condominium is null) return NotFound();

        var user = await userManager.FindByIdAsync(userId);
        if (user is null) return NotFound();

        if (condominium.Admins.Any(a => a.Id == userId))
            return Conflict();

        condominium.Admins.Add(user);
        await db.SaveChangesAsync();

        return NoContent();
    }

    [HttpDelete("{id}/admins/{userId}")]
    [Authorize(Roles = Roles.SuperUser)]
    public async Task<IActionResult> RemoveAdmin(int id, string userId)
    {
        var condominium = await db.Condominiums
            .Include(c => c.Admins)
            .FirstOrDefaultAsync(c => c.Id == id);

        if (condominium is null) return NotFound();

        var admin = condominium.Admins.FirstOrDefault(a => a.Id == userId);
        if (admin is null) return NotFound();

        condominium.Admins.Remove(admin);
        await db.SaveChangesAsync();

        return NoContent();
    }
}
