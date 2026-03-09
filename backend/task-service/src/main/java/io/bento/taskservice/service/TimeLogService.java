package io.bento.taskservice.service;

import io.bento.taskservice.dto.request.CreateTimeLogRequest;
import io.bento.taskservice.entity.TimeLog;
import io.bento.taskservice.exception.TimeLogNotFoundException;
import io.bento.taskservice.repository.IssueRepository;
import io.bento.taskservice.repository.TimeLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TimeLogService {

    private final TimeLogRepository timeLogRepository;
    private final IssueRepository issueRepository;

    public List<TimeLog> getTimeLogs(String orgId, String issueId) {
        return timeLogRepository.findAllByOrgIdAndIssueId(orgId, issueId);
    }

    public TimeLog createTimeLog(String orgId, String userId, String issueId, CreateTimeLogRequest request) {
        // Get boardId from issue for indexing
        String boardId = issueRepository.findByOrgIdAndId(orgId, issueId)
                .map(issue -> issue.getBoardId())
                .orElse(null);

        TimeLog timeLog = TimeLog.builder()
                .orgId(orgId)
                .issueId(issueId)
                .userId(userId)
                .boardId(boardId)
                .hoursSpent(request.hoursSpent())
                .date(request.date())
                .description(request.description())
                .createdAt(Instant.now())
                .build();

        timeLog = timeLogRepository.save(timeLog);

        // Update totalTimeSpent on issue
        issueRepository.findByOrgIdAndId(orgId, issueId).ifPresent(issue -> {
            double total = issue.getTotalTimeSpent() != null ? issue.getTotalTimeSpent() : 0.0;
            issue.setTotalTimeSpent(total + request.hoursSpent());
            issueRepository.save(issue);
        });

        return timeLog;
    }

    public void deleteTimeLog(String orgId, String userId, String timeLogId) {
        TimeLog timeLog = timeLogRepository.findByOrgIdAndId(orgId, timeLogId)
                .orElseThrow(() -> new TimeLogNotFoundException(timeLogId));

        // Subtract from totalTimeSpent on issue
        issueRepository.findByOrgIdAndId(orgId, timeLog.getIssueId()).ifPresent(issue -> {
            double total = issue.getTotalTimeSpent() != null ? issue.getTotalTimeSpent() : 0.0;
            issue.setTotalTimeSpent(Math.max(0.0, total - timeLog.getHoursSpent()));
            issueRepository.save(issue);
        });

        timeLogRepository.delete(timeLog);
    }
}
