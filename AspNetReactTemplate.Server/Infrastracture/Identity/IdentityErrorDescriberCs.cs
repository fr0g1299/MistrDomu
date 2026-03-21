using Microsoft.AspNetCore.Identity;

namespace AspNetReactTemplate.Server.Infrastracture.Identity
{
    public class IdentityErrorDescriberCs : IdentityErrorDescriber
    {

        public override IdentityError PasswordMismatch()
        {
            return new IdentityError
            {
                Code = nameof(PasswordMismatch),
                Description = "Hesla se neshodují"
            };
        }

        public override IdentityError PasswordRequiresDigit()
        {
            return new IdentityError
            {
                Code = nameof(PasswordRequiresDigit),
                Description = "Heslo musí obsahovat alespoň jednu číslici"
            };
        }

        public override IdentityError PasswordRequiresLower()
        {
            return new IdentityError
            {
                Code = nameof(PasswordRequiresLower),
                Description = "Heslo musí obsahovat alespoň jedno malé písmeno"
            };
        }

        public override IdentityError PasswordRequiresNonAlphanumeric()
        {
            return new IdentityError
            {
                Code = nameof(PasswordRequiresNonAlphanumeric),
                Description = "Heslo musí obsahovat alespoň jeden speciální znak"
            };
        }

        public override  IdentityError PasswordRequiresUniqueChars(int uniqueChars)
        {
            return new IdentityError
            {
                Code = nameof(PasswordRequiresUniqueChars),
                Description = $"Heslo musí obsahovat alespoň {uniqueChars} unikátních znaků"
            };
        }

        public  override IdentityError PasswordRequiresUpper()
        {
            return new IdentityError
            {
                Code = nameof(PasswordRequiresUpper),
                Description = "Heslo musí obsahovat alespoň jedno velké písmeno"
            };
        }

        public override IdentityError PasswordTooShort(int length)
        {
            return new IdentityError
            {
                Code = nameof(PasswordTooShort),
                Description = $"Heslo musí mít alespoň {length} znaků"
            };
        }

        public override IdentityError DefaultError()
        {
            return new IdentityError
            {
                Code = nameof(DefaultError),
                Description = "Nastala chyba"
            };
        }

        public override IdentityError InvalidEmail(string? email)
        {
            return new IdentityError
            {
                Code = nameof(InvalidEmail),
                Description = $"Email '{email}' není platný"
            };
        }

        public override IdentityError InvalidRoleName(string? role)
        {
            return new IdentityError
            {
                Code = nameof(InvalidRoleName),
                Description = $"Role '{role}' není platná"
            };
        }

        public override IdentityError DuplicateRoleName(string role)
        {
            return new IdentityError
            {
                Code = nameof(DuplicateRoleName),
                Description = $"Role '{role}' je již použitá"
            };
        }

        public override IdentityError LoginAlreadyAssociated()
        {
            return new IdentityError
            {
                Code = nameof(LoginAlreadyAssociated),
                Description = "Uživatel s tímto přihlašovacím údajem je již přihlášen"
            };
        }

        public override IdentityError UserAlreadyHasPassword()
        {
            return new IdentityError
            {
                Code = nameof(UserAlreadyHasPassword),
                Description = "Uživatel již má heslo"
            };
        }

        public override IdentityError UserAlreadyInRole(string role)
        {
            return new IdentityError
            {
                Code = nameof(UserAlreadyInRole),
                Description = $"Uživatel je již v roli '{role}'"
            };
        }
        
        public override IdentityError UserLockoutNotEnabled()
        {
            return new IdentityError
            {
                Code = nameof(UserLockoutNotEnabled),
                Description = "Uživatel nemá povolené uzamčení"
            };
        }

        public override IdentityError UserNotInRole(string role)
        {
            return new IdentityError
            {
                Code = nameof(UserNotInRole),
                Description = $"Uživatel není v roli '{role}'"
            };
        }

        public override IdentityError DuplicateEmail(string email)
        {
            return new IdentityError
            {
                Code = nameof(DuplicateEmail),
                Description = $"Email '{email}' je již použitý"
            };
        }
        public override IdentityError DuplicateUserName(string? userName)
        {
            return new IdentityError
            {
                Code = nameof(DuplicateUserName),
                Description = $"Uživatelské jméno '{userName}' je již použité"
            };
        }
        
        public override IdentityError InvalidUserName(string? userName)
        {
            return new IdentityError
            {
                Code = nameof(InvalidUserName),
                Description = $"Uživatelské jméno '{userName}' není platné"
            };
        }
        
        public override IdentityError InvalidToken()
        {
            return new IdentityError
            {
                Code = nameof(InvalidToken),
                Description = "Neplatný token"
            };
        }
        
        public override IdentityError RecoveryCodeRedemptionFailed()
        {
            return new IdentityError
            {
                Code = nameof(RecoveryCodeRedemptionFailed),
                Description = "Obnovení kódu selhalo"
            };
        }
        
        public override IdentityError ConcurrencyFailure()
        {
            return new IdentityError
            {
                Code = nameof(ConcurrencyFailure),
                Description = "Došlo k souběžnému konfliktu"
            };
        }
    }
}