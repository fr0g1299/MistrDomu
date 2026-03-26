using Microsoft.EntityFrameworkCore;
using AspNetReactTemplate.Server.Data;
using AspNetReactTemplate.Server.Models.DTOs.Manuals;
using AspNetReactTemplate.Server.Models.Manuals;
using AspNetReactTemplate.Server.Services.Abstraction.Tools;
using Microsoft.AspNetCore.Authorization;
using AspNetReactTemplate.Server.Infrastracture.Identity;
using System.Security.Claims;

namespace AspNetReactTemplate.Server.Services.Implementation.Tools;

public class ToolCommandService : IToolCommandService
{
    private readonly AppDbContext _context;
    private readonly IAuthorizationService _authorizationService;

    public ToolCommandService(AppDbContext context, IAuthorizationService authorizationService)
    {
        _context = context;
        _authorizationService = authorizationService;
    }

    public async Task<ToolCreateDto> CreateToolAsync(int manualId, ToolCreateDto toolDto, ClaimsPrincipal user)
    {
        var authorizationResult = await _authorizationService.AuthorizeAsync(user, AuthorizationPolicies.CanEditTools);
        if (!authorizationResult.Succeeded)
        {
            throw new UnauthorizedAccessException("User is not authorized to create tools.");
        }

        var manual = await _context.Manuals.FindAsync(manualId);
        if (manual == null)
        {
            throw new KeyNotFoundException($"Manual s ID {manualId} nebyl nalezen.");
        }

        var newTool = new Tool
        (
            toolDto.Name,
            toolDto.Url,
            toolDto.Note
        );

        newTool.Manuals.Add(manual);

        _context.Tools.Add(newTool);
        await _context.SaveChangesAsync();

        return toolDto;
    }

    public async Task<ToolUpdateDto> UpdateToolAsync(int id, ToolUpdateDto toolDto, ClaimsPrincipal user)
    {
        var authorizationResult = await _authorizationService.AuthorizeAsync(user, AuthorizationPolicies.CanEditTools);

        if (!authorizationResult.Succeeded)
        {
            throw new UnauthorizedAccessException("User is not authorized to update tools.");
        }

        var existingTool = await _context.Tools.FindAsync(id);
        if (existingTool == null)
        {
            throw new InvalidOperationException("Tool not found.");
        }

        existingTool.Name = toolDto.Name;
        existingTool.Url = toolDto.Url;

        await _context.SaveChangesAsync();

        return toolDto;
    }

    public async Task<bool> DeleteToolAsync(int toolId, ClaimsPrincipal user)
    {
        var authorizationResult = await _authorizationService.AuthorizeAsync(user, AuthorizationPolicies.CanEditTools);

        if (!authorizationResult.Succeeded)
        {
            throw new UnauthorizedAccessException("User is not authorized to delete tools.");
        }

        var tool = await _context.Tools.FindAsync(toolId);
        if (tool == null)
        {
            return false;
        }

        _context.Tools.Remove(tool);
        await _context.SaveChangesAsync();
        return true;
    }
}