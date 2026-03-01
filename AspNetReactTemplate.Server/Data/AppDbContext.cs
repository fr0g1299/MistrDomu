using Microsoft.EntityFrameworkCore;
using AspNetReactTemplate.Server.Models;

namespace AspNetReactTemplate.Server.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        public DbSet<WaitlistEmail> WaitlistEmails { get; set; }
    }
}
