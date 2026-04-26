using System.ComponentModel.DataAnnotations;
using AspNetReactTemplate.Server.Models.Interfaces;

namespace AspNetReactTemplate.Server.Models.Entity
{
    public abstract class Entity<Tkey> : IEntity<Tkey>
    {
        [Display(Name = "ID:")]
        public Tkey Id { get; set; }
    }
}
