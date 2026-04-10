using System.Net;
using System.Net.Mail;
using CondoBackend.Domain.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Options;

namespace CondoBackend.Infrastructure.Email;

public class SmtpEmailSender(IOptions<SmtpOptions> options) : IEmailSender<ApplicationUser>
{
    private readonly SmtpOptions _options = options.Value;

    public Task SendConfirmationLinkAsync(ApplicationUser user, string email, string confirmationLink) =>
        SendAsync(email, $"Confirme o seu email - {_options.FromName}", $"""
            <p>Oi, {user.UserName}!</p>
            <p>
                Sua conta no {_options.FromName} está quase pronta. Para ativá-la, por favor confirme
                o seu endereço de email clicando no link abaixo.
            </p>
            <p><a href="{confirmationLink}">Ativar minha conta</a></p>
            <p>Sua conta não será ativada até que seu email seja confirmado.</p>
            <p>
                Se você não se cadastrou no {_options.FromName} recentemente,
                por favor ignore este email.
            </p>
            """);

    public Task SendPasswordResetLinkAsync(ApplicationUser user, string email, string resetLink) =>
        SendAsync(email, $"Redefina a sua senha - {_options.FromName}", $"""
            <p>Oi, {user.UserName}!</p>
            <p>Recebemos um pedido para redefinir a senha da sua conta no {_options.FromName}.</p>
            <p><a href="{resetLink}">Redefinir minha senha</a></p>
            <p>
                Se você não solicitou a redefinição de senha, por favor ignore este email.
                A sua senha não será alterada.
            </p>
            """);

    public Task SendPasswordResetCodeAsync(ApplicationUser user, string email, string resetCode) =>
        SendAsync(email, $"Código de redefinição de senha - {_options.FromName}", $"""
            <p>Oi, {user.UserName}!</p>
            <p>Recebemos um pedido para redefinir a senha da sua conta no {_options.FromName}.</p>
            <p>O seu código de redefinição de senha é: <strong>{resetCode}</strong></p>
            <p>
                Se você não solicitou a redefinição de senha, por favor ignore este email.
                A sua senha não será alterada.
            </p>
            """);

    private async Task SendAsync(string toAddress, string subject, string htmlBody)
    {
        using var client = new SmtpClient(_options.Host, _options.Port)
        {
            Credentials = new NetworkCredential(_options.Username, _options.Password),
            EnableSsl = _options.UseSsl,
        };

        var from = new MailAddress(_options.FromAddress, _options.FromName);
        var to = new MailAddress(toAddress);

        using var message = new MailMessage(from, to)
        {
            Subject = subject,
            Body = htmlBody,
            IsBodyHtml = true,
        };

        await client.SendMailAsync(message);
    }
}
