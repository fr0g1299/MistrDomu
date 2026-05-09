using AspNetReactTemplate.Server.Models.Identity;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;

namespace AspNetReactTemplate.Server.Infrastracture.Identity.Handlers;

public sealed class ExcludeRoleRequirementHandler : AuthorizationHandler<ExcludeRoleRequirement>
{
	private readonly UserManager<User> _userManager;

	public ExcludeRoleRequirementHandler(UserManager<User> userManager)
	{
		_userManager = userManager;
	}

	protected override async Task HandleRequirementAsync(
		AuthorizationHandlerContext context,
		ExcludeRoleRequirement requirement)
	{
		var userId = _userManager.GetUserId(context.User);
		if (string.IsNullOrWhiteSpace(userId))
		{
			return;
		}

		var user = await _userManager.FindByIdAsync(userId);
		if (user is null)
		{
			return;
		}

		var isInRole = await _userManager.IsInRoleAsync(user, requirement.RoleName);
		if (!isInRole)
		{
			context.Succeed(requirement);
		}
	}
}


