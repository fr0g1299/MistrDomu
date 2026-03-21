using AspNetReactTemplate.Server.Models.DTOs.Identity;
using AspNetReactTemplate.Server.Models.Identity;
using AspNetReactTemplate.Server.Services.Abstraction.Identity.Register;
using Microsoft.AspNetCore.Identity;

namespace AspNetReactTemplate.Server.Services.Implementation.Identity.Register 
{
    public class RegisterService: IRegisterService
    {
        private readonly UserManager<User> _userManager;
        private readonly RoleManager<Role> _roleManager;
        private readonly string _defaultRoleName;


        public RegisterService(UserManager<User> userManager, RoleManager<Role> roleManager,
            IConfiguration configuration)
        {
            _userManager = userManager;
            _roleManager = roleManager;
            _defaultRoleName = configuration["Roles:DefaultUserRole"] ?? "User";


        }

        public async Task<IdentityResult> RegisterAsync(UserRegisterDto vm)
        {
            var role = await _roleManager.FindByNameAsync(_defaultRoleName);
            var user = new User()
            {
                UserName = vm.Email,
                Email = vm.Email,
                FirstName = vm.FirstName,
                LastName = vm.LastName,
            };

            var result = await _userManager.CreateAsync(user, vm.Password);
            if (!result.Succeeded)
            {
                return result;
            }
            var roleResult = await _userManager.AddToRoleAsync(user, role.Name);
            if (!roleResult.Succeeded)
            {
                return roleResult;
            }

            return IdentityResult.Success;
        }
    }
}