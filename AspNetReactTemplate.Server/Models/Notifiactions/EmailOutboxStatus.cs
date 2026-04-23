namespace AspNetReactTemplate.Server.Models.Notifiactions;

public enum  EmailOutboxStatus 
{
    Pending = 0,
    Processing = 1,
    Sent = 2,
    Failed = 3,
    DeadLettered = 4
}

