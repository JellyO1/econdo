using CondoBackend.Application.DTOs;
using CondoBackend.Domain.Entities;
using CondoBackend.Infrastructure;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CondoBackend.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = $"{Roles.SuperUser},{Roles.Admin}")]
public class OwnersController(ApplicationDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<OwnerDto>>> GetAll()
    {
        var owners = await db.Owners
            .Select(o => new OwnerDto(o.Id, o.Name, o.NIF, o.Email, o.Contact))
            .ToListAsync();

        return Ok(owners);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<OwnerDto>> GetById(int id)
    {
        var o = await db.Owners
            .Where(o => o.Id == id)
            .Select(o => new OwnerDto(o.Id, o.Name, o.NIF, o.Email, o.Contact))
            .FirstOrDefaultAsync();

        if (o is null) return NotFound();

        return Ok(o);
    }

    [HttpPost]
    public async Task<ActionResult<OwnerDto>> Create(CreateOwnerRequest request)
    {
        var owner = new Owner
        {
            Name = request.Name,
            NIF = request.NIF,
            Email = request.Email,
            Contact = request.Contact,
        };

        db.Owners.Add(owner);
        await db.SaveChangesAsync();

        var dto = new OwnerDto(owner.Id, owner.Name, owner.NIF, owner.Email, owner.Contact);
        return CreatedAtAction(nameof(GetById), new { id = owner.Id }, dto);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<OwnerDto>> Update(int id, UpdateOwnerRequest request)
    {
        var owner = await db.Owners.FirstOrDefaultAsync(o => o.Id == id);
        if (owner is null) return NotFound();

        owner.Name = request.Name;
        owner.NIF = request.NIF;
        owner.Email = request.Email;
        owner.Contact = request.Contact;

        await db.SaveChangesAsync();

        return Ok(new OwnerDto(owner.Id, owner.Name, owner.NIF, owner.Email, owner.Contact));
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var owner = await db.Owners.FirstOrDefaultAsync(o => o.Id == id);
        if (owner is null) return NotFound();

        owner.IsDeleted = true;

        await db.SaveChangesAsync();

        return NoContent();
    }
}
