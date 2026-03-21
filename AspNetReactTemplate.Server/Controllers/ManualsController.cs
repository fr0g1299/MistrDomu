using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AspNetReactTemplate.Server.Data;
using AspNetReactTemplate.Server.Models;
using Microsoft.AspNetCore.Authorization;

namespace AspNetReactTemplate.Server.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public class ManualsController : ControllerBase
{
    private readonly AppDbContext _context;

    public ManualsController(AppDbContext context)
    {
        _context = context;
    }

    // GET: api/Manuals
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Manual>>> GetManuals()
    {
        return await _context.Manuals.ToListAsync();
    }

    // GET: api/Manuals/5
    [HttpGet("{id}")]
    public async Task<ActionResult<Manual>> GetManual(int id)
    {
        var manual = await _context.Manuals.FindAsync(id);

        if (manual == null) return NotFound();

        return manual;
    }

    // GET: api/Manuals/{query}
    [HttpGet("search/{query}")]
    public async Task<ActionResult<IEnumerable<Manual>>> SearchManuals(string query)
    {
        var manuals = await _context.Manuals.Where(m => m.Title.Contains(query) || m.Description.Contains(query)).ToListAsync();
        
        return manuals;
    }
}