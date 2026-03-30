package io.bento.notificationservice.service;

import io.bento.notificationservice.config.NotificationProperties;
import io.bento.kafka.event.EmailVerificationRequestedEvent;
import io.bento.kafka.event.InvitationCreatedEvent;
import io.bento.kafka.event.PasswordResetRequestedEvent;
import io.bento.kafka.event.UserRegisteredEvent;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;
    private final TemplateEngine templateEngine;
    private final NotificationProperties notificationProperties;

    @Async
    public void sendWelcomeEmail(UserRegisteredEvent event) {
        Context ctx = new Context();
        ctx.setVariable("firstName", event.firstName());
        ctx.setVariable("email", event.email());
        send(event.email(), "Welcome to Bento!", "email/welcome", ctx);
    }

    @Async
    public void sendVerificationEmail(EmailVerificationRequestedEvent event) {
        Context ctx = new Context();
        ctx.setVariable("token", event.token());
        ctx.setVariable("expiresAt", event.expiresAt());
        ctx.setVariable("verifyUrl", notificationProperties.mail().frontendUrl() + "/verify-email?token=" + event.token());
        send(event.email(), "Verify your email", "email/email-verification", ctx);
    }

    @Async
    public void sendPasswordResetEmail(PasswordResetRequestedEvent event) {
        Context ctx = new Context();
        ctx.setVariable("token", event.token());
        ctx.setVariable("expiresAt", event.expiresAt());
        ctx.setVariable("resetUrl", notificationProperties.mail().frontendUrl() + "/reset-password?token=" + event.token());
        send(event.email(), "Reset your password", "email/password-reset", ctx);
    }

    @Async
    public void sendInvitationEmail(InvitationCreatedEvent event) {
        Context ctx = new Context();
        ctx.setVariable("firstName", "there");   // invitee may not be registered yet
        ctx.setVariable("orgName", event.orgName());
        ctx.setVariable("role", event.role());
        ctx.setVariable("expiresAt", event.expiresAt());
        ctx.setVariable("inviteUrl", notificationProperties.mail().frontendUrl() + "/invite?token=" + event.token());
        send(event.inviteeEmail(), "You've been invited to " + event.orgName(), "email/org-invitation", ctx);
    }

    private void send(String to, String subject, String template, Context ctx) {
        try {
            String html = templateEngine.process(template, ctx);
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(notificationProperties.mail().from(), notificationProperties.mail().fromName());
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(html, true);
            mailSender.send(message);
            log.debug("Email sent: template={} to={}", template, to);
        } catch (MessagingException | java.io.UnsupportedEncodingException e) {
            log.error("Failed to send email: template={} to={}", template, to, e);
        }
    }
}
