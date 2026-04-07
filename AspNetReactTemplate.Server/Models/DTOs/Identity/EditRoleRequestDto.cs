using System.ComponentModel.DataAnnotations;

namespace AspNetReactTemplate.Server.Models.DTOs.Identity;

public sealed record EditRoleRequestDto([param: Required] string Role);
