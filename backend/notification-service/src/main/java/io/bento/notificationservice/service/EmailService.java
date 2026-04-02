package io.bento.notificationservice.service;

import io.bento.notificationservice.client.AuthServiceClient;
import io.bento.notificationservice.config.NotificationProperties;
import io.bento.notificationservice.dto.response.UserInfoDto;
import io.bento.kafka.event.*;
import io.bento.notificationservice.dto.response.SprintEndingSoonDto;
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

import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;
    private final TemplateEngine templateEngine;
    private final NotificationProperties notificationProperties;
    private final AuthServiceClient authServiceClient;

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

    @Async
    public void sendIssueAssigned(IssueAssignedEvent event) {
        Map<String, UserInfoDto> users = authServiceClient.batchGetUsers(
                List.of(event.assigneeId(), event.assignedByUserId()));
        UserInfoDto recipient = users.get(event.assigneeId());
        if (recipient == null) return;
        UserInfoDto actor = users.get(event.assignedByUserId());

        Context ctx = new Context();
        ctx.setVariable("firstName", recipient.firstName());
        ctx.setVariable("issueKey", event.issueKey());
        ctx.setVariable("issueTitle", event.issueTitle());
        ctx.setVariable("assignedBy", actor != null ? actor.firstName() : "Someone");
        ctx.setVariable("issueUrl", frontendUrl() + "/boards/" + event.boardId() + "?issue=" + event.issueId());
        send(recipient.email(), event.issueKey() + " assigned to you", "email/issue-assigned", ctx);
    }

    @Async
    public void sendIssueMentioned(IssueCommentedEvent event, String recipientId) {
        Map<String, UserInfoDto> users = authServiceClient.batchGetUsers(
                List.of(recipientId, event.authorUserId()));
        UserInfoDto recipient = users.get(recipientId);
        if (recipient == null) return;
        UserInfoDto actor = users.get(event.authorUserId());

        Context ctx = new Context();
        ctx.setVariable("firstName", recipient.firstName());
        ctx.setVariable("issueKey", event.issueKey());
        ctx.setVariable("issueTitle", event.issueTitle());
        ctx.setVariable("mentionedBy", actor != null ? actor.firstName() : "Someone");
        ctx.setVariable("issueUrl", frontendUrl() + "/boards/" + event.boardId() + "?issue=" + event.issueId());
        send(recipient.email(), "You were mentioned in " + event.issueKey(), "email/issue-mentioned", ctx);
    }

    @Async
    public void sendIssuePriorityEscalated(IssuePriorityChangedEvent event) {
        Map<String, UserInfoDto> users = authServiceClient.batchGetUsers(
                List.of(event.assigneeId(), event.changedByUserId()));
        UserInfoDto recipient = users.get(event.assigneeId());
        if (recipient == null) return;
        UserInfoDto actor = users.get(event.changedByUserId());

        Context ctx = new Context();
        ctx.setVariable("firstName", recipient.firstName());
        ctx.setVariable("issueKey", event.issueKey());
        ctx.setVariable("issueTitle", event.issueTitle());
        ctx.setVariable("newPriority", event.newPriority());
        ctx.setVariable("oldPriority", event.oldPriority());
        ctx.setVariable("changedBy", actor != null ? actor.firstName() : "Someone");
        ctx.setVariable("issueUrl", frontendUrl() + "/boards/" + event.boardId() + "?issue=" + event.issueId());
        send(recipient.email(), event.issueKey() + " priority escalated to " + event.newPriority(),
                "email/issue-priority-escalated", ctx);
    }

    @Async
    public void sendSprintDueSoon(SprintEndingSoonDto sprint, String memberId) {
        Map<String, UserInfoDto> users = authServiceClient.batchGetUsers(List.of(memberId));
        UserInfoDto recipient = users.get(memberId);
        if (recipient == null) return;

        Context ctx = new Context();
        ctx.setVariable("firstName", recipient.firstName());
        ctx.setVariable("sprintName", sprint.sprintName());
        ctx.setVariable("endDate", sprint.endDate());
        ctx.setVariable("sprintUrl", frontendUrl() + "/boards/" + sprint.boardId() + "/backlog");
        send(recipient.email(), "Sprint ending soon: " + sprint.sprintName(), "email/sprint-due-soon", ctx);
    }

    @Async
    public void sendBoardMemberAdded(BoardMemberAddedEvent event) {
        Map<String, UserInfoDto> users = authServiceClient.batchGetUsers(
                List.of(event.userId().toString(), event.addedByUserId().toString()));
        UserInfoDto recipient = users.get(event.userId().toString());
        if (recipient == null) return;
        UserInfoDto actor = users.get(event.addedByUserId().toString());

        Context ctx = new Context();
        ctx.setVariable("firstName", recipient.firstName());
        ctx.setVariable("boardName", event.boardName());
        ctx.setVariable("boardRole", event.boardRole());
        ctx.setVariable("addedBy", actor != null ? actor.firstName() : "Someone");
        ctx.setVariable("boardUrl", frontendUrl() + "/boards/" + event.boardId());
        send(recipient.email(), "You've been added to " + event.boardName(), "email/board-member-added", ctx);
    }

    private String frontendUrl() {
        return notificationProperties.mail().frontendUrl();
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
