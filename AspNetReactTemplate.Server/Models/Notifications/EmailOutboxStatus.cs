namespace AspNetReactTemplate.Server.Models.Notifications;

public enum  EmailOutboxStatus 
{
    Pending = 0,
    Processing = 1,
    Sent = 2,
    Failed = 3,
    DeadLettered = 4
}

